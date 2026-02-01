"use server";

import { prisma } from "@/lib/prisma";

// Revenue by month
export async function getRevenueByMonth(months: number = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { paymentDate: { gte: startDate } },
    select: { amount: true, paymentDate: true },
    orderBy: { paymentDate: "asc" },
  });

  const monthMap = new Map<string, number>();
  for (const p of payments) {
    const d = new Date(p.paymentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + Number(p.amount));
  }

  const monthNames = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];

  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      shortMonth: monthNames[d.getMonth()],
      amount: monthMap.get(key) || 0,
    });
  }

  return result;
}

// Workload report — hours per user
export async function getWorkloadReport(period: "week" | "month" = "month") {
  const startDate = new Date();
  if (period === "week") {
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - day + (day === 0 ? -6 : 1));
  } else {
    startDate.setDate(1);
  }
  startDate.setHours(0, 0, 0, 0);

  const entries = await prisma.timeEntry.groupBy({
    by: ["userId"],
    where: { date: { gte: startDate } },
    _sum: { hours: true },
    _count: true,
  });

  const userIds = entries.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });

  // Hours by order for each user
  const detailedEntries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: startDate },
      userId: { in: userIds },
    },
    select: {
      userId: true,
      hours: true,
      isBillable: true,
      order: { select: { id: true, title: true, number: true } },
    },
  });

  const userDetails = new Map<
    string,
    { billable: number; nonBillable: number; orders: Map<string, { title: string; number: string; hours: number }> }
  >();

  for (const e of detailedEntries) {
    if (!userDetails.has(e.userId)) {
      userDetails.set(e.userId, { billable: 0, nonBillable: 0, orders: new Map() });
    }
    const ud = userDetails.get(e.userId)!;
    const hours = Number(e.hours);
    if (e.isBillable) ud.billable += hours;
    else ud.nonBillable += hours;

    if (e.order) {
      const existing = ud.orders.get(e.order.id);
      if (existing) {
        existing.hours += hours;
      } else {
        ud.orders.set(e.order.id, { title: e.order.title, number: e.order.number, hours });
      }
    }
  }

  const norm = period === "week" ? 40 : 160;

  return entries
    .map((e) => {
      const user = users.find((u) => u.id === e.userId);
      const details = userDetails.get(e.userId);
      const totalHours = Number(e._sum.hours || 0);
      return {
        userId: e.userId,
        name: user?.name || "Unknown",
        role: user?.role || "DEVELOPER",
        totalHours,
        billableHours: details?.billable || 0,
        nonBillableHours: details?.nonBillable || 0,
        utilization: Math.round((totalHours / norm) * 100),
        entries: e._count,
        orders: details ? Array.from(details.orders.values()).sort((a, b) => b.hours - a.hours) : [],
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);
}

// Project types distribution
export async function getProjectTypeStats() {
  const orders = await prisma.order.findMany({
    select: {
      projectType: true,
      estimatedBudget: true,
    },
  });

  const typeMap = new Map<string, { count: number; budget: number }>();
  for (const o of orders) {
    const type = o.projectType || "Другое";
    const existing = typeMap.get(type) || { count: 0, budget: 0 };
    existing.count++;
    existing.budget += Number(o.estimatedBudget || 0);
    typeMap.set(type, existing);
  }

  return Array.from(typeMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);
}

// Top clients by revenue
export async function getTopClients(limit: number = 10) {
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["PAID", "PARTIALLY_PAID"] } },
    select: {
      paidAmount: true,
      client: { select: { id: true, name: true } },
    },
  });

  const clientMap = new Map<string, { name: string; revenue: number; invoices: number }>();
  for (const inv of invoices) {
    if (!inv.client) continue;
    const existing = clientMap.get(inv.client.id) || { name: inv.client.name, revenue: 0, invoices: 0 };
    existing.revenue += Number(inv.paidAmount);
    existing.invoices++;
    clientMap.set(inv.client.id, existing);
  }

  return Array.from(clientMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Sales funnel
export async function getSalesFunnel() {
  const statuses = await prisma.orderStatus.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true, code: true, color: true },
  });

  const distribution = await prisma.order.groupBy({
    by: ["statusId"],
    _count: true,
  });

  return statuses.map((status) => {
    const count = distribution.find((d) => d.statusId === status.id)?._count || 0;
    return { name: status.name, code: status.code, color: status.color, count };
  });
}

// Sales funnel detailed — for the funnel report view
export async function getSalesFunnelDetailed() {
  const statuses = await prisma.orderStatus.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true, code: true, color: true, isFinal: true },
  });

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      statusId: true,
      estimatedBudget: true,
      createdAt: true,
      actualEndDate: true,
      actualStartDate: true,
    },
  });

  const totalOrders = orders.length;

  // Funnel stages
  const stages = statuses.map((status) => {
    const stageOrders = orders.filter((o) => o.statusId === status.id);
    const count = stageOrders.length;
    const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
    return {
      name: status.name,
      code: status.code,
      color: status.color,
      count,
      percentage,
      isFinal: status.isFinal,
    };
  });

  // KPI: Conversion rate (orders in final status / total orders)
  const finalStatusIds = statuses.filter((s) => s.isFinal).map((s) => s.id);
  const completedOrders = orders.filter((o) => finalStatusIds.includes(o.statusId));
  const conversionRate = totalOrders > 0
    ? Math.round((completedOrders.length / totalOrders) * 100)
    : 0;

  // KPI: Average deal cycle (days between createdAt and actualEndDate for completed orders)
  const cyclesInDays: number[] = [];
  for (const o of completedOrders) {
    if (o.actualEndDate && o.createdAt) {
      const diffMs = new Date(o.actualEndDate).getTime() - new Date(o.createdAt).getTime();
      cyclesInDays.push(Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }
  }
  const avgCycleDays = cyclesInDays.length > 0
    ? Math.round(cyclesInDays.reduce((a, b) => a + b, 0) / cyclesInDays.length)
    : 0;

  // KPI: Average deal value (estimatedBudget of all orders that have a budget)
  const budgets = orders
    .map((o) => Number(o.estimatedBudget || 0))
    .filter((b) => b > 0);
  const avgDealValue = budgets.length > 0
    ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
    : 0;

  // Monthly conversion data (last 6 months)
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  const shortMonthNames = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];

  const now = new Date();
  const monthlyConversion: {
    month: string;
    shortMonth: string;
    totalOrders: number;
    completedOrders: number;
    conversionRate: number;
  }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthOrders = orders.filter((o) => {
      const created = new Date(o.createdAt);
      return created >= monthStart && created <= monthEnd;
    });
    const monthCompleted = monthOrders.filter((o) =>
      finalStatusIds.includes(o.statusId)
    );
    const rate = monthOrders.length > 0
      ? Math.round((monthCompleted.length / monthOrders.length) * 100)
      : 0;

    monthlyConversion.push({
      month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      shortMonth: shortMonthNames[d.getMonth()],
      totalOrders: monthOrders.length,
      completedOrders: monthCompleted.length,
      conversionRate: rate,
    });
  }

  return {
    stages,
    kpi: {
      conversionRate,
      avgCycleDays,
      avgDealValue,
      totalOrders,
      completedOrders: completedOrders.length,
    },
    monthlyConversion,
  };
}

// Finance summary
export async function getFinanceSummary() {
  const [totalInvoiced, totalPaid, totalPending] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] } },
      _sum: { total: true },
    }),
  ]);

  return {
    totalInvoiced: Number(totalInvoiced._sum.total || 0),
    totalPaid: Number(totalPaid._sum.total || 0),
    totalPending: Number(totalPending._sum.total || 0),
  };
}
