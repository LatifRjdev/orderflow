"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { ReconciliationStatus } from "@prisma/client";

const createReconciliationSchema = z.object({
  clientId: z.string().min(1),
  periodFrom: z.string().min(1),
  periodTo: z.string().min(1),
  currency: z.string().default("TJS"),
  openingBalance: z.coerce.number().default(0),
});

export async function getReconciliations(params?: {
  search?: string;
  status?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, status, clientId, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [reconciliations, total] = await Promise.all([
    prisma.reconciliation.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.reconciliation.count({ where }),
  ]);

  return {
    reconciliations: reconciliations.map((r) => ({
      ...r,
      openingBalance: Number(r.openingBalance),
      closingBalance: Number(r.closingBalance),
    })),
    total,
  };
}

export async function getReconciliation(id: string) {
  const rec = await prisma.reconciliation.findUnique({
    where: { id },
    include: {
      client: true,
      entries: { orderBy: { position: "asc" } },
    },
  });

  if (!rec) return null;

  return {
    ...rec,
    openingBalance: Number(rec.openingBalance),
    closingBalance: Number(rec.closingBalance),
    entries: rec.entries.map((e) => ({
      ...e,
      debit: Number(e.debit),
      credit: Number(e.credit),
      balance: Number(e.balance),
    })),
  };
}

export async function createReconciliation(data: z.infer<typeof createReconciliationSchema>) {
  await requireAuth();
  const validated = createReconciliationSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const periodFrom = new Date(validated.data.periodFrom);
    const periodTo = new Date(validated.data.periodTo);
    const openingBalance = validated.data.openingBalance;

    // Auto-populate entries from invoices and payments
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: validated.data.clientId,
        issueDate: { gte: periodFrom, lte: periodTo },
      },
      orderBy: { issueDate: "asc" },
    });

    const payments = await prisma.payment.findMany({
      where: {
        invoice: { clientId: validated.data.clientId },
        paymentDate: { gte: periodFrom, lte: periodTo },
      },
      include: { invoice: { select: { number: true } } },
      orderBy: { paymentDate: "asc" },
    });

    // Merge and sort by date
    type EntryData = {
      date: Date;
      description: string;
      debit: number;
      credit: number;
      invoiceId: string | null;
    };

    const allEntries: EntryData[] = [];

    for (const inv of invoices) {
      allEntries.push({
        date: inv.issueDate,
        description: `Счёт ${inv.number}`,
        debit: Number(inv.total),
        credit: 0,
        invoiceId: inv.id,
      });
    }

    for (const pay of payments) {
      allEntries.push({
        date: pay.paymentDate,
        description: `Оплата по счёту ${pay.invoice.number}${pay.reference ? ` (${pay.reference})` : ""}`,
        debit: 0,
        credit: Number(pay.amount),
        invoiceId: null,
      });
    }

    allEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Compute running balance
    let runningBalance = openingBalance;
    const entriesWithBalance = allEntries.map((e, i) => {
      runningBalance = runningBalance + e.debit - e.credit;
      return { ...e, balance: runningBalance, position: i };
    });

    const closingBalance = runningBalance;

    // Generate number
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextReconciliationNumber: { increment: 1 } },
    });
    const recNumber = `${settings.reconciliationPrefix}-${new Date().getFullYear()}-${String(
      settings.nextReconciliationNumber - 1
    ).padStart(3, "0")}`;

    const reconciliation = await prisma.reconciliation.create({
      data: {
        number: recNumber,
        clientId: validated.data.clientId,
        periodFrom,
        periodTo,
        generatedDate: new Date(),
        openingBalance,
        closingBalance,
        currency: validated.data.currency,
        entries: {
          create: entriesWithBalance.map((e) => ({
            date: e.date,
            description: e.description,
            debit: e.debit,
            credit: e.credit,
            balance: e.balance,
            invoiceId: e.invoiceId,
            position: e.position,
          })),
        },
      },
    });

    revalidatePath("/documents");
    return { success: true, id: reconciliation.id };
  } catch (error) {
    return { error: "Ошибка при создании акта сверки" };
  }
}

export async function updateReconciliationStatus(id: string, status: ReconciliationStatus) {
  await requireAuth();

  try {
    await prisma.reconciliation.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/reconciliations/${id}`);
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при обновлении статуса" };
  }
}

export async function deleteReconciliation(id: string) {
  await requireRole(["ADMIN", "MANAGER"]);

  try {
    await prisma.reconciliation.delete({ where: { id } });
    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    return { error: "Ошибка при удалении акта сверки" };
  }
}
