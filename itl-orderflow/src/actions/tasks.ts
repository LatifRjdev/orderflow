"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth-guard";
import { Priority, TaskStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const log = logger.create("Tasks");
import { createNotificationForUsers, getOrderNotificationRecipients } from "@/lib/notifications";
import { sendMilestoneReadyNotification } from "@/actions/notifications";

const createTaskSchema = z.object({
  orderId: z.string().min(1),
  milestoneId: z.string().optional(),
  title: z.string().min(1, "Название обязательно").max(255),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
  estimatedHours: z.coerce.number().optional(),
  deadline: z.string().optional(),
});

// Get tasks (with filters)
export async function getTasks(params?: {
  search?: string;
  status?: string;
  assigneeId?: string;
  orderId?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, status, assigneeId, orderId, priority, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(status && { status: status as TaskStatus }),
    ...(assigneeId && { assigneeId }),
    ...(orderId && { orderId }),
    ...(priority && { priority: priority as Priority }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { order: { title: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        order: {
          select: { id: true, title: true, number: true },
        },
        assignee: {
          select: { id: true, name: true },
        },
        milestone: {
          select: { id: true, title: true },
        },
        _count: {
          select: { checklists: true, timeEntries: true, comments: true },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}

// Get single task
export async function getTask(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      order: {
        select: { id: true, title: true, number: true },
      },
      milestone: {
        select: { id: true, title: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      checklists: {
        orderBy: { position: "asc" },
      },
      timeEntries: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 20,
      },
      comments: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// Create task
export async function createTask(formData: FormData) {
  await requireAuth();
  const rawData = {
    orderId: formData.get("orderId") as string,
    milestoneId: formData.get("milestoneId") as string || undefined,
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    priority: formData.get("priority") as string || "MEDIUM",
    assigneeId: formData.get("assigneeId") as string || undefined,
    estimatedHours: formData.get("estimatedHours") as string || undefined,
    deadline: formData.get("deadline") as string || undefined,
  };

  const validated = createTaskSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // Get next position
    const lastTask = await prisma.task.findFirst({
      where: {
        orderId: validated.data.orderId,
        milestoneId: validated.data.milestoneId || null,
      },
      orderBy: { position: "desc" },
    });

    const task = await prisma.task.create({
      data: {
        title: validated.data.title,
        description: validated.data.description,
        priority: validated.data.priority as Priority,
        status: "TODO",
        position: (lastTask?.position || 0) + 1,
        orderId: validated.data.orderId,
        milestoneId: validated.data.milestoneId || undefined,
        assigneeId: validated.data.assigneeId || undefined,
        estimatedHours: validated.data.estimatedHours,
        dueDate: validated.data.deadline ? new Date(validated.data.deadline) : undefined,
      },
    });

    revalidatePath("/tasks");
    revalidatePath(`/orders/${validated.data.orderId}`);
    return { success: true, task };
  } catch (error) {
    log.error("Error creating task", error);
    return { error: "Ошибка при создании задачи" };
  }
}

// Update task status
export async function updateTaskStatus(taskId: string, status: string) {
  await requireAuth();
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: status as TaskStatus,
        ...(status === "DONE" ? { completedAt: new Date() } : { completedAt: null }),
      },
    });

    // Auto-update milestone progress
    if (task.milestoneId) {
      const milestoneTasks = await prisma.task.findMany({
        where: { milestoneId: task.milestoneId },
        select: { status: true },
      });
      const doneCount = milestoneTasks.filter((t) => t.status === "DONE").length;
      const percent = milestoneTasks.length > 0
        ? Math.round((doneCount / milestoneTasks.length) * 100)
        : 0;

      await prisma.milestone.update({
        where: { id: task.milestoneId },
        data: { progressPercent: percent },
      });

      // Cascade: all tasks done → auto-complete milestone
      if (percent === 100) {
        const milestone = await prisma.milestone.findUnique({
          where: { id: task.milestoneId },
          select: { status: true, requiresApproval: true, title: true, orderId: true },
        });
        if (milestone && milestone.status === "IN_PROGRESS") {
          await prisma.milestone.update({
            where: { id: task.milestoneId },
            data: { status: "COMPLETED", completedAt: new Date() },
          });

          // Notify team
          const recipients = await getOrderNotificationRecipients(milestone.orderId);
          createNotificationForUsers(recipients, {
            type: "STATUS",
            title: "Этап автоматически завершён",
            description: `Все задачи этапа «${milestone.title}» выполнены`,
            linkUrl: `/orders/${milestone.orderId}`,
            entityType: "milestone",
            entityId: task.milestoneId,
          });

          // Email client if requires approval
          if (milestone.requiresApproval) {
            sendMilestoneReadyNotification(task.milestoneId);
          }
        }
      }

      // Reverse cascade: task reopened while milestone was COMPLETED
      if (percent < 100) {
        const milestone = await prisma.milestone.findUnique({
          where: { id: task.milestoneId },
          select: { status: true },
        });
        if (milestone && milestone.status === "COMPLETED") {
          await prisma.milestone.update({
            where: { id: task.milestoneId },
            data: { status: "IN_PROGRESS", completedAt: null },
          });
        }
      }
    }

    // Update order progress from milestones
    if (task.orderId) {
      const milestones = await prisma.milestone.findMany({
        where: { orderId: task.orderId },
        select: { status: true },
      });
      if (milestones.length > 0) {
        const completedCount = milestones.filter(
          (m) => m.status === "COMPLETED" || m.status === "APPROVED"
        ).length;
        const orderPercent = Math.round((completedCount / milestones.length) * 100);
        await prisma.order.update({
          where: { id: task.orderId },
          data: { progressPercent: orderPercent },
        });
      }
    }

    revalidatePath("/tasks");
    revalidatePath(`/orders/${task.orderId}`);
    return { success: true, task };
  } catch (error) {
    log.error("Error updating task status", error);
    return { error: "Ошибка при обновлении статуса" };
  }
}

// Update task
export async function updateTask(id: string, formData: FormData) {
  await requireAuth();
  try {
    const data: any = {};

    const fields = ["title", "description", "priority", "assigneeId", "milestoneId"];
    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null && value !== "") {
        data[field] = value;
      }
    }

    const estimatedHours = formData.get("estimatedHours");
    if (estimatedHours) {
      data.estimatedHours = parseFloat(estimatedHours as string);
    }

    const deadline = formData.get("deadline");
    if (deadline) {
      data.deadline = new Date(deadline as string);
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    revalidatePath("/tasks");
    revalidatePath(`/orders/${task.orderId}`);
    return { success: true, task };
  } catch (error) {
    log.error("Error updating task", error);
    return { error: "Ошибка при обновлении задачи" };
  }
}

// Delete task
export async function deleteTask(id: string) {
  await requireRole(["ADMIN"]);
  try {
    const task = await prisma.task.delete({ where: { id } });
    revalidatePath("/tasks");
    revalidatePath(`/orders/${task.orderId}`);
    return { success: true };
  } catch (error) {
    log.error("Error deleting task", error);
    return { error: "Ошибка при удалении задачи" };
  }
}

// Toggle checklist item
export async function toggleChecklistItem(id: string) {
  try {
    const item = await prisma.taskChecklist.findUnique({
      where: { id },
      include: { task: { select: { id: true, orderId: true } } },
    });
    if (!item) return { error: "Элемент не найден" };

    await prisma.taskChecklist.update({
      where: { id },
      data: {
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date() : null,
      },
    });

    revalidatePath(`/tasks/${item.task.id}`);
    revalidatePath(`/orders/${item.task.orderId}`);
    return { success: true };
  } catch (error) {
    log.error("Error toggling checklist", error);
    return { error: "Ошибка" };
  }
}

// Create checklist item
export async function createChecklistItem(taskId: string, title: string) {
  await requireAuth();
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { error: "Задача не найдена" };

    const lastItem = await prisma.taskChecklist.findFirst({
      where: { taskId },
      orderBy: { position: "desc" },
    });

    const item = await prisma.taskChecklist.create({
      data: {
        taskId,
        title,
        position: (lastItem?.position ?? -1) + 1,
      },
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/orders/${task.orderId}`);
    return { success: true, item };
  } catch (error) {
    log.error("Error creating checklist item", error);
    return { error: "Ошибка при создании элемента" };
  }
}

// Delete checklist item
export async function deleteChecklistItem(id: string) {
  await requireAuth();
  try {
    const item = await prisma.taskChecklist.findUnique({
      where: { id },
      include: { task: { select: { id: true, orderId: true } } },
    });
    if (!item) return { error: "Элемент не найден" };

    await prisma.taskChecklist.delete({ where: { id } });

    revalidatePath(`/tasks/${item.task.id}`);
    revalidatePath(`/orders/${item.task.orderId}`);
    return { success: true };
  } catch (error) {
    log.error("Error deleting checklist item", error);
    return { error: "Ошибка при удалении элемента" };
  }
}

// Add comment to task
export async function addTaskComment(taskId: string, content: string) {
  const session = await requireAuth();
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { error: "Задача не найдена" };

    const comment = await prisma.comment.create({
      data: {
        content,
        orderId: task.orderId,
        taskId,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    revalidatePath(`/tasks/${taskId}`);
    revalidatePath(`/orders/${task.orderId}`);
    return { success: true, comment };
  } catch (error) {
    log.error("Error adding comment", error);
    return { error: "Ошибка при добавлении комментария" };
  }
}
