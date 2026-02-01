"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";

const createTimeEntrySchema = z.object({
  orderId: z.string().min(1),
  taskId: z.string().optional(),
  userId: z.string().min(1),
  date: z.string().min(1, "Дата обязательна"),
  hours: z.coerce.number().min(0.25, "Минимум 0.25 часа").max(24),
  description: z.string().max(500).optional(),
  isBillable: z.coerce.boolean().default(true),
});

// Get time entries
export async function getTimeEntries(params?: {
  userId?: string;
  orderId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const { userId, orderId, taskId, startDate, endDate, limit = 50, offset = 0 } = params || {};

  const where: any = {
    ...(userId && { userId }),
    ...(orderId && { orderId }),
    ...(taskId && { taskId }),
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [entries, total, totalHours] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        order: { select: { id: true, title: true, number: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.timeEntry.count({ where }),
    prisma.timeEntry.aggregate({
      where,
      _sum: { hours: true },
    }),
  ]);

  return {
    entries: entries.map((e) => ({ ...e, hours: Number(e.hours) })),
    total,
    totalHours: Number(totalHours._sum.hours || 0),
  };
}

// Create time entry
export async function createTimeEntry(formData: FormData) {
  await requireAuth();
  const rawData = {
    orderId: formData.get("orderId") as string,
    taskId: formData.get("taskId") as string || undefined,
    userId: formData.get("userId") as string,
    date: formData.get("date") as string,
    hours: formData.get("hours") as string,
    description: formData.get("description") as string || undefined,
    isBillable: formData.get("isBillable") === "true",
  };

  const validated = createTimeEntrySchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const entry = await prisma.timeEntry.create({
      data: {
        orderId: validated.data.orderId,
        taskId: validated.data.taskId || undefined,
        userId: validated.data.userId,
        date: new Date(validated.data.date),
        hours: validated.data.hours,
        description: validated.data.description,
        isBillable: validated.data.isBillable,
      },
    });

    revalidatePath("/time");
    revalidatePath(`/orders/${validated.data.orderId}`);
    return { success: true, entry };
  } catch (error) {
    console.error("Error creating time entry:", error);
    return { error: "Ошибка при создании записи" };
  }
}

// Update time entry
export async function updateTimeEntry(id: string, formData: FormData) {
  await requireAuth();
  try {
    const data: any = {};

    const hours = formData.get("hours");
    if (hours) data.hours = parseFloat(hours as string);

    const description = formData.get("description");
    if (description !== null) data.description = description;

    const date = formData.get("date");
    if (date) data.date = new Date(date as string);

    const isBillable = formData.get("isBillable");
    if (isBillable !== null) data.isBillable = isBillable === "true";

    const entry = await prisma.timeEntry.update({
      where: { id },
      data,
    });

    revalidatePath("/time");
    revalidatePath(`/orders/${entry.orderId}`);
    return { success: true, entry };
  } catch (error) {
    console.error("Error updating time entry:", error);
    return { error: "Ошибка при обновлении записи" };
  }
}

// Delete time entry
export async function deleteTimeEntry(id: string) {
  await requireAuth();
  try {
    const entry = await prisma.timeEntry.delete({ where: { id } });
    revalidatePath("/time");
    revalidatePath(`/orders/${entry.orderId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return { error: "Ошибка при удалении записи" };
  }
}

// Get weekly time grid (rows=orders, cols=days)
export async function getWeeklyTimeGrid(weekStart: string) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const entries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: start, lt: end },
    },
    include: {
      order: { select: { id: true, title: true, number: true } },
      task: { select: { id: true, title: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  // Build grid: order → day → hours
  const orderMap = new Map<
    string,
    {
      order: { id: string; title: string; number: string };
      days: number[]; // 7 days, Mon-Sun
      total: number;
    }
  >();

  for (const entry of entries) {
    const key = entry.orderId;
    if (!orderMap.has(key)) {
      orderMap.set(key, {
        order: entry.order!,
        days: [0, 0, 0, 0, 0, 0, 0],
        total: 0,
      });
    }
    const row = orderMap.get(key)!;
    const entryDate = new Date(entry.date);
    const dayIndex = Math.floor(
      (entryDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayIndex >= 0 && dayIndex < 7) {
      row.days[dayIndex] += Number(entry.hours);
      row.total += Number(entry.hours);
    }
  }

  const rows = Array.from(orderMap.values()).sort((a, b) => b.total - a.total);

  // Day totals
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  let grandTotal = 0;
  for (const row of rows) {
    for (let i = 0; i < 7; i++) {
      dayTotals[i] += row.days[i];
    }
    grandTotal += row.total;
  }

  return { rows, dayTotals, grandTotal, weekStart: start.toISOString() };
}

// Get weekly summary for a user
export async function getWeeklySummary(userId: string, weekStart: string) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
    },
    include: {
      order: { select: { id: true, title: true, number: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { date: "asc" },
  });

  // Group by order
  const byOrder: Record<string, { order: any; entries: any[]; totalHours: number }> = {};
  for (const entry of entries) {
    const key = entry.orderId;
    if (!byOrder[key]) {
      byOrder[key] = { order: entry.order, entries: [], totalHours: 0 };
    }
    byOrder[key].entries.push(entry);
    byOrder[key].totalHours += Number(entry.hours);
  }

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
  const billableHours = entries
    .filter((e) => e.isBillable)
    .reduce((sum, e) => sum + Number(e.hours), 0);

  return {
    entries,
    byOrder: Object.values(byOrder),
    totalHours,
    billableHours,
  };
}
