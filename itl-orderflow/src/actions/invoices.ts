"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationForUsers } from "@/lib/notifications";
import { InvoiceStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const log = logger.create("Invoices");
import { sendInvoiceNotification } from "@/actions/notifications";
import { requireAuth, requireRole } from "@/lib/auth-guard";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

const createInvoiceSchema = z.object({
  orderId: z.string().min(1),
  clientId: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  currency: z.string().default("TJS"),
  notes: z.string().optional(),
});

// Get invoices
export async function getInvoices(params?: {
  search?: string;
  status?: string;
  clientId?: string;
  orderId?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, status, clientId, orderId, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(orderId && { orderId }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [invoices, total, totals] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        order: { select: { id: true, title: true, number: true } },
        _count: { select: { items: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      totalAmount: Number(inv.total),
      paidAmount: Number(inv.paidAmount),
      currency: inv.currency,
    })),
    total,
    totalAmount: Number(totals._sum.total || 0),
    paidAmount: Number(totals._sum.paidAmount || 0),
  };
}

// Get single invoice
export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      items: { orderBy: { position: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    totalAmount: Number(invoice.total),
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    discountAmount: Number(invoice.discountAmount),
    paidAmount: Number(invoice.paidAmount),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
    payments: invoice.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
  };
}

// Create invoice
export async function createInvoice(
  data: z.infer<typeof createInvoiceSchema>,
  items: z.infer<typeof invoiceItemSchema>[]
) {
  await requireAuth();
  const validated = createInvoiceSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  if (!items.length) {
    return { error: "Добавьте хотя бы одну позицию" };
  }

  try {
    // Atomic invoice number generation
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const invoiceNumber = `${settings.invoicePrefix}-${new Date().getFullYear()}-${String(
      settings.nextInvoiceNumber - 1
    ).padStart(3, "0")}`;

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        orderId: validated.data.orderId,
        clientId: validated.data.clientId,
        issueDate: new Date(validated.data.issueDate),
        dueDate: new Date(validated.data.dueDate),
        currency: validated.data.currency,
        subtotal: totalAmount,
        discountAmount: 0,
        taxAmount: 0,
        total: totalAmount,
        notes: validated.data.notes,
        status: "DRAFT",
        items: {
          create: items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            position: idx,
          })),
        },
      },
    });

    revalidatePath("/finance");
    revalidatePath(`/orders/${validated.data.orderId}`);
    return { success: true, invoice };
  } catch (error) {
    log.error("Error creating invoice", error);
    return { error: "Ошибка при создании счёта" };
  }
}

// Update invoice (full edit)
export async function updateInvoice(
  id: string,
  data: {
    issueDate?: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    discountPercent?: number;
    taxPercent?: number;
  },
  items?: z.infer<typeof invoiceItemSchema>[]
) {
  await requireAuth();
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { error: "Счёт не найден" };

    const updateData: any = {};
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.currency) updateData.currency = data.currency;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    if (items) {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = data.discountPercent ? subtotal * (data.discountPercent / 100) : 0;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = data.taxPercent ? afterDiscount * (data.taxPercent / 100) : 0;
      const total = afterDiscount + taxAmount;

      updateData.subtotal = subtotal;
      updateData.discountAmount = discountAmount;
      updateData.taxAmount = taxAmount;
      updateData.total = total;

      // Delete old items and create new ones
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await prisma.invoiceItem.createMany({
        data: items.map((item, idx) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          position: idx,
        })),
      });
    }

    await prisma.invoice.update({ where: { id }, data: updateData });

    revalidatePath("/finance");
    revalidatePath(`/finance/${id}`);
    revalidatePath(`/orders/${invoice.orderId}`);
    return { success: true };
  } catch (error) {
    log.error("Error updating invoice", error);
    return { error: "Ошибка при обновлении счёта" };
  }
}

// Update invoice status
export async function updateInvoiceStatus(id: string, status: string) {
  try {
    await requireAuth();
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: status as InvoiceStatus,
      },
    });

    // Notify admins/managers
    const statusLabels: Record<string, string> = {
      DRAFT: "Черновик", SENT: "Отправлен", VIEWED: "Просмотрен",
      PAID: "Оплачен", PARTIALLY_PAID: "Частично оплачен",
      OVERDUE: "Просрочен", CANCELLED: "Отменён",
    };
    const adminsAndManagers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    createNotificationForUsers(adminsAndManagers.map((u) => u.id), {
      type: "STATUS",
      title: "Статус счёта изменён",
      description: `${invoice.number} — ${statusLabels[status] ?? status}`,
      linkUrl: `/finance/${id}`,
      entityType: "invoice",
      entityId: id,
    });

    // Send email to client when invoice is sent
    if (status === "SENT") {
      sendInvoiceNotification(id);
    }

    revalidatePath("/finance");
    revalidatePath(`/orders/${invoice.orderId}`);
    return { success: true, invoice };
  } catch (error) {
    log.error("Error updating invoice status", error);
    return { error: "Ошибка при обновлении статуса" };
  }
}

// Record payment
export async function recordPayment(
  invoiceId: string,
  data: { amount: number; paymentMethod: string; reference?: string; date: string }
) {
  try {
    await requireAuth();
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return { error: "Счёт не найден" };

    const currentPaid = Number(invoice.paidAmount) || 0;
    const invoiceTotal = Number(invoice.total);
    const newPaidAmount = currentPaid + data.amount;
    const newStatus =
      newPaidAmount >= invoiceTotal ? "PAID" : "PARTIALLY_PAID";

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          paymentDate: new Date(data.date),
        },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          ...(newStatus === "PAID" ? { paidAt: new Date() } : {}),
        },
      }),
    ]);

    // Notify admins/managers about payment
    const adminsAndManagers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    createNotificationForUsers(adminsAndManagers.map((u) => u.id), {
      type: "STATUS",
      title: "Платёж зарегистрирован",
      description: `${invoice.number} — ${data.amount} ${invoice.currency} (${newStatus === "PAID" ? "оплачен полностью" : "частичная оплата"})`,
      linkUrl: `/finance/${invoiceId}`,
      entityType: "invoice",
      entityId: invoiceId,
    });

    revalidatePath("/finance");
    revalidatePath(`/orders/${invoice.orderId}`);
    return { success: true };
  } catch (error) {
    log.error("Error recording payment", error);
    return { error: "Ошибка при записи платежа" };
  }
}

// Delete invoice
export async function deleteInvoice(id: string) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);
    const invoice = await prisma.invoice.delete({ where: { id } });
    revalidatePath("/finance");
    revalidatePath(`/orders/${invoice.orderId}`);
    return { success: true };
  } catch (error) {
    log.error("Error deleting invoice", error);
    return { error: "Ошибка при удалении счёта" };
  }
}
