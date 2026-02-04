"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { createNotificationForUsers } from "@/lib/notifications";
import { TicketStatus } from "@prisma/client";

// ==================== PORTAL ACTIONS ====================

export async function getPortalTickets(clientId: string) {
  const tickets = await prisma.ticket.findMany({
    where: { clientId },
    include: {
      order: { select: { id: true, number: true, title: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED").length;

  return {
    tickets,
    stats: { total, open, inProgress, resolved },
  };
}

export async function getPortalTicket(clientId: string, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, clientId },
    include: {
      order: { select: { id: true, number: true, title: true } },
      messages: {
        where: { isInternal: false },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return ticket;
}

export async function createPortalTicket(
  clientId: string,
  data: {
    subject: string;
    description: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    orderId?: string;
  },
  clientName: string
) {
  try {
    if (!data.subject.trim() || !data.description.trim()) {
      return { error: "Заполните тему и описание" };
    }

    // Verify order belongs to client if provided
    if (data.orderId) {
      const order = await prisma.order.findFirst({
        where: { id: data.orderId, clientId },
      });
      if (!order) {
        return { error: "Заказ не найден" };
      }
    }

    // Atomic ticket number generation
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextTicketNumber: { increment: 1 } },
    });
    const ticketNumber = `${settings.ticketPrefix}-${new Date().getFullYear()}-${String(
      settings.nextTicketNumber - 1
    ).padStart(3, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        number: ticketNumber,
        subject: data.subject.trim(),
        description: data.description.trim(),
        priority: data.priority || "MEDIUM",
        clientId,
        orderId: data.orderId || null,
      },
    });

    // Notify ADMIN + MANAGER
    const adminsAndManagers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    createNotificationForUsers(adminsAndManagers.map((u) => u.id), {
      type: "TICKET",
      title: "Новое обращение от клиента",
      description: `${clientName}: «${data.subject}»`,
      linkUrl: `/tickets/${ticket.id}`,
      entityType: "ticket",
      entityId: ticket.id,
    });

    revalidatePath("/portal/tickets");
    revalidatePath("/tickets");
    return { success: true, ticket };
  } catch (error) {
    console.error("Error creating portal ticket:", error);
    return { error: "Ошибка при создании обращения" };
  }
}

export async function addPortalTicketMessage(
  clientId: string,
  ticketId: string,
  content: string,
  clientName: string
) {
  try {
    if (!content.trim()) {
      return { error: "Введите сообщение" };
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, clientId },
    });

    if (!ticket) {
      return { error: "Обращение не найдено" };
    }

    await prisma.ticketMessage.create({
      data: {
        ticketId,
        content: content.trim(),
        isFromClient: true,
        clientName,
      },
    });

    // Reopen if resolved (but not if closed — closed is final)
    if (ticket.status === "RESOLVED") {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "OPEN", resolvedAt: null },
      });
    }

    // Notify team
    const recipientIds = new Set<string>();
    if (ticket.assigneeId) recipientIds.add(ticket.assigneeId);
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });
    admins.forEach((u) => recipientIds.add(u.id));

    createNotificationForUsers(Array.from(recipientIds), {
      type: "TICKET",
      title: "Сообщение от клиента в обращении",
      description: `${clientName}: «${content.substring(0, 80)}${content.length > 80 ? "..." : ""}»`,
      linkUrl: `/tickets/${ticketId}`,
      entityType: "ticket",
      entityId: ticketId,
    });

    revalidatePath(`/portal/tickets/${ticketId}`);
    revalidatePath(`/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding portal ticket message:", error);
    return { error: "Ошибка при отправке сообщения" };
  }
}

// Get client's orders for ticket form dropdown
export async function getPortalOrders(clientId: string) {
  return prisma.order.findMany({
    where: { clientId },
    select: { id: true, number: true, title: true },
    orderBy: { createdAt: "desc" },
  });
}

// ==================== DASHBOARD ACTIONS ====================

export async function getTickets(params?: {
  search?: string;
  status?: string;
  clientId?: string;
  assigneeId?: string;
  priority?: string;
}) {
  await requireAuth();

  const where: any = {};

  if (params?.search) {
    where.OR = [
      { subject: { contains: params.search, mode: "insensitive" } },
      { number: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params?.status) {
    where.status = params.status;
  }
  if (params?.clientId) {
    where.clientId = params.clientId;
  }
  if (params?.assigneeId) {
    where.assigneeId = params.assigneeId;
  }
  if (params?.priority) {
    where.priority = params.priority;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      order: { select: { id: true, number: true, title: true } },
      assignee: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { tickets, total: tickets.length };
}

export async function getTicket(ticketId: string) {
  await requireAuth();

  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      client: { select: { id: true, name: true } },
      order: { select: { id: true, number: true, title: true } },
      assignee: { select: { id: true, name: true } },
      messages: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  await requireAuth();

  try {
    const data: any = { status };
    if (status === "RESOLVED") {
      data.resolvedAt = new Date();
    } else if (status === "CLOSED") {
      data.closedAt = new Date();
    } else {
      data.resolvedAt = null;
      data.closedAt = null;
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data,
    });

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    revalidatePath("/portal/tickets");
    return { success: true };
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return { error: "Ошибка при обновлении статуса" };
  }
}

export async function assignTicket(ticketId: string, userId: string | null) {
  await requireAuth();

  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId: userId },
      include: { client: { select: { name: true } } },
    });

    if (userId) {
      createNotificationForUsers([userId], {
        type: "TICKET",
        title: "Вам назначено обращение",
        description: `«${ticket.subject}» от ${ticket.client.name}`,
        linkUrl: `/tickets/${ticketId}`,
        entityType: "ticket",
        entityId: ticketId,
      });
    }

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath("/tickets");
    return { success: true };
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return { error: "Ошибка при назначении" };
  }
}

export async function addTicketMessage(
  ticketId: string,
  content: string,
  isInternal: boolean
) {
  const session = await requireAuth();

  try {
    if (!content.trim()) {
      return { error: "Введите сообщение" };
    }

    await prisma.ticketMessage.create({
      data: {
        ticketId,
        content: content.trim(),
        userId: session.user.id,
        isFromClient: false,
        isInternal,
      },
    });

    // Auto-set to IN_PROGRESS if replying (non-internal) to an OPEN ticket
    if (!isInternal) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { status: true },
      });
      if (ticket?.status === "OPEN") {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath(`/portal/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding ticket message:", error);
    return { error: "Ошибка при отправке сообщения" };
  }
}

// Get all users for assignee dropdown
export async function getTeamUsers() {
  await requireAuth();
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

// Get all clients for filter dropdown
export async function getAllClients() {
  await requireAuth();
  return prisma.client.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
