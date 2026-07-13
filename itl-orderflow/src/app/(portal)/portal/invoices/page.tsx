import { prisma } from "@/lib/prisma";
import { requirePortalSession } from "@/lib/portal-session";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusDots: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  SENT: { label: "Отправлен", dot: "#3b82f6" },
  VIEWED: { label: "Просмотрен", dot: "#3b82f6" },
  PAID: { label: "Оплачен", dot: "#22c55e" },
  PARTIALLY_PAID: { label: "Частично", dot: "#f59e0b" },
  OVERDUE: { label: "Просрочен", dot: "#ef4444" },
  CANCELLED: { label: "Отменён", dot: "#9ca3af" },
};

export default async function PortalInvoicesPage() {
  const session = await requirePortalSession("canViewFinance");
  const { client } = session;

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
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
          <p className="text-sm text-muted-foreground">Всего выставлено</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
          <p className="text-sm text-muted-foreground">Оплачено</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(paidAmount)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-5">
          <p className="text-sm text-muted-foreground">К оплате</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalAmount - paidAmount)}
          </p>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#dbdfe6] bg-background-light">
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Проект</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Срок</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const st = statusDots[inv.status] || statusDots.DRAFT;
              return (
                <tr key={inv.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors">
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
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                      <span className="text-sm">{st.label}</span>
                    </div>
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
      </div>
    </div>
  );
}
