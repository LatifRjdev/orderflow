import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCSV(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const orderId = searchParams.get("orderId");
  const userId = searchParams.get("userId");

  const where: any = {};
  if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
  if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
  if (orderId) where.orderId = orderId;
  if (userId) where.userId = userId;

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      user: { select: { name: true } },
      order: { select: { number: true, title: true } },
      task: { select: { title: true } },
    },
    orderBy: { date: "desc" },
  });

  const BOM = "\uFEFF";
  const headers = [
    "Дата",
    "Сотрудник",
    "Заказ",
    "Задача",
    "Часы",
    "Описание",
    "Оплачиваемое",
  ];

  const rows = entries.map((e) => [
    e.date ? new Date(e.date).toLocaleDateString("ru-RU") : "",
    e.user?.name || "",
    `${e.order?.number || ""} - ${e.order?.title || ""}`.trim(),
    e.task?.title || "",
    Number(e.hours).toLocaleString("ru-RU", { minimumFractionDigits: 1 }),
    e.description || "",
    e.isBillable ? "Да" : "Нет",
  ]);

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  // Add total row
  rows.push([
    "",
    "",
    "",
    "",
    totalHours.toLocaleString("ru-RU", { minimumFractionDigits: 1 }),
    "ИТОГО",
    "",
  ]);

  const csv =
    BOM +
    headers.map(escapeCSV).join(";") +
    "\n" +
    rows.map((row) => row.map(escapeCSV).join(";")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="time-entries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
