"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createNotificationForUsers, getOrderNotificationRecipients } from "@/lib/notifications";
import { requireAuth } from "@/lib/auth-guard";
import { formatDate } from "@/lib/utils";
import { getPortalSessionFromCookie } from "@/lib/portal-session";

// Get portal dashboard data (only queries sections the contact can see)
export async function getPortalDashboard() {
  const session = await getPortalSessionFromCookie();
  if (!session) {
    return {
      orders: [],
      activeOrders: [],
      invoices: [],
      proposals: [],
      pendingProposals: 0,
      stats: {
        totalOrders: 0,
        activeCount: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        outstanding: 0,
      },
    };
  }

  const clientId = session.client.id;
  const permissions = session.permissions;

  const [orders, invoices, proposals] = await Promise.all([
    permissions.canViewProjects
      ? prisma.order.findMany({
          where: { clientId },
          include: {
            status: true,
            tasks: { select: { status: true } },
            milestones: {
              select: {
                tasks: { select: { status: true } },
              },
            },
            _count: { select: { tasks: true, milestones: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    permissions.canViewFinance
      ? prisma.invoice.findMany({
          where: { clientId },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    permissions.canViewProposals
      ? prisma.proposal.findMany({
          where: {
            clientId,
            status: { not: "DRAFT" },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  // Calculate stats
  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status?.code || "")
  );

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const pendingProposals = proposals.filter((p) =>
    ["SENT", "VIEWED"].includes(p.status)
  );

  return {
    orders,
    activeOrders,
    invoices,
    proposals: proposals.map((p) => ({ ...p, totalAmount: Number(p.totalAmount) })),
    pendingProposals: pendingProposals.length,
    stats: {
      totalOrders: orders.length,
      activeCount: activeOrders.length,
      totalInvoiced,
      totalPaid,
      outstanding: totalInvoiced - totalPaid,
    },
  };
}

// Get portal order detail
export async function getPortalOrder(orderId: string) {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProjects) return null;

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: session.client.id },
    include: {
      status: true,
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
        orderBy: { position: "asc" },
      },
      milestones: {
        include: {
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
            orderBy: { position: "asc" },
          },
          files: {
            where: { isClientVisible: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { position: "asc" },
      },
      comments: {
        where: { isPortalVisible: true },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      files: {
        where: { isClientVisible: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return order;
}

// Get portal documents: contracts, amendments, tech specs, reconciliation acts
export type PortalDocumentType = "CONTRACT" | "AMENDMENT" | "TECH_SPEC" | "RECONCILIATION";

export interface PortalDocument {
  id: string;
  type: PortalDocumentType;
  number: string;
  title: string;
  date: Date;
  status: string;
  pdfUrl: string | null;
}

export async function getPortalDocuments(): Promise<PortalDocument[]> {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewDocuments) return [];
  const clientId = session.client.id;

  const [contracts, techSpecs, reconciliations] = await Promise.all([
    prisma.contract.findMany({
      where: { clientId, status: { not: "DRAFT" } },
      include: { amendments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.techSpec.findMany({
      where: { clientId, status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reconciliation.findMany({
      where: { clientId, status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const documents: PortalDocument[] = [
    ...contracts.map((c) => ({
      id: c.id,
      type: "CONTRACT" as const,
      number: c.number,
      title: c.title,
      date: c.contractDate,
      status: c.status,
      pdfUrl: c.generatedPdfUrl,
    })),
    ...contracts.flatMap((c) =>
      c.amendments
        .filter((a) => a.status !== "DRAFT")
        .map((a) => ({
          id: a.id,
          type: "AMENDMENT" as const,
          number: a.number,
          title: a.title,
          date: a.effectiveDate,
          status: a.status,
          pdfUrl: a.generatedPdfUrl,
        }))
    ),
    ...techSpecs.map((t) => ({
      id: t.id,
      type: "TECH_SPEC" as const,
      number: t.number,
      title: t.title,
      date: t.approvedDate ?? t.createdAt,
      status: t.status,
      pdfUrl: t.generatedPdfUrl,
    })),
    ...reconciliations.map((r) => ({
      id: r.id,
      type: "RECONCILIATION" as const,
      number: r.number,
      title: `Акт сверки за период ${formatDate(r.periodFrom)} — ${formatDate(r.periodTo)}`,
      date: r.generatedDate,
      status: r.status,
      pdfUrl: r.generatedPdfUrl,
    })),
  ];

  documents.sort((a, b) => b.date.getTime() - a.date.getTime());

  return documents;
}

// Add portal comment
export async function addPortalComment(
  orderId: string,
  content: string
) {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProjects) {
    return { error: "Доступ запрещён" };
  }

  try {
    // Verify the order belongs to this client
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId: session.client.id },
    });

    if (!order) {
      return { error: "Заказ не найден" };
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        orderId,
        isPortalVisible: true,
        isInternal: false,
        clientName: session.client.name,
      },
    });

    // Notify team about client comment
    const recipients = await getOrderNotificationRecipients(orderId);
    createNotificationForUsers(recipients, {
      type: "COMMENT",
      title: "Комментарий от клиента",
      description: `${session.client.name}: "${content.substring(0, 80)}${content.length > 80 ? "..." : ""}"`,
      linkUrl: `/orders/${orderId}`,
      entityType: "comment",
      entityId: comment.id,
    });

    revalidatePath(`/portal/orders/${orderId}`);
    return { success: true, comment };
  } catch (error) {
    console.error("Error adding portal comment:", error);
    return { error: "Ошибка" };
  }
}

// Approve milestone
export async function approveMilestone(milestoneId: string) {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProjects) {
    return { error: "Доступ запрещён" };
  }

  try {
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        order: { clientId: session.client.id },
      },
    });

    if (!milestone) {
      return { error: "Этап не найден" };
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "APPROVED",
        clientApprovedAt: new Date(),
      },
    });

    // Notify team about milestone approval
    const milestoneDetails = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { title: true, order: { select: { number: true } } },
    });
    const recipients = await getOrderNotificationRecipients(milestone.orderId);
    createNotificationForUsers(recipients, {
      type: "STATUS",
      title: "Этап согласован клиентом",
      description: `«${milestoneDetails?.title}» — заказ ${milestoneDetails?.order?.number}`,
      linkUrl: `/orders/${milestone.orderId}`,
      entityType: "milestone",
      entityId: milestoneId,
    });

    revalidatePath(`/portal/orders/${milestone.orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error approving milestone:", error);
    return { error: "Ошибка при согласовании" };
  }
}

// Reject milestone (client sends back for revisions)
export async function rejectMilestone(milestoneId: string, comment: string) {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProjects) {
    return { error: "Доступ запрещён" };
  }

  try {
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        order: { clientId: session.client.id },
        status: "COMPLETED",
      },
      include: {
        order: { select: { id: true, number: true, clientId: true } },
      },
    });

    if (!milestone) {
      return { error: "Этап не найден или не может быть отклонён" };
    }

    // Revert milestone to IN_PROGRESS
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "IN_PROGRESS",
        completedAt: null,
        clientApprovedAt: null,
      },
    });

    // Save rejection comment
    if (comment.trim()) {
      await prisma.comment.create({
        data: {
          content: `[Отклонение этапа «${milestone.title}»] ${comment}`,
          orderId: milestone.orderId,
          clientName: session.client.name,
          clientEmail: session.client.email,
          isInternal: false,
          isPortalVisible: true,
        },
      });
    }

    // Notify team
    const recipients = await getOrderNotificationRecipients(milestone.orderId);
    createNotificationForUsers(recipients, {
      type: "STATUS",
      title: "Клиент отклонил этап",
      description: `«${milestone.title}» — заказ ${milestone.order?.number}. Причина: ${comment.slice(0, 100)}`,
      linkUrl: `/orders/${milestone.orderId}`,
      entityType: "milestone",
      entityId: milestoneId,
    });

    revalidatePath(`/portal/orders/${milestone.orderId}`);
    revalidatePath(`/orders/${milestone.orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting milestone:", error);
    return { error: "Ошибка при отклонении этапа" };
  }
}

// Get portal proposals (only non-draft ones)
export async function getPortalProposals() {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProposals) return [];

  const proposals = await prisma.proposal.findMany({
    where: {
      clientId: session.client.id,
      status: { not: "DRAFT" },
    },
    include: {
      order: { select: { id: true, title: true, number: true } },
      items: { orderBy: { position: "asc" } },
      sections: { orderBy: { position: "asc" } },
      payments: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return proposals.map((p) => ({
    ...p,
    totalAmount: Number(p.totalAmount),
    items: p.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
    payments: p.payments.map((pay) => ({
      ...pay,
      percentage: Number(pay.percentage),
      amount: Number(pay.amount),
    })),
  }));
}

// Get single portal proposal
export async function getPortalProposal(proposalId: string) {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProposals) return null;

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      clientId: session.client.id,
      status: { not: "DRAFT" },
    },
    include: {
      client: true,
      order: { select: { id: true, title: true, number: true } },
      items: { orderBy: { position: "asc" } },
      sections: { orderBy: { position: "asc" } },
      payments: { orderBy: { position: "asc" } },
    },
  });

  if (!proposal) return null;

  // Mark as viewed if status is SENT
  if (proposal.status === "SENT") {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "VIEWED", viewedAt: new Date() },
    });
    revalidatePath(`/proposals/${proposalId}`);
  }

  return {
    ...proposal,
    totalAmount: Number(proposal.totalAmount),
    items: proposal.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    })),
    payments: proposal.payments.map((p) => ({
      ...p,
      percentage: Number(p.percentage),
      amount: Number(p.amount),
    })),
  };
}

// Client responds to proposal (accept/reject)
export async function respondToProposal(
  proposalId: string,
  response: "ACCEPTED" | "REJECTED"
) {
  const session = await getPortalSessionFromCookie();
  if (!session || !session.permissions.canViewProposals) {
    return { error: "Доступ запрещён" };
  }

  try {
    const proposal = await prisma.proposal.findFirst({
      where: {
        id: proposalId,
        clientId: session.client.id,
        status: { in: ["SENT", "VIEWED"] },
      },
      include: {
        items: { orderBy: { position: "asc" } },
      },
    });

    if (!proposal) {
      return { error: "КП не найдено" };
    }

    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: response,
        respondedAt: new Date(),
      },
    });

    // Notify team about proposal response
    const adminsAndManagers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    createNotificationForUsers(adminsAndManagers.map((u) => u.id), {
      type: "STATUS",
      title: response === "ACCEPTED" ? "КП принято клиентом" : "КП отклонено клиентом",
      description: `${session.client.name}: ${proposal.title}`,
      linkUrl: `/proposals/${proposalId}`,
      entityType: "proposal",
      entityId: proposalId,
    });

    // If accepted, auto-create order and invoice
    if (response === "ACCEPTED") {
      // Find initial order status
      const initialStatus = await prisma.orderStatus.findFirst({
        where: { isInitial: true },
      });

      // Atomic order number generation
      const orderSettings = await prisma.settings.update({
        where: { id: "default" },
        data: { nextOrderNumber: { increment: 1 } },
      });
      const orderNumber = `${orderSettings.orderPrefix}-${new Date().getFullYear()}-${String(
        orderSettings.nextOrderNumber - 1
      ).padStart(3, "0")}`;

      // Create order from proposal
      const order = await prisma.order.create({
        data: {
          number: orderNumber,
          title: proposal.title,
          clientId: proposal.clientId,
          statusId: initialStatus?.id || "",
          currency: proposal.currency,
          estimatedBudget: proposal.totalAmount,
          priority: "MEDIUM",
        },
      });

      // Link proposal to order
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { orderId: order.id },
      });

      // Atomic invoice number generation
      const invoiceSettings = await prisma.settings.update({
        where: { id: "default" },
        data: { nextInvoiceNumber: { increment: 1 } },
      });
      const invoiceNumber = `${invoiceSettings.invoicePrefix}-${new Date().getFullYear()}-${String(
        invoiceSettings.nextInvoiceNumber - 1
      ).padStart(3, "0")}`;

      const totalAmount = proposal.items.reduce(
        (sum, item) => sum + Number(item.total),
        0
      );

      // Create invoice from proposal items
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

      await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          clientId: proposal.clientId,
          orderId: order.id,
          issueDate: new Date(),
          dueDate,
          currency: proposal.currency,
          subtotal: totalAmount,
          discountAmount: 0,
          taxAmount: 0,
          total: totalAmount,
          status: "SENT",
          items: {
            create: proposal.items.map((item, idx) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              total: Number(item.total),
              position: idx,
            })),
          },
        },
      });

      revalidatePath("/orders");
      revalidatePath("/finance");
      revalidatePath("/portal");
      revalidatePath("/portal/invoices");
    }

    revalidatePath(`/portal/proposals/${proposalId}`);
    revalidatePath(`/portal/proposals`);
    revalidatePath(`/proposals/${proposalId}`);
    revalidatePath(`/proposals`);
    return { success: true };
  } catch (error) {
    console.error("Error responding to proposal:", error);
    return { error: "Ошибка при ответе на КП" };
  }
}

// Generate (or regenerate) a portal token for one client contact
export async function generateContactPortalToken(contactId: string, clientId: string) {
  await requireAuth();
  try {
    const token = crypto.randomBytes(32).toString("hex");

    await prisma.clientContact.update({
      where: { id: contactId },
      data: { portalToken: token },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true, token };
  } catch (error) {
    console.error("Error generating contact portal token:", error);
    return { error: "Ошибка при генерации токена" };
  }
}

// Update a contact's portal enabled flag and section permissions
export async function updateContactPortalPermissions(
  contactId: string,
  clientId: string,
  data: {
    portalEnabled: boolean;
    canViewProjects: boolean;
    canViewProposals: boolean;
    canViewFinance: boolean;
    canViewDocuments: boolean;
    canViewTickets: boolean;
  }
) {
  await requireAuth();
  try {
    await prisma.clientContact.update({
      where: { id: contactId },
      data,
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating contact portal permissions:", error);
    return { error: "Ошибка при обновлении прав доступа" };
  }
}

// Turn off portal access without clearing permissions (so re-enabling restores them)
export async function revokeContactPortalAccess(contactId: string, clientId: string) {
  await requireAuth();
  try {
    await prisma.clientContact.update({
      where: { id: contactId },
      data: { portalEnabled: false },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error("Error revoking contact portal access:", error);
    return { error: "Ошибка при отзыве доступа" };
  }
}
