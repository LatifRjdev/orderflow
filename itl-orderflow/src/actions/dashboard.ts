"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekStart = getWeekStart();
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [
    activeOrders,
    totalOrders,
    urgentTasks,
    recentOrders,
    teamHours,
    monthlyRevenue,
    prevMonthlyRevenue,
    prevWeekHours,
    outstandingInvoices,
    overdueInvoices,
    overdueList,
    forecastList,
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
          gte: weekStart,
        },
      },
      _sum: { hours: true },
    }),
    // Monthly revenue (sum of payments this month)
    prisma.payment.aggregate({
      where: { paymentDate: { gte: monthStart } },
      _sum: { amount: true },
    }),
    // Monthly revenue for the previous month (for trend comparison)
    prisma.payment.aggregate({
      where: { paymentDate: { gte: prevMonthStart, lt: monthStart } },
      _sum: { amount: true },
    }),
    // Total hours logged in the previous week (for trend comparison)
    prisma.timeEntry.aggregate({
      where: { date: { gte: prevWeekStart, lt: weekStart } },
      _sum: { hours: true },
    }),
    // Outstanding invoices (sent/viewed/partially paid)
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] } },
      select: { total: true, paidAmount: true },
    }),
    // Overdue invoices (overdue status or past due)
    prisma.invoice.findMany({
      where: {
        OR: [
          { status: "OVERDUE" },
          {
            dueDate: { lt: now },
            status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] },
          },
        ],
      },
      select: { total: true, paidAmount: true },
    }),
    // Overdue invoices list (for display)
    prisma.invoice.findMany({
      where: {
        OR: [
          { status: "OVERDUE" },
          {
            dueDate: { lt: now },
            status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] },
          },
        ],
      },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // Payment forecast (upcoming due invoices)
    prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] },
        dueDate: { gte: now },
      },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
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

  // Financial KPIs
  const monthRevenue = Number(monthlyRevenue._sum.amount || 0);
  const prevMonthRevenue = Number(prevMonthlyRevenue._sum.amount || 0);
  const prevWeekTotalHours = Number(prevWeekHours._sum.hours || 0);
  const outstandingAmount = outstandingInvoices.reduce(
    (sum, inv) => sum + Number(inv.total || 0) - Number(inv.paidAmount || 0),
    0
  );
  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) => sum + Number(inv.total || 0) - Number(inv.paidAmount || 0),
    0
  );

  // Trend vs. the previous equivalent period; null when there's no baseline to compare against
  // (avoids showing a fabricated or divide-by-zero percentage)
  const revenueChangePercent = calcPercentChange(monthRevenue, prevMonthRevenue);
  const hoursChangePercent = calcPercentChange(totalWeekHours, prevWeekTotalHours);

  return {
    activeOrders,
    totalOrders,
    urgentTasks,
    recentOrders,
    teamWorkload,
    totalWeekHours,
    hoursChangePercent,
    statusChart,
    recentActivity: activity,
    monthRevenue,
    revenueChangePercent,
    outstandingAmount,
    overdueAmount,
    overdueList: overdueList.map((inv) => ({
      id: inv.id,
      number: inv.number,
      clientName: inv.client?.name || "—",
      dueDate: inv.dueDate,
      remaining: Number(inv.total || 0) - Number(inv.paidAmount || 0),
      currency: inv.currency,
    })),
    forecastList: forecastList.map((inv) => ({
      id: inv.id,
      number: inv.number,
      clientName: inv.client?.name || "—",
      dueDate: inv.dueDate,
      remaining: Number(inv.total || 0) - Number(inv.paidAmount || 0),
      currency: inv.currency,
    })),
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

// Percentage change vs. a previous period. Returns null when there's no baseline
// to compare against, rather than an infinite or misleading value.
function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
