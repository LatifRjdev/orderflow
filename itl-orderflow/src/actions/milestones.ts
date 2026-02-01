"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotificationForUsers, getOrderNotificationRecipients } from "@/lib/notifications";
import { sendMilestoneReadyNotification } from "@/actions/notifications";
import { requireAuth } from "@/lib/auth-guard";

const createMilestoneSchema = z.object({
  orderId: z.string().min(1),
  title: z.string().min(1, "Название обязательно").max(255),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  requiresApproval: z.boolean().default(false),
});

const updateMilestoneSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(255).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  requiresApproval: z.boolean().optional(),
});

// Create milestone
export async function createMilestone(data: {
  orderId: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  requiresApproval?: boolean;
}) {
  await requireAuth();
  const validated = createMilestoneSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const lastMilestone = await prisma.milestone.findFirst({
      where: { orderId: validated.data.orderId },
      orderBy: { position: "desc" },
    });

    const milestone = await prisma.milestone.create({
      data: {
        orderId: validated.data.orderId,
        title: validated.data.title,
        description: validated.data.description,
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : undefined,
        dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : undefined,
        estimatedHours: validated.data.estimatedHours,
        requiresApproval: validated.data.requiresApproval ?? false,
        position: (lastMilestone?.position ?? -1) + 1,
      },
    });

    revalidatePath(`/orders/${validated.data.orderId}`);
    return { success: true, milestone };
  } catch (error) {
    console.error("Error creating milestone:", error);
    return { error: "Ошибка при создании этапа" };
  }
}

// Update milestone
export async function updateMilestone(
  id: string,
  data: {
    title?: string;
    description?: string;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    requiresApproval?: boolean;
  }
) {
  await requireAuth();
  const validated = updateMilestoneSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const updateData: any = {};
    if (validated.data.title !== undefined) updateData.title = validated.data.title;
    if (validated.data.description !== undefined) updateData.description = validated.data.description || null;
    if (validated.data.startDate !== undefined) updateData.startDate = validated.data.startDate ? new Date(validated.data.startDate) : null;
    if (validated.data.dueDate !== undefined) updateData.dueDate = validated.data.dueDate ? new Date(validated.data.dueDate) : null;
    if (validated.data.estimatedHours !== undefined) updateData.estimatedHours = validated.data.estimatedHours;
    if (validated.data.requiresApproval !== undefined) updateData.requiresApproval = validated.data.requiresApproval;

    const milestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/orders/${milestone.orderId}`);
    return { success: true, milestone };
  } catch (error) {
    console.error("Error updating milestone:", error);
    return { error: "Ошибка при обновлении этапа" };
  }
}

// Delete milestone
export async function deleteMilestone(id: string) {
  await requireAuth();
  try {
    const milestone = await prisma.milestone.delete({ where: { id } });
    revalidatePath(`/orders/${milestone.orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return { error: "Ошибка при удалении этапа" };
  }
}

// Update milestone status with full workflow
export async function updateMilestoneStatus(id: string, status: string) {
  await requireAuth();
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { order: { select: { number: true } } },
    });

    if (!milestone) {
      return { error: "Этап не найден" };
    }

    const updateData: any = { status };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (status === "IN_PROGRESS" && milestone.status === "COMPLETED") {
      // Request changes — clear approval
      updateData.clientApprovedAt = null;
      updateData.completedAt = null;
    } else if (status === "APPROVED") {
      updateData.clientApprovedAt = new Date();
    } else if (status === "CANCELLED") {
      updateData.completedAt = null;
      updateData.clientApprovedAt = null;
    } else if (status === "PENDING") {
      updateData.completedAt = null;
      updateData.clientApprovedAt = null;
    }

    await prisma.milestone.update({ where: { id }, data: updateData });

    // Notifications
    const recipients = await getOrderNotificationRecipients(milestone.orderId);
    const statusLabels: Record<string, string> = {
      PENDING: "Ожидает",
      IN_PROGRESS: "В работе",
      COMPLETED: "Завершён",
      APPROVED: "Согласован",
      CANCELLED: "Отменён",
    };

    createNotificationForUsers(recipients, {
      type: "STATUS",
      title: "Статус этапа изменён",
      description: `«${milestone.title}» — ${statusLabels[status] ?? status} (заказ ${milestone.order?.number})`,
      linkUrl: `/orders/${milestone.orderId}`,
      entityType: "milestone",
      entityId: id,
    });

    // Email client when milestone is completed and requires approval
    if (status === "COMPLETED" && milestone.requiresApproval) {
      sendMilestoneReadyNotification(milestone.id);
    }

    revalidatePath(`/orders/${milestone.orderId}`);
    revalidatePath(`/orders/${milestone.orderId}/milestones/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating milestone status:", error);
    return { error: "Ошибка при обновлении статуса этапа" };
  }
}

// Get milestones for an order
export async function getOrderMilestones(orderId: string) {
  return prisma.milestone.findMany({
    where: { orderId },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { position: "asc" },
      },
      files: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { position: "asc" },
  });
}

// Check approaching deadlines and create notifications
export async function checkDeadlines() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Find milestones with dueDate in the next 24 hours
    const milestones = await prisma.milestone.findMany({
      where: {
        dueDate: { gte: now, lte: in24h },
        status: { notIn: ["COMPLETED", "APPROVED", "CANCELLED"] },
      },
      include: {
        order: { select: { id: true, number: true } },
      },
    });

    // Find tasks with dueDate in the next 24 hours
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: now, lte: in24h },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: {
        order: { select: { id: true, number: true } },
        assignee: { select: { id: true } },
      },
    });

    let notificationsCreated = 0;

    // Notify about milestone deadlines
    for (const milestone of milestones) {
      const recipients = await getOrderNotificationRecipients(milestone.orderId);
      await createNotificationForUsers(recipients, {
        type: "DEADLINE",
        title: "Приближается дедлайн этапа",
        description: `«${milestone.title}» (заказ ${milestone.order.number}) — срок до ${milestone.dueDate!.toLocaleDateString("ru-RU")}`,
        linkUrl: `/orders/${milestone.orderId}`,
        entityType: "milestone",
        entityId: milestone.id,
      });
      notificationsCreated += recipients.length;
    }

    // Notify about task deadlines
    for (const task of tasks) {
      const recipients: string[] = [];
      if (task.assignee?.id) recipients.push(task.assignee.id);
      // Also notify order team
      const orderRecipients = await getOrderNotificationRecipients(task.orderId);
      for (const r of orderRecipients) {
        if (!recipients.includes(r)) recipients.push(r);
      }

      await createNotificationForUsers(recipients, {
        type: "DEADLINE",
        title: "Приближается дедлайн задачи",
        description: `«${task.title}» (заказ ${task.order.number}) — срок до ${task.dueDate!.toLocaleDateString("ru-RU")}`,
        linkUrl: `/orders/${task.orderId}`,
        entityType: "task",
        entityId: task.id,
      });
      notificationsCreated += recipients.length;
    }

    return {
      success: true,
      milestones: milestones.length,
      tasks: tasks.length,
      notificationsCreated,
    };
  } catch (error) {
    console.error("Error checking deadlines:", error);
    return { error: "Ошибка при проверке дедлайнов" };
  }
}
