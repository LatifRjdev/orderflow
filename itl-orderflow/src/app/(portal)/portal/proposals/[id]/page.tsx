import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPortalClient, getPortalProposal } from "@/actions/portal";
import { getSettings } from "@/actions/settings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProposalResponseButtons } from "@/components/portal/proposal-response";
import { SectionRenderer, PaymentScheduleRenderer } from "@/components/proposals/sections/section-renderer";

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

interface PortalProposalPageProps {
  params: { id: string };
}

export default async function PortalProposalPage({
  params,
}: PortalProposalPageProps) {
  const cookieStore = cookies();
  const token = cookieStore.get("portal_token")?.value;

  if (!token) redirect("/portal/login");

  const client = await getPortalClient(token);
  if (!client) redirect("/portal/login");

  const [proposal, settings] = await Promise.all([
    getPortalProposal(client.id, params.id),
    getSettings(),
  ]);
  if (!proposal) notFound();

  const hasSections = proposal.sections && proposal.sections.length > 0;

  const st = statusLabels[proposal.status] || statusLabels.SENT;
  const canRespond = ["SENT", "VIEWED"].includes(proposal.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/portal/proposals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{proposal.title}</h1>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {proposal.number}
          </p>
        </div>
      </div>

      {/* Action bar for pending proposals */}
      {canRespond && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Ожидается ваш ответ на предложение
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Ознакомьтесь с условиями и примите решение
                </p>
              </div>
              <ProposalResponseButtons
                clientId={client.id}
                proposalId={proposal.id}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal content */}
      <Card>
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold mb-1">ITL Solutions</h2>
              <p className="text-sm text-muted-foreground">
                г. Душанбе, Таджикистан
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h3>
              <p className="text-sm font-mono">{proposal.number}</p>
            </div>
          </div>

          {/* Client + Dates */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Клиент
              </p>
              <p className="font-medium">{proposal.client?.name}</p>
              {proposal.client?.legalName && (
                <p className="text-sm text-muted-foreground">
                  {proposal.client.legalName}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">Дата:</span>
                  <span className="font-medium">
                    {formatDate(proposal.createdAt)}
                  </span>
                </div>
                {proposal.validUntil && (
                  <div className="flex justify-end gap-4">
                    <span className="text-muted-foreground">
                      Действительно до:
                    </span>
                    <span className="font-medium">
                      {formatDate(proposal.validUntil)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sections */}
          {hasSections ? (
            <div className="space-y-6 mb-6">
              {proposal.sections.map((section: any) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  settings={settings}
                />
              ))}
            </div>
          ) : (
            <>
              {proposal.introduction && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Введение</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {proposal.introduction}
                  </p>
                </div>
              )}
              {proposal.scope && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Объём работ</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {proposal.scope}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">Описание</th>
                  <th className="text-right py-3 px-4 font-medium">Кол-во</th>
                  <th className="text-right py-3 px-4 font-medium">Цена</th>
                  <th className="text-right py-3 px-4 font-medium">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {proposal.items.map((item: any, idx: number) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-3 px-4 text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(item.unitPrice, proposal.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(item.total, proposal.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between font-bold text-lg">
                <span>Итого:</span>
                <span>
                  {formatCurrency(proposal.totalAmount, proposal.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Schedule */}
          {proposal.payments && proposal.payments.length > 0 && (
            <div className="mt-8">
              <PaymentScheduleRenderer
                payments={proposal.payments}
                currency={proposal.currency}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom action for pending proposals */}
      {canRespond && (
        <div className="flex justify-end gap-3">
          <ProposalResponseButtons
            clientId={client.id}
            proposalId={proposal.id}
          />
        </div>
      )}

      {proposal.status === "ACCEPTED" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5 text-center">
            <p className="text-green-700 font-medium">
              Вы приняли это предложение{" "}
              {proposal.respondedAt && formatDate(proposal.respondedAt)}
            </p>
          </CardContent>
        </Card>
      )}

      {proposal.status === "REJECTED" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-5 text-center">
            <p className="text-red-700 font-medium">
              Вы отклонили это предложение{" "}
              {proposal.respondedAt && formatDate(proposal.respondedAt)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
