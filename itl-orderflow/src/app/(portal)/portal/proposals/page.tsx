import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalProposals } from "@/actions/portal";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusDots: Record<string, { label: string; dot: string }> = {
  SENT: { label: "Новое", dot: "#3b82f6" },
  VIEWED: { label: "Просмотрено", dot: "#8b5cf6" },
  ACCEPTED: { label: "Принято", dot: "#22c55e" },
  REJECTED: { label: "Отклонено", dot: "#ef4444" },
  EXPIRED: { label: "Истекло", dot: "#f59e0b" },
};

export default async function PortalProposalsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const proposals = await getPortalProposals(client.id);

  const pendingCount = proposals.filter((p) =>
    ["SENT", "VIEWED"].includes(p.status)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Коммерческие предложения</h1>
        <p className="text-muted-foreground mt-1">
          Предложения от ITL Solutions
          {pendingCount > 0 && (
            <span className="text-primary font-medium">
              {" "}
              — {pendingCount} ожидают ответа
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#dbdfe6] bg-background-light">
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Номер</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Название</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата</th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Действ. до
              </th>
              <th className="text-left py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус</th>
              <th className="text-right py-3 px-5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => {
              const st = statusDots[proposal.status] || statusDots.SENT;
              return (
                <tr
                  key={proposal.id}
                  className="border-b border-[#dbdfe6] last:border-0 hover:bg-background-light/50 transition-colors"
                >
                  <td className="py-3 px-5">
                    <Link
                      href={`/portal/proposals/${proposal.id}`}
                      className="font-mono font-medium text-primary hover:underline"
                    >
                      {proposal.number}
                    </Link>
                  </td>
                  <td className="py-3 px-5">{proposal.title}</td>
                  <td className="py-3 px-5">
                    {formatDate(proposal.createdAt)}
                  </td>
                  <td className="py-3 px-5">
                    {proposal.validUntil
                      ? formatDate(proposal.validUntil)
                      : "—"}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                      <span className="text-sm">{st.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right font-medium">
                    {formatCurrency(proposal.totalAmount, proposal.currency)}
                  </td>
                </tr>
              );
            })}
            {proposals.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Предложений пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
