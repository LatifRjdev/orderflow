import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalProposals } from "@/actions/portal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive";
  }
> = {
  SENT: { label: "Новое", variant: "default" },
  VIEWED: { label: "Просмотрено", variant: "secondary" },
  ACCEPTED: { label: "Принято", variant: "success" },
  REJECTED: { label: "Отклонено", variant: "destructive" },
  EXPIRED: { label: "Истекло", variant: "warning" },
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

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-5 font-medium">Номер</th>
                <th className="text-left py-3 px-5 font-medium">Название</th>
                <th className="text-left py-3 px-5 font-medium">Дата</th>
                <th className="text-left py-3 px-5 font-medium">
                  Действ. до
                </th>
                <th className="text-left py-3 px-5 font-medium">Статус</th>
                <th className="text-right py-3 px-5 font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => {
                const st = statusLabels[proposal.status] || statusLabels.SENT;
                return (
                  <tr
                    key={proposal.id}
                    className="border-b last:border-0 hover:bg-muted/30"
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
                      <Badge variant={st.variant}>{st.label}</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
