import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/actions/portal";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  DRAFT: { label: "Черновик", variant: "secondary" },
  SENT: { label: "Отправлен", variant: "default" },
  VIEWED: { label: "Просмотрен", variant: "default" },
  PAID: { label: "Оплачен", variant: "success" },
  PARTIALLY_PAID: { label: "Частично", variant: "warning" },
  OVERDUE: { label: "Просрочен", variant: "destructive" },
  CANCELLED: { label: "Отменён", variant: "secondary" },
};

export default async function PortalInvoicesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id },
    include: {
      order: { select: { title: true, number: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Счета</h1>
        <p className="text-muted-foreground mt-1">
          Ваши счета и история платежей
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Всего выставлено</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Оплачено</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(paidAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">К оплате</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatCurrency(totalAmount - paidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-5 font-medium">Номер</th>
                <th className="text-left py-3 px-5 font-medium">Проект</th>
                <th className="text-left py-3 px-5 font-medium">Дата</th>
                <th className="text-left py-3 px-5 font-medium">Срок</th>
                <th className="text-left py-3 px-5 font-medium">Статус</th>
                <th className="text-right py-3 px-5 font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const st = statusLabels[inv.status] || statusLabels.DRAFT;
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-5 font-mono font-medium">
                      {inv.number}
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-muted-foreground mr-1">
                        {inv.order?.number}
                      </span>
                      {inv.order?.title}
                    </td>
                    <td className="py-3 px-5">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-5">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</td>
                    <td className="py-3 px-5">
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(Number(inv.total), inv.currency)}
                        </p>
                        {Number(inv.paidAmount) > 0 && Number(inv.paidAmount) < Number(inv.total) && (
                          <p className="text-xs text-green-600">
                            Оплачено: {formatCurrency(Number(inv.paidAmount), inv.currency)}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Счетов пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
