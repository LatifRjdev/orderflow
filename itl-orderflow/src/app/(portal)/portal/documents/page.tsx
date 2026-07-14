import { getPortalDocuments } from "@/actions/portal";
import { requirePortalSession } from "@/lib/portal-session";
import { FileStack, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  CONTRACT: "Договор",
  AMENDMENT: "Доп. соглашение",
  TECH_SPEC: "Техническое задание",
  RECONCILIATION: "Акт сверки",
};

const statusDots: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  ACTIVE: { label: "Действует", dot: "#22c55e" },
  COMPLETED: { label: "Завершён", dot: "#3b82f6" },
  TERMINATED: { label: "Расторгнут", dot: "#ef4444" },
  EXPIRED: { label: "Истёк", dot: "#f59e0b" },
  REVIEW: { label: "На согласовании", dot: "#8b5cf6" },
  APPROVED: { label: "Утверждён", dot: "#22c55e" },
  ARCHIVED: { label: "В архиве", dot: "#9ca3af" },
  SENT: { label: "Отправлен", dot: "#3b82f6" },
  CONFIRMED: { label: "Подтверждён", dot: "#22c55e" },
};

export default async function PortalDocumentsPage() {
  const session = await requirePortalSession("canViewDocuments");
  const documents = await getPortalDocuments(session.client.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Документы</h1>
        <p className="text-muted-foreground mt-1">
          Договоры, техзадания, допсоглашения и акты сверки
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#dbdfe6] bg-background-light">
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Тип</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Название</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Файл</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const st = statusDots[doc.status] || { label: doc.status, dot: "#9ca3af" };
              return (
                <tr
                  key={`${doc.type}-${doc.id}`}
                  className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors"
                >
                  <td className="py-3 px-5 font-mono">{doc.number}</td>
                  <td className="py-3 px-5">{typeLabels[doc.type]}</td>
                  <td className="py-3 px-5">{doc.title}</td>
                  <td className="py-3 px-5">{formatDate(doc.date)}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                      <span className="text-sm">{st.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right">
                    {doc.pdfUrl ? (
                      <a
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {documents.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  <FileStack className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Документов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
