import { notFound } from "next/navigation";
import { getInvoice } from "@/actions/invoices";
import { prisma } from "@/lib/prisma";

interface PrintInvoicePageProps {
  params: { id: string };
}

function formatCurrency(amount: number, currency = "TJS"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency === "TJS" ? "RUB" : currency,
    minimumFractionDigits: 2,
  })
    .format(amount)
    .replace("₽", currency === "TJS" ? "TJS" : currency);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PrintInvoicePage({
  params,
}: PrintInvoicePageProps) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  return (
    <html>
      <head>
        <title>Счёт {invoice.number}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            body { margin: 0; padding: 20mm; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #1a1a1a;
            line-height: 1.5;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 12px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          td { border-bottom: 1px solid #e5e7eb; }
          .text-right { text-align: right; }
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .text-muted { color: #6b7280; }
          .font-bold { font-weight: 700; }
          .mt-4 { margin-top: 1rem; }
          .mt-8 { margin-top: 2rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-8 { margin-bottom: 2rem; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .gap-8 { gap: 2rem; }
          .border-t { border-top: 2px solid #1a1a1a; }
          .print-btn {
            position: fixed; top: 20px; right: 20px;
            padding: 10px 24px; background: #3b82f6; color: white;
            border: none; border-radius: 8px; cursor: pointer;
            font-size: 14px; font-weight: 500;
          }
          .print-btn:hover { background: #2563eb; }
        `,
          }}
        />
      </head>
      <body>
        <button
          className="no-print print-btn"
          id="print-btn"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "10px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Печать / PDF
        </button>

        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 style={{ fontSize: "28px", margin: 0 }}>СЧЁТ</h1>
            <p className="text-muted" style={{ fontSize: "20px", margin: "4px 0" }}>
              {invoice.number}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="font-bold" style={{ fontSize: "18px" }}>
              {settings?.companyName || "ITL Solutions"}
            </p>
            {settings?.companyInn && (
              <p className="text-sm text-muted">ИНН: {settings.companyInn}</p>
            )}
            {settings?.companyAddress && (
              <p className="text-sm text-muted">{settings.companyAddress}</p>
            )}
            {settings?.companyPhone && (
              <p className="text-sm text-muted">{settings.companyPhone}</p>
            )}
            {settings?.companyEmail && (
              <p className="text-sm text-muted">{settings.companyEmail}</p>
            )}
          </div>
        </div>

        {/* Client & Dates */}
        <div className="flex justify-between mb-8" style={{ gap: "4rem" }}>
          <div>
            <p className="text-xs text-muted mb-2">ПОЛУЧАТЕЛЬ</p>
            <p className="font-bold">{invoice.client?.name}</p>
            {invoice.client?.legalName && (
              <p className="text-sm">{invoice.client.legalName}</p>
            )}
            {invoice.client?.inn && (
              <p className="text-sm text-muted">ИНН: {invoice.client.inn}</p>
            )}
            {invoice.client?.address && (
              <p className="text-sm text-muted">{invoice.client.address}</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mb-2">
              <p className="text-xs text-muted">Дата выставления</p>
              <p className="font-bold">{formatDate(invoice.issueDate)}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-xs text-muted">Срок оплаты</p>
                <p className="font-bold">{formatDate(invoice.dueDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order */}
        {invoice.order && (
          <div className="mb-8">
            <p className="text-xs text-muted mb-2">ПРОЕКТ</p>
            <p>
              {invoice.order.number} — {invoice.order.title}
            </p>
          </div>
        )}

        {/* Items */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>№</th>
              <th>Описание</th>
              <th className="text-right" style={{ width: "12%" }}>
                Кол-во
              </th>
              <th className="text-right" style={{ width: "18%" }}>
                Цена
              </th>
              <th className="text-right" style={{ width: "18%" }}>
                Сумма
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </td>
                <td className="text-right">
                  {formatCurrency(item.total, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4" style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "280px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <span className="text-muted">Подитог:</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                }}
              >
                <span className="text-muted">Скидка:</span>
                <span>
                  -{formatCurrency(invoice.discountAmount, invoice.currency)}
                </span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                }}
              >
                <span className="text-muted">Налог:</span>
                <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div
              className="border-t"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                marginTop: "8px",
              }}
            >
              <span className="font-bold" style={{ fontSize: "18px" }}>
                Итого:
              </span>
              <span className="font-bold" style={{ fontSize: "18px" }}>
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8">
            <p className="text-xs text-muted mb-2">ПРИМЕЧАНИЯ</p>
            <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Payment info */}
        {invoice.paidAmount > 0 && (
          <div className="mt-8">
            <p className="text-xs text-muted mb-2">ОПЛАТА</p>
            <p className="text-sm">
              Оплачено: {formatCurrency(invoice.paidAmount, invoice.currency)}
              {invoice.paidAt && ` (${formatDate(invoice.paidAt)})`}
            </p>
          </div>
        )}
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('print-btn').addEventListener('click', function() { window.print(); });` }} />
      </body>
    </html>
  );
}
