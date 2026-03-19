import { notFound } from "next/navigation";
import Link from "next/link";
import { getContract } from "@/actions/contracts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, Briefcase, FileText, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DownloadPdfButton } from "@/components/documents/download-pdf-button";
import { ContractActions } from "@/components/documents/contract-actions";
import { ContractSectionRenderer } from "@/components/documents/sections/contract-section-renderer";

const statusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  ACTIVE: { label: "Активный", dot: "#22c55e" },
  COMPLETED: { label: "Завершён", dot: "#3b82f6" },
  TERMINATED: { label: "Расторгнут", dot: "#ef4444" },
  EXPIRED: { label: "Истёк", dot: "#f59e0b" },
};

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const contract = await getContract(params.id);
  if (!contract) notFound();

  const st = statusMap[contract.status] || statusMap.DRAFT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/documents?tab=contracts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{contract.title}</h1>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ borderColor: st.dot + "40", backgroundColor: st.dot + "10" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                <span className="text-sm font-medium" style={{ color: st.dot }}>{st.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="font-mono">{contract.number}</span>
              {contract.client && (
                <Link href={`/clients/${contract.client.id}`} className="flex items-center gap-1 hover:text-primary">
                  <Building2 className="w-3.5 h-3.5" />
                  {contract.client.name}
                </Link>
              )}
              {contract.order && (
                <Link href={`/orders/${contract.order.id}`} className="flex items-center gap-1 hover:text-primary">
                  <Briefcase className="w-3.5 h-3.5" />
                  {contract.order.number}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Preview */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">ДОГОВОР</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  № {contract.number} от {formatDate(contract.contractDate)}
                </p>
              </div>

              {/* Parties */}
              <div className="space-y-3 mb-6">
                <p className="text-sm">
                  <span className="font-medium">Заказчик: </span>
                  {contract.client?.legalName || contract.client?.name}
                </p>
              </div>

              {/* Dates */}
              {(contract.startDate || contract.endDate) && (
                <div className="text-sm mb-6">
                  <span className="font-medium">Срок: </span>
                  {contract.startDate ? formatDate(contract.startDate) : "—"} — {contract.endDate ? formatDate(contract.endDate) : "бессрочно"}
                </div>
              )}

              {/* Sections */}
              {contract.sections?.map((section: any) => (
                <div key={section.id} className="mb-6">
                  <ContractSectionRenderer
                    section={{
                      type: section.type,
                      title: section.title,
                      content: section.content,
                      isVisible: true,
                    }}
                  />
                </div>
              ))}

              {/* Total */}
              {contract.totalAmount > 0 && (
                <div className="mt-8 p-4 bg-background-light rounded-lg">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Сумма договора:</span>
                    <span>{formatCurrency(contract.totalAmount, contract.currency)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amendments */}
          {contract.amendments && contract.amendments.length > 0 && (
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-4">
                <h3 className="text-base font-semibold">Дополнительные соглашения</h3>
              </div>
              <div className="px-6 pb-6 space-y-3">
                {contract.amendments.map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/documents/amendments/${a.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#dbdfe6] hover:bg-background-light/50"
                  >
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{a.number}</span>
                      <p className="font-medium text-sm">{a.title}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(a.effectiveDate)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Сводка</h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Сумма</span>
                <span className="font-bold text-lg">{formatCurrency(contract.totalAmount, contract.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Разделов</span>
                <span className="font-medium">{contract.sections?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Доп. соглашений</span>
                <span className="font-medium">{contract.amendments?.length || 0}</span>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Дата договора: {formatDate(contract.contractDate)}</p>
                {contract.startDate && <p>Начало: {formatDate(contract.startDate)}</p>}
                {contract.endDate && <p>Окончание: {formatDate(contract.endDate)}</p>}
                <p>Создан: {formatDate(contract.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Действия</h3>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {contract.status === "DRAFT" && (
                <Link href={`/documents/contracts/${contract.id}/edit`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Pencil className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                </Link>
              )}
              <ContractActions contractId={contract.id} status={contract.status} />
              <DownloadPdfButton type="contract" id={contract.id} className="w-full justify-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
