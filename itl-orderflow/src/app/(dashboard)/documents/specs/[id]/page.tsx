import { notFound } from "next/navigation";
import Link from "next/link";
import { getTechSpec } from "@/actions/tech-specs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, Briefcase, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DownloadPdfButton } from "@/components/documents/download-pdf-button";
import { TechSpecActions } from "@/components/documents/tech-spec-actions";
import { SpecSectionRenderer } from "@/components/documents/sections/spec-section-renderer";

const statusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  REVIEW: { label: "На проверке", dot: "#f59e0b" },
  APPROVED: { label: "Утверждено", dot: "#22c55e" },
  ARCHIVED: { label: "Архив", dot: "#6b7280" },
};

export default async function TechSpecDetailPage({ params }: { params: { id: string } }) {
  const spec = await getTechSpec(params.id);
  if (!spec) notFound();

  const st = statusMap[spec.status] || statusMap.DRAFT;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/documents?tab=specs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{spec.title}</h1>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ borderColor: st.dot + "40", backgroundColor: st.dot + "10" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                <span className="text-sm font-medium" style={{ color: st.dot }}>{st.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="font-mono">{spec.number}</span>
              <span>v{spec.version}</span>
              {spec.client && (
                <Link href={`/clients/${spec.client.id}`} className="flex items-center gap-1 hover:text-primary">
                  <Building2 className="w-3.5 h-3.5" />
                  {spec.client.name}
                </Link>
              )}
              {spec.order && (
                <Link href={`/orders/${spec.order.id}`} className="flex items-center gap-1 hover:text-primary">
                  <Briefcase className="w-3.5 h-3.5" />
                  {spec.order.number}
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
                <h2 className="text-xl font-bold">ТЕХНИЧЕСКОЕ ЗАДАНИЕ</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  № {spec.number} (версия {spec.version})
                </p>
              </div>

              {spec.sections?.map((section: any) => (
                <div key={section.id} className="mb-6">
                  <SpecSectionRenderer
                    section={{
                      type: section.type,
                      title: section.title,
                      content: section.content,
                      isVisible: true,
                    }}
                  />
                </div>
              ))}

              {(!spec.sections || spec.sections.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Разделы не добавлены</p>
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Разделов</span>
                <span className="font-medium">{spec.sections?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Версия</span>
                <span className="font-medium">{spec.version}</span>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Создан: {formatDate(spec.createdAt)}</p>
                {spec.approvedDate && <p>Утверждён: {formatDate(spec.approvedDate)}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Действия</h3>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {(spec.status === "DRAFT" || spec.status === "REVIEW") && (
                <Link href={`/documents/specs/${spec.id}/edit`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Pencil className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                </Link>
              )}
              <TechSpecActions specId={spec.id} status={spec.status} />
              <DownloadPdfButton type="tech-spec" id={spec.id} className="w-full justify-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
