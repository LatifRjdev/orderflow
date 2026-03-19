import { notFound } from "next/navigation";
import Link from "next/link";
import { getAmendment } from "@/actions/amendments";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, FileText, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DownloadPdfButton } from "@/components/documents/download-pdf-button";
import { AmendmentActions } from "@/components/documents/amendment-actions";
import { AMENDMENT_FIELD_OPTIONS } from "@/types/amendment-changes";

const statusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  ACTIVE: { label: "Активный", dot: "#22c55e" },
  COMPLETED: { label: "Завершён", dot: "#3b82f6" },
};

export default async function AmendmentDetailPage({ params }: { params: { id: string } }) {
  const amendment = await getAmendment(params.id);
  if (!amendment) notFound();

  const st = statusMap[amendment.status] || statusMap.DRAFT;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/documents?tab=amendments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{amendment.title}</h1>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ borderColor: st.dot + "40", backgroundColor: st.dot + "10" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                <span className="text-sm font-medium" style={{ color: st.dot }}>{st.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="font-mono">{amendment.number}</span>
              {amendment.contract && (
                <Link href={`/documents/contracts/${amendment.contract.id}`} className="flex items-center gap-1 hover:text-primary">
                  <FileText className="w-3.5 h-3.5" />
                  Договор {amendment.contract.number}
                </Link>
              )}
              {amendment.contract?.client && (
                <Link href={`/clients/${amendment.contract.client.id}`} className="flex items-center gap-1 hover:text-primary">
                  <Building2 className="w-3.5 h-3.5" />
                  {amendment.contract.client.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ</h2>
                <p className="text-sm text-muted-foreground mt-1">№ {amendment.number}</p>
              </div>

              {amendment.contract && (
                <div className="p-4 bg-background-light rounded-lg mb-6">
                  <p className="text-sm">
                    <span className="font-medium">К договору: </span>
                    № {amendment.contract.number} — {amendment.contract.title}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Описание изменений</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{amendment.description}</p>
              </div>

              {amendment.changes && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Детали изменений</h3>
                  {Array.isArray(amendment.changes) ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-3 font-medium">Поле</th>
                            <th className="text-left p-3 font-medium">Было</th>
                            <th className="text-left p-3 font-medium">Стало</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(amendment.changes as any[]).map((change: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="p-3 font-medium">
                                {AMENDMENT_FIELD_OPTIONS.find((o) => o.value === change.field)?.label || change.field}
                              </td>
                              <td className="p-3 text-muted-foreground line-through">{change.oldValue}</td>
                              <td className="p-3 text-green-700 font-medium">{change.newValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {typeof amendment.changes === "string"
                          ? amendment.changes
                          : JSON.stringify(amendment.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Сводка</h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Дата вступления: {formatDate(amendment.effectiveDate)}</p>
                <p>Создан: {formatDate(amendment.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Действия</h3>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {amendment.status === "DRAFT" && (
                <Link href={`/documents/amendments/${amendment.id}/edit`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Pencil className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                </Link>
              )}
              <AmendmentActions amendmentId={amendment.id} status={amendment.status} />
              <DownloadPdfButton type="amendment" id={amendment.id} className="w-full justify-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
