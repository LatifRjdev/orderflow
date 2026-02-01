import { notFound } from "next/navigation";
import { getProposal } from "@/actions/proposals";
import { prisma } from "@/lib/prisma";
import type { ProposalSectionType } from "@prisma/client";

interface PrintProposalPageProps {
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

function PrintSection({ section }: { section: any }) {
  const content = section.content as any;

  switch (section.type as ProposalSectionType) {
    case "ABOUT_SOLUTION":
    case "ARCHITECTURE":
    case "ADDITIONAL_TERMS":
    case "CUSTOM":
      if (!content?.text) return null;
      return (
        <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
          <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {section.title}
          </p>
          <p className="text-sm whitespace-pre-wrap">{content.text}</p>
        </div>
      );

    case "TECH_STACK":
      if (!content?.items?.length) return null;
      return (
        <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
          <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {section.title}
          </p>
          <table>
            <thead>
              <tr>
                <th>Технология</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {content.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="font-bold">{item.name}</td>
                  <td className="text-sm">{item.description || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "KEY_ADVANTAGES":
      if (!content?.items?.length) return null;
      return (
        <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
          <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {section.title}
          </p>
          <ul style={{ paddingLeft: "1.5rem", margin: 0 }}>
            {content.items.map((item: any, i: number) => (
              <li key={i} style={{ marginBottom: "0.5rem" }}>
                <strong>{item.title}</strong>
                {item.description && (
                  <span className="text-muted"> — {item.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      );

    case "FUNCTIONAL_MODULES":
      if (!content?.modules?.length) return null;
      return (
        <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
          <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {section.title}
          </p>
          <table>
            <thead>
              <tr>
                <th>Модуль</th>
                <th>Описание</th>
                <th>Функции</th>
              </tr>
            </thead>
            <tbody>
              {content.modules.map((mod: any, i: number) => (
                <tr key={i}>
                  <td className="font-bold" style={{ verticalAlign: "top" }}>{mod.name}</td>
                  <td className="text-sm" style={{ verticalAlign: "top" }}>{mod.description}</td>
                  <td className="text-sm" style={{ verticalAlign: "top" }}>
                    {mod.features?.filter(Boolean).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "IMPLEMENTATION_STAGES":
      if (!content?.stages?.length) return null;
      return (
        <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
          <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {section.title}
          </p>
          <table>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>№</th>
                <th>Этап</th>
                <th>Описание</th>
                <th style={{ width: "15%" }}>Срок</th>
              </tr>
            </thead>
            <tbody>
              {content.stages.map((stage: any, i: number) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="font-bold">{stage.name}</td>
                  <td className="text-sm">{stage.description}</td>
                  <td className="text-sm">{stage.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "CONTACT_INFO":
    case "PAYMENT_SCHEDULE":
      return null;

    default:
      return null;
  }
}

export default async function PrintProposalPage({
  params,
}: PrintProposalPageProps) {
  const proposal = await getProposal(params.id);
  if (!proposal) notFound();

  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  const hasSections = proposal.sections && proposal.sections.length > 0;
  const contactSection = proposal.sections?.find((s: any) => s.type === "CONTACT_INFO");
  const contactContent = contactSection?.content as any;

  return (
    <html>
      <head>
        <title>КП {proposal.number}</title>
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
          table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
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
          .mb-4 { margin-bottom: 1rem; }
          .mb-8 { margin-bottom: 2rem; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .gap-8 { gap: 2rem; }
          .border-t { border-top: 2px solid #1a1a1a; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          ul { padding-left: 1.5rem; }
          li { margin-bottom: 0.25rem; }
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
            <h1 style={{ fontSize: "28px", margin: 0 }}>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
            <p className="text-muted" style={{ fontSize: "20px", margin: "4px 0" }}>
              {proposal.number}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="font-bold" style={{ fontSize: "18px" }}>
              {settings?.companyName || "ITL Solutions"}
            </p>
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
            <p className="text-xs text-muted mb-2">КЛИЕНТ</p>
            <p className="font-bold">{proposal.client?.name}</p>
            {proposal.client?.legalName && (
              <p className="text-sm">{proposal.client.legalName}</p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mb-2">
              <p className="text-xs text-muted">Дата</p>
              <p className="font-bold">{formatDate(proposal.createdAt)}</p>
            </div>
            {proposal.validUntil && (
              <div>
                <p className="text-xs text-muted">Действительно до</p>
                <p className="font-bold">{formatDate(proposal.validUntil)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sections or legacy content */}
        {hasSections ? (
          <>
            {proposal.sections
              .filter((s: any) => s.isVisible)
              .map((section: any) => (
                <PrintSection key={section.id} section={section} />
              ))}
          </>
        ) : (
          <>
            {proposal.introduction && (
              <div className="mb-8">
                <p className="text-xs text-muted mb-2">ВВЕДЕНИЕ</p>
                <p className="text-sm whitespace-pre-wrap">{proposal.introduction}</p>
              </div>
            )}
            {proposal.scope && (
              <div className="mb-8">
                <p className="text-xs text-muted mb-2">ОБЪЁМ РАБОТ</p>
                <p className="text-sm whitespace-pre-wrap">{proposal.scope}</p>
              </div>
            )}
          </>
        )}

        {/* Cost heading */}
        <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Стоимость
        </p>

        {/* Items */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>№</th>
              <th>Описание</th>
              <th className="text-right" style={{ width: "12%" }}>Кол-во</th>
              <th className="text-right" style={{ width: "18%" }}>Цена</th>
              <th className="text-right" style={{ width: "18%" }}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {proposal.items.map((item: any, idx: number) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.unitPrice, proposal.currency)}</td>
                <td className="text-right">{formatCurrency(item.total, proposal.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-4" style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "280px" }}>
            <div
              className="border-t"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                marginTop: "8px",
              }}
            >
              <span className="font-bold" style={{ fontSize: "18px" }}>Итого:</span>
              <span className="font-bold" style={{ fontSize: "18px" }}>
                {formatCurrency(proposal.totalAmount, proposal.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        {proposal.payments && proposal.payments.length > 0 && (
          <div className="mt-8" style={{ pageBreakInside: "avoid" }}>
            <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              График оплаты
            </p>
            <table>
              <thead>
                <tr>
                  <th>Этап</th>
                  <th className="text-right" style={{ width: "12%" }}>%</th>
                  <th className="text-right" style={{ width: "20%" }}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {proposal.payments.map((p: any, i: number) => (
                  <tr key={i}>
                    <td>
                      {p.stageName}
                      {p.description && (
                        <span className="text-sm text-muted"> — {p.description}</span>
                      )}
                    </td>
                    <td className="text-right">{p.percentage}%</td>
                    <td className="text-right font-bold">
                      {formatCurrency(p.amount, proposal.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contact Info */}
        {contactContent && (contactContent.autoFromSettings || contactContent.customText) && (
          <div className="mt-8" style={{ pageBreakInside: "avoid", borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
            <p className="text-xs text-muted mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Контактная информация
            </p>
            {contactContent.autoFromSettings && settings ? (
              <div className="text-sm">
                <p className="font-bold">{settings.companyName}</p>
                {settings.companyAddress && <p>{settings.companyAddress}</p>}
                {settings.companyPhone && <p>Тел: {settings.companyPhone}</p>}
                {settings.companyEmail && <p>Email: {settings.companyEmail}</p>}
              </div>
            ) : contactContent.customText ? (
              <p className="text-sm whitespace-pre-wrap">{contactContent.customText}</p>
            ) : null}
          </div>
        )}
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('print-btn').addEventListener('click', function() { window.print(); });` }} />
      </body>
    </html>
  );
}
