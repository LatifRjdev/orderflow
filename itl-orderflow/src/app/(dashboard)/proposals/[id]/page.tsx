import { notFound } from "next/navigation";
import Link from "next/link";
import { getProposal } from "@/actions/proposals";
import { getSettings } from "@/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Briefcase,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProposalActions, ProposalSendButton } from "@/components/proposals/proposal-actions";
import { SectionRenderer, PaymentScheduleRenderer } from "@/components/proposals/sections/section-renderer";

interface ProposalPageProps {
  params: { id: string };
}

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive";
  }
> = {
  DRAFT: { label: "Черновик", variant: "secondary" },
  SENT: { label: "Отправлено", variant: "default" },
  VIEWED: { label: "Просмотрено", variant: "default" },
  ACCEPTED: { label: "Принято", variant: "success" },
  REJECTED: { label: "Отклонено", variant: "destructive" },
  EXPIRED: { label: "Истекло", variant: "warning" },
};

export default async function ProposalPage({ params }: ProposalPageProps) {
  const [proposal, settings] = await Promise.all([
    getProposal(params.id),
    getSettings(),
  ]);

  if (!proposal) {
    notFound();
  }

  const hasSections = proposal.sections && proposal.sections.length > 0;

  const statusInfo = statusMap[proposal.status] || statusMap.DRAFT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/proposals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="font-mono">{proposal.number}</span>
              {proposal.client && (
                <Link
                  href={`/clients/${proposal.client.id}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {proposal.client.name}
                </Link>
              )}
              {proposal.order && (
                <Link
                  href={`/orders/${proposal.order.id}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {proposal.order.number}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {proposal.status === "DRAFT" && (
            <ProposalSendButton proposalId={proposal.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Preview */}
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
                  {/* Legacy: Introduction */}
                  {proposal.introduction && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Введение</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {proposal.introduction}
                      </p>
                    </div>
                  )}

                  {/* Legacy: Scope */}
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
                      <th className="text-left py-3 px-4 font-medium">
                        Описание
                      </th>
                      <th className="text-right py-3 px-4 font-medium">
                        Кол-во
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Цена</th>
                      <th className="text-right py-3 px-4 font-medium">
                        Сумма
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.items?.map((item: any, idx: number) => (
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сводка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Сумма</span>
                <span className="font-bold text-lg">
                  {formatCurrency(proposal.totalAmount, proposal.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Позиций</span>
                <span className="font-medium">{proposal.items?.length || 0}</span>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Создано: {formatDate(proposal.createdAt)}</p>
                {proposal.validUntil && (
                  <p>Действительно до: {formatDate(proposal.validUntil)}</p>
                )}
                {proposal.sentAt && (
                  <p>Отправлено: {formatDate(proposal.sentAt)}</p>
                )}
                {proposal.viewedAt && (
                  <p>Просмотрено: {formatDate(proposal.viewedAt)}</p>
                )}
                {proposal.respondedAt && (
                  <p>Ответ получен: {formatDate(proposal.respondedAt)}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Действия</CardTitle>
            </CardHeader>
            <CardContent>
              <ProposalActions proposalId={proposal.id} status={proposal.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
