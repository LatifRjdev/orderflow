"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    activeOrders,
    totalOrders,
    urgentTasks,
    recentOrders,
    teamHours,
  ] = await Promise.all([
    // Active orders count
    prisma.order.count({
      where: {
        status: {
          code: { notIn: ["completed", "cancelled"] },
        },
      },
    }),
    // Total orders
    prisma.order.count(),
    // Urgent/high priority incomplete tasks
    prisma.task.findMany({
      where: {
        status: { notIn: ["DONE"] },
        priority: { in: ["URGENT", "HIGH"] },
      },
      include: {
        order: { select: { title: true, number: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Recent orders with deadlines
    prisma.order.findMany({
      where: {
        deadline: { not: null },
        status: {
          code: { notIn: ["completed", "cancelled"] },
        },
      },
      include: {
        client: { select: { name: true } },
        status: true,
      },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
    // Team hours this week
    prisma.timeEntry.groupBy({
      by: ["userId"],
      where: {
        date: {
          gte: getWeekStart(),
        },
      },
      _sum: { hours: true },
    }),
  ]);

  // Get user names for team hours
  const userIds = teamHours.map((th) => th.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const teamWorkload = teamHours.map((th) => {
    const user = users.find((u) => u.id === th.userId);
    return {
      name: user?.name || "Unknown",
      hours: Number(th._sum.hours || 0),
    };
  }).sort((a, b) => b.hours - a.hours);

  const totalWeekHours = teamWorkload.reduce((sum, tw) => sum + tw.hours, 0);

  // Order status distribution
  const statusDistribution = await prisma.order.groupBy({
    by: ["statusId"],
    _count: true,
  });

  const statuses = await prisma.orderStatus.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });

  const statusChart = statuses.map((status) => {
    const count = statusDistribution.find((sd) => sd.statusId === status.id)?._count || 0;
    return { name: status.name, color: status.color, count };
  });

  // Recent activity feed
  const [recentComments, recentStatusChanges, recentPayments] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId: null },
      include: {
        user: { select: { name: true } },
        order: { select: { number: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.orderStatusHistory.findMany({
      include: {
        order: { select: { number: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      include: {
        invoice: {
          select: {
            number: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 5,
    }),
  ]);

  type ActivityItem = {
    id: string;
    type: "comment" | "status" | "payment";
    text: string;
    subtext: string;
    date: Date;
    color?: string;
  };

  // Resolve user names and status names for status changes
  const statusChangeUserIds = recentStatusChanges.map((h) => h.changedById).filter(Boolean) as string[];
  const statusChangeStatusIds = recentStatusChanges.map((h) => h.toStatusId);
  const [scUsers, scStatuses] = await Promise.all([
    statusChangeUserIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: statusChangeUserIds } }, select: { id: true, name: true } })
      : [],
    prisma.orderStatus.findMany({ where: { id: { in: statusChangeStatusIds } }, select: { id: true, name: true, color: true } }),
  ]);

  const activity: ActivityItem[] = [
    ...recentComments.map((c) => ({
      id: `c-${c.id}`,
      type: "comment" as const,
      text: `${c.user?.name || c.clientName || "Клиент"} оставил комментарий`,
      subtext: `${c.order?.number} — ${c.order?.title}`,
      date: c.createdAt,
    })),
    ...recentStatusChanges.map((h) => {
      const user = scUsers.find((u) => u.id === h.changedById);
      const toStatus = scStatuses.find((s) => s.id === h.toStatusId);
      return {
        id: `s-${h.id}`,
        type: "status" as const,
        text: `${user?.name || "Система"} изменил статус на "${toStatus?.name || "?"}"`,
        subtext: `${h.order?.number} — ${h.order?.title}`,
        date: h.createdAt,
        color: toStatus?.color,
      };
    }),
    ...recentPayments.map((p) => ({
      id: `p-${p.id}`,
      type: "payment" as const,
      text: `Получена оплата ${Number(p.amount).toLocaleString("ru-RU")} TJS`,
      subtext: `${p.invoice?.number} — ${p.invoice?.client?.name}`,
      date: p.paymentDate,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  return {
    activeOrders,
    totalOrders,
    urgentTasks,
    recentOrders,
    teamWorkload,
    totalWeekHours,
    statusChart,
    recentActivity: activity,
  };
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
