"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { Priority } from "@prisma/client";
import { logger } from "@/lib/logger";

const log = logger.create("Orders");
import { createNotificationForUsers, getOrderNotificationRecipients } from "@/lib/notifications";
import { sendOrderStatusNotification } from "@/actions/notifications";
import { requireAuth, requireRole } from "@/lib/auth-guard";

// Validation schemas
const createOrderSchema = z.object({
  clientId: z.string().min(1, "Клиент обязателен"),
  title: z.string().min(1, "Название обязательно").max(255),
  description: z.string().optional(),
  projectType: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  deadline: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  estimatedBudget: z.coerce.number().optional(),
  currency: z.string().default("TJS"),
  managerId: z.string().optional(),
});

// Get all orders
export async function getOrders(params?: {
  search?: string;
  statusId?: string;
  clientId?: string;
  managerId?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, statusId, clientId, managerId, priority, limit = 50, offset = 0 } = params || {};

  const where = {
    ...(statusId && { statusId }),
    ...(clientId && { clientId }),
    ...(managerId && { managerId }),
    ...(priority && { priority: priority as Priority }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { number: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
        status: true,
        manager: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true, timeEntries: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

// Get single order with full details
export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      status: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
      milestones: {
        include: {
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true },
              },
            },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
      tasks: {
        where: { milestoneId: null },
        include: {
          assignee: {
            select: { id: true, name: true },
          },
        },
        orderBy: { position: "asc" },
      },
      timeEntries: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { date: "desc" },
        take: 20,
      },
      files: {
        orderBy: { createdAt: "desc" },
      },
      comments: {
        where: { taskId: null },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: { tasks: true, timeEntries: true, files: true, comments: true },
      },
    },
  });

  return order;
}

// Get all order statuses
export async function getOrderStatuses() {
  return prisma.orderStatus.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
}

// Create order
export async function createOrder(formData: FormData) {
  await requireAuth();
  const rawData = {
    clientId: formData.get("clientId") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    projectType: formData.get("projectType") as string || undefined,
    priority: formData.get("priority") as string || "MEDIUM",
    deadline: formData.get("deadline") as string || undefined,
    estimatedHours: formData.get("estimatedHours") as string || undefined,
    estimatedBudget: formData.get("estimatedBudget") as string || undefined,
    currency: formData.get("currency") as string || "TJS",
    managerId: formData.get("managerId") as string || undefined,
  };

  const validated = createOrderSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0].message,
    };
  }

  try {
    // Get initial status
    const initialStatus = await prisma.orderStatus.findFirst({
      where: { isInitial: true },
    });

    if (!initialStatus) {
      return { error: "Не найден начальный статус" };
    }

    // Atomic number generation
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: { nextOrderNumber: { increment: 1 } },
    });
    const orderNumber = `${settings.orderPrefix}-${new Date().getFullYear()}-${String(
      settings.nextOrderNumber - 1
    ).padStart(3, "0")}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        title: validated.data.title,
        description: validated.data.description,
        projectType: validated.data.projectType,
        priority: validated.data.priority as Priority,
        deadline: validated.data.deadline ? new Date(validated.data.deadline) : undefined,
        estimatedHours: validated.data.estimatedHours,
        estimatedBudget: validated.data.estimatedBudget,
        currency: validated.data.currency,
        clientId: validated.data.clientId,
        statusId: initialStatus.id,
        managerId: validated.data.managerId || undefined,
      },
    });

    revalidatePath("/orders");
    return { success: true, order };
  } catch (error) {
    log.error("Error creating order", error);
    return { error: "Ошибка при создании заказа" };
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  statusId: string,
  comment?: string
) {
  try {
    await requireAuth();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: "Заказ не найден" };
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { statusId },
    });

    // Add to history
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatusId: order.statusId,
        toStatusId: statusId,
        comment,
      },
    });

    // In-app notification for team
    const newStatus = await prisma.orderStatus.findUnique({ where: { id: statusId } });
    const recipients = await getOrderNotificationRecipients(orderId);
    createNotificationForUsers(recipients, {
      type: "STATUS",
      title: "Статус заказа изменён",
      description: `${order.number} переведён в «${newStatus?.name ?? ""}»`,
      linkUrl: `/orders/${orderId}`,
      entityType: "order",
      entityId: orderId,
    });

    // Email notification to client (if status has notifyClient=true)
    sendOrderStatusNotification(orderId, newStatus?.name ?? "");

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true, order: updatedOrder };
  } catch (error) {
    log.error("Error updating order status", error);
    return { error: "Ошибка при обновлении статуса" };
  }
}

// Update order
export async function updateOrder(id: string, formData: FormData) {
  await requireAuth();
  try {
    const data: any = {};

    const fields = ["title", "description", "projectType", "priority", "currency", "managerId"];
    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null && value !== "") {
        data[field] = value;
      }
    }

    const deadline = formData.get("deadline");
    if (deadline) {
      data.deadline = new Date(deadline as string);
    }

    const estimatedHours = formData.get("estimatedHours");
    if (estimatedHours) {
      data.estimatedHours = parseFloat(estimatedHours as string);
    }

    const estimatedBudget = formData.get("estimatedBudget");
    if (estimatedBudget) {
      data.estimatedBudget = parseFloat(estimatedBudget as string);
    }

    const order = await prisma.order.update({
      where: { id },
      data,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { success: true, order };
  } catch (error) {
    log.error("Error updating order", error);
    return { error: "Ошибка при обновлении заказа" };
  }
}

// Add comment to order
export async function addOrderComment(
  orderId: string,
  content: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Необходима авторизация" };
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        orderId,
        userId: session.user.id,
        isPortalVisible: false,
        isInternal: false,
      },
    });

    // In-app notification for team
    const recipients = await getOrderNotificationRecipients(orderId);
    createNotificationForUsers(recipients, {
      type: "COMMENT",
      title: "Новый комментарий к заказу",
      description: `${session.user.name ?? "Пользователь"}: "${content.substring(0, 80)}${content.length > 80 ? "..." : ""}"`,
      linkUrl: `/orders/${orderId}`,
      entityType: "comment",
      entityId: comment.id,
    });

    revalidatePath(`/orders/${orderId}`);
    return { success: true, comment };
  } catch (error) {
    log.error("Error adding comment", error);
    return { error: "Ошибка при добавлении комментария" };
  }
}

// Delete order
export async function deleteOrder(id: string) {
  try {
    await requireRole(["ADMIN"]);
    await prisma.order.delete({ where: { id } });
    revalidatePath("/orders");
    return { success: true };
  } catch (error) {
    log.error("Error deleting order", error);
    return { error: "Ошибка при удалении заказа" };
  }
}

// Approve milestone
export async function approveMilestone(milestoneId: string) {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { orderId: true },
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

    revalidatePath(`/orders/${milestone.orderId}`);
    revalidatePath(
      `/orders/${milestone.orderId}/milestones/${milestoneId}`
    );
    return { success: true };
  } catch (error) {
    log.error("Error approving milestone", error);
    return { error: "Ошибка при одобрении этапа" };
  }
}

// Request milestone changes (send back for revisions)
export async function requestMilestoneChanges(
  milestoneId: string,
  comment: string
) {
  try {
    const session = await requireAuth();

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { orderId: true, title: true },
    });

    if (!milestone) {
      return { error: "Этап не найден" };
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: "IN_PROGRESS",
        clientApprovedAt: null,
        completedAt: null,
      },
    });

    // Save comment if provided
    if (comment && comment.trim()) {
      await prisma.comment.create({
        data: {
          content: `[Запрос доработки этапа «${milestone.title}»] ${comment}`,
          orderId: milestone.orderId,
          userId: session.user.id,
          isInternal: false,
          isPortalVisible: true,
        },
      });
    }

    // Notify team
    const recipients = await getOrderNotificationRecipients(milestone.orderId);
    createNotificationForUsers(recipients, {
      type: "STATUS",
      title: "Запрошена доработка этапа",
      description: `«${milestone.title}» возвращён в работу`,
      linkUrl: `/orders/${milestone.orderId}`,
      entityType: "milestone",
      entityId: milestoneId,
    });

    revalidatePath(`/orders/${milestone.orderId}`);
    revalidatePath(
      `/orders/${milestone.orderId}/milestones/${milestoneId}`
    );
    return { success: true };
  } catch (error) {
    log.error("Error requesting milestone changes", error);
    return { error: "Ошибка при запросе доработки" };
  }
}
