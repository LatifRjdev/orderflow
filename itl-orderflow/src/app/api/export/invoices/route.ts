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
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  const where: any = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { name: true } },
      order: { select: { number: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const BOM = "\uFEFF";
  const headers = [
    "Номер",
    "Клиент",
    "Заказ",
    "Дата выставления",
    "Срок оплаты",
    "Сумма",
    "Оплачено",
    "Статус",
    "Валюта",
  ];

  const statusLabels: Record<string, string> = {
    DRAFT: "Черновик",
    SENT: "Отправлен",
    VIEWED: "Просмотрен",
    PAID: "Оплачен",
    PARTIALLY_PAID: "Частично оплачен",
    OVERDUE: "Просрочен",
    CANCELLED: "Отменён",
  };

  const rows = invoices.map((inv) => [
    inv.number || "",
    inv.client?.name || "",
    `${inv.order?.number || ""} - ${inv.order?.title || ""}`.trim(),
    inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("ru-RU") : "",
    inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("ru-RU") : "",
    Number(inv.total).toLocaleString("ru-RU", { minimumFractionDigits: 2 }),
    Number(inv.paidAmount).toLocaleString("ru-RU", { minimumFractionDigits: 2 }),
    statusLabels[inv.status] || inv.status,
    inv.currency || "TJS",
  ]);

  const csv =
    BOM +
    headers.map(escapeCSV).join(";") +
    "\n" +
    rows.map((row) => row.map(escapeCSV).join(";")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
