import { notFound } from "next/navigation";
import Link from "next/link";
import { getReconciliation } from "@/actions/reconciliations";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DownloadPdfButton } from "@/components/documents/download-pdf-button";
import { ReconciliationActions } from "@/components/documents/reconciliation-actions";

const statusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  SENT: { label: "Отправлен", dot: "#3b82f6" },
  CONFIRMED: { label: "Подтверждён", dot: "#22c55e" },
};

export default async function ReconciliationDetailPage({ params }: { params: { id: string } }) {
  const rec = await getReconciliation(params.id);
  if (!rec) notFound();

  const st = statusMap[rec.status] || statusMap.DRAFT;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/documents?tab=reconciliations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Акт сверки {rec.number}</h1>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ borderColor: st.dot + "40", backgroundColor: st.dot + "10" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                <span className="text-sm font-medium" style={{ color: st.dot }}>{st.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="font-mono">{rec.number}</span>
              {rec.client && (
                <Link href={`/clients/${rec.client.id}`} className="flex items-center gap-1 hover:text-primary">
                  <Building2 className="w-3.5 h-3.5" />
                  {rec.client.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Period & Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Период</p>
              <p className="text-sm font-medium">{formatDate(rec.periodFrom)} — {formatDate(rec.periodTo)}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Начальное сальдо</p>
              <p className="text-lg font-bold">{formatCurrency(rec.openingBalance, rec.currency)}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Конечное сальдо</p>
              <p className="text-lg font-bold">{formatCurrency(rec.closingBalance, rec.currency)}</p>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Операции ({rec.entries?.length || 0})</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-[#dbdfe6]">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Дата</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Описание</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Дебет</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Кредит</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs uppercase">Сальдо</th>
                </tr>
              </thead>
              <tbody>
                {rec.entries?.map((entry: any, idx: number) => (
                  <tr key={entry.id} className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50">
                    <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(entry.date)}</td>
                    <td className="py-3 px-4">{entry.description}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {entry.debit > 0 ? formatCurrency(entry.debit, rec.currency) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit, rec.currency) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {formatCurrency(entry.balance, rec.currency)}
                    </td>
                  </tr>
                ))}
                {(!rec.entries || rec.entries.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      Операции отсутствуют
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Сводка</h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Операций</span>
                <span className="font-medium">{rec.entries?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Валюта</span>
                <span className="font-medium">{rec.currency}</span>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Дата: {formatDate(rec.generatedDate)}</p>
                <p>Создан: {formatDate(rec.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Действия</h3>
            </div>
            <div className="px-6 pb-6 space-y-2">
              <ReconciliationActions reconciliationId={rec.id} status={rec.status} />
              <DownloadPdfButton type="reconciliation" id={rec.id} className="w-full justify-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
