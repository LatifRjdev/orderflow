import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCSV(value: string): string {
  // Escape double quotes by doubling them, then wrap in quotes
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { orders: true, invoices: true } },
    },
    orderBy: { name: "asc" },
  });

  const BOM = "\uFEFF";
  const headers = [
    "Название",
    "Юр. название",
    "ИНН",
    "Email",
    "Телефон",
    "Сайт",
    "Адрес",
    "Отрасль",
    "Контакт",
    "Контакт Email",
    "Контакт Телефон",
    "Заказов",
    "Счетов",
    "Архив",
  ];

  const rows = clients.map((c) => {
    const contact = c.contacts[0];
    return [
      c.name || "",
      c.legalName || "",
      c.inn || "",
      c.email || "",
      c.phone || "",
      c.website || "",
      c.address || "",
      c.industry || "",
      contact ? `${contact.firstName} ${contact.lastName || ""}`.trim() : "",
      contact?.email || "",
      contact?.phone || "",
      String(c._count.orders),
      String(c._count.invoices),
      c.isArchived ? "Да" : "Нет",
    ];
  });

  const csv =
    BOM +
    headers.map(escapeCSV).join(";") +
    "\n" +
    rows.map((row) => row.map(escapeCSV).join(";")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
