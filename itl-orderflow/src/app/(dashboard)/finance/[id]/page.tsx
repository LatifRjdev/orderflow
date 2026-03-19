import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Building2,
  Briefcase,
  CreditCard,
  Printer,
  Pencil,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InvoiceEventTimeline } from "@/components/finance/invoice-event-timeline";
import { DownloadInvoicePdfButton } from "@/components/finance/download-pdf-button";

interface InvoicePageProps {
  params: { id: string };
}

const statusMap: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: "Черновик", dot: "#9ca3af" },
  SENT: { label: "Отправлен", dot: "#3b82f6" },
  VIEWED: { label: "Просмотрен", dot: "#8b5cf6" },
  PAID: { label: "Оплачен", dot: "#22c55e" },
  PARTIALLY_PAID: { label: "Частично оплачен", dot: "#f59e0b" },
  OVERDUE: { label: "Просрочен", dot: "#ef4444" },
  CANCELLED: { label: "Отменён", dot: "#9ca3af" },
};

export default async function InvoicePage({ params }: InvoicePageProps) {
  const invoice = await getInvoice(params.id);

  if (!invoice) {
    notFound();
  }

  const statusInfo = statusMap[invoice.status] || statusMap.DRAFT;
  const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/finance">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{invoice.number}</h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ borderColor: statusInfo.dot + "40", backgroundColor: statusInfo.dot + "10" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusInfo.dot }} />
                <span className="text-sm font-medium" style={{ color: statusInfo.dot }}>{statusInfo.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {invoice.client && (
                <Link
                  href={`/clients/${invoice.client.id}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {invoice.client.name}
                </Link>
              )}
              {invoice.order && (
                <Link
                  href={`/orders/${invoice.order.id}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {invoice.order.number}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "DRAFT" && (
            <>
              <Link href={`/finance/${params.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </Link>
              <Button size="sm">
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </Button>
            </>
          )}
          <Link href={`/finance/${params.id}/print`} target="_blank">
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Печать / PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Invoice Preview */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-8">
              {/* Invoice Header */}
              <div className="flex justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold mb-1">ITL Solutions</h2>
                  <p className="text-sm text-muted-foreground">
                    г. Душанбе, Таджикистан
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold">СЧЁТ</h3>
                  <p className="text-sm font-mono">{invoice.number}</p>
                </div>
              </div>

              {/* Bill To + Dates */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Клиент
                  </p>
                  <p className="font-medium">{invoice.client?.name}</p>
                  {invoice.client?.legalName && (
                    <p className="text-sm text-muted-foreground">
                      {invoice.client.legalName}
                    </p>
                  )}
                  {invoice.client?.inn && (
                    <p className="text-sm text-muted-foreground">
                      ИНН: {invoice.client.inn}
                    </p>
                  )}
                  {invoice.client?.address && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.client.address}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-end gap-4">
                      <span className="text-muted-foreground">Дата выставления:</span>
                      <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                    </div>
                    <div className="flex justify-end gap-4">
                      <span className="text-muted-foreground">Оплатить до:</span>
                      <span className="font-medium">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#dbdfe6] rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-background-light">
                      <th className="text-left py-3 px-4 font-medium">#</th>
                      <th className="text-left py-3 px-4 font-medium">Описание</th>
                      <th className="text-right py-3 px-4 font-medium">Кол-во</th>
                      <th className="text-right py-3 px-4 font-medium">Цена</th>
                      <th className="text-right py-3 px-4 font-medium">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item: any, idx: number) => (
                      <tr key={item.id} className="border-t border-[#dbdfe6]">
                        <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-4">{item.description}</td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Подытог:</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Налог:</span>
                      <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого:</span>
                    <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                  </div>
                  {(invoice.paidAmount || 0) > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Оплачено:</span>
                        <span>
                          -{formatCurrency(invoice.paidAmount, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>К оплате:</span>
                        <span>{formatCurrency(remainingAmount, invoice.currency)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mt-8 pt-4 border-t border-[#dbdfe6]">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Примечания
                  </p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Сводка</h3>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Сумма</span>
                <span className="font-bold text-lg">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Оплачено</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paidAmount || 0, invoice.currency)}
                </span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Остаток</span>
                  <span className="font-medium text-amber-600">
                    {formatCurrency(remainingAmount, invoice.currency)}
                  </span>
                </div>
              )}

              {/* Payment Progress */}
              {invoice.totalAmount > 0 && (
                <div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round(((invoice.paidAmount || 0) / invoice.totalAmount) * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(((invoice.paidAmount || 0) / invoice.totalAmount) * 100)}% оплачено
                  </p>
                </div>
              )}

              <Separator />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Выставлен: {formatDate(invoice.issueDate)}</p>
                <p>Срок: {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
                {invoice.paidAt && (
                  <p>Оплачен: {formatDate(invoice.paidAt)}</p>
                )}
              </div>

              {remainingAmount > 0 && invoice.status !== "CANCELLED" && (
                <>
                  <Separator />
                  <Button className="w-full" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Записать оплату
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Платежи
              </h3>
            </div>
            <div className="px-6 pb-6">
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#dbdfe6] bg-background-light/30"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(payment.amount, invoice.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)} — {payment.paymentMethod || "—"}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground">
                            Реф: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Платежей нет
                </p>
              )}
            </div>
          </div>

          {/* Event Timeline */}
          <InvoiceEventTimeline events={invoice.events || []} />

          {/* Actions */}
          <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-base font-semibold">Действия</h3>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {invoice.status === "DRAFT" && (
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Отправить клиенту
                </Button>
              )}
              <DownloadInvoicePdfButton
                invoiceId={params.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              />
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Печать
              </Button>
              {invoice.status === "DRAFT" && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive"
                  size="sm"
                >
                  Отменить счёт
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
