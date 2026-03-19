"use client";

import type { ContractSectionType } from "@prisma/client";
import { CONTRACT_SECTION_TYPE_LABELS } from "@/types/contract-sections";
import type {
  ContractTextContent,
  ObligationsContent,
  PaymentTermsContent,
  SignaturesContent,
} from "@/types/contract-sections";
import { Badge } from "@/components/ui/badge";

interface ContractSectionRendererProps {
  section: {
    type: ContractSectionType;
    title: string;
    content: any;
    isVisible: boolean;
  };
  settings?: {
    companyName?: string | null;
    companyAddress?: string | null;
    companyPhone?: string | null;
    companyEmail?: string | null;
  } | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function RenderText({ content }: { content: ContractTextContent }) {
  if (!content.text) return null;
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>;
}

function RenderObligations({ content }: { content: ObligationsContent }) {
  if (!content.items?.length) return null;
  return (
    <ul className="space-y-2">
      {content.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-primary mt-1 shrink-0">{i + 1}.</span>
          <div>
            <span className="font-medium text-sm">{item.title}</span>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function RenderPaymentTerms({ content }: { content: PaymentTermsContent }) {
  return (
    <div className="space-y-3">
      {content.text && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>
      )}
      {content.schedule && content.schedule.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Этап</th>
                <th className="text-right p-3 font-medium">%</th>
                <th className="text-right p-3 font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {content.schedule.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{item.milestone}</td>
                  <td className="p-3 text-right">{item.percentage}%</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td className="p-3 font-medium">Итого</td>
                <td className="p-3 text-right font-medium">
                  {content.schedule.reduce((s, p) => s + p.percentage, 0)}%
                </td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(content.schedule.reduce((s, p) => s + p.amount, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function RenderSignatures({
  content,
  settings,
}: {
  content: SignaturesContent;
  settings?: ContractSectionRendererProps["settings"];
}) {
  if (content.autoFromSettings && settings) {
    return (
      <div className="grid grid-cols-2 gap-8">
        <div className="text-sm space-y-1">
          <p className="font-medium">Исполнитель:</p>
          {settings.companyName && <p>{settings.companyName}</p>}
          {settings.companyAddress && <p className="text-muted-foreground">{settings.companyAddress}</p>}
          {settings.companyPhone && <p className="text-muted-foreground">Тел: {settings.companyPhone}</p>}
          {settings.companyEmail && <p className="text-muted-foreground">Email: {settings.companyEmail}</p>}
          <div className="mt-8 border-t pt-2">
            <p className="text-xs text-muted-foreground">Подпись / Дата</p>
          </div>
        </div>
        <div className="text-sm space-y-1">
          <p className="font-medium">Заказчик:</p>
          <p className="text-muted-foreground">_____________________________</p>
          <div className="mt-8 border-t pt-2">
            <p className="text-xs text-muted-foreground">Подпись / Дата</p>
          </div>
        </div>
      </div>
    );
  }
  if (content.customText) {
    return <p className="whitespace-pre-wrap text-sm">{content.customText}</p>;
  }
  return null;
}

export function ContractSectionRenderer({ section, settings }: ContractSectionRendererProps) {
  if (!section.isVisible) return null;

  const content = section.content as any;
  let body: React.ReactNode = null;

  switch (section.type) {
    case "SUBJECT":
    case "LIABILITY":
    case "DISPUTE_RESOLUTION":
    case "FORCE_MAJEURE":
    case "CUSTOM":
      body = <RenderText content={content} />;
      break;
    case "OBLIGATIONS_EXECUTOR":
    case "OBLIGATIONS_CLIENT":
      body = <RenderObligations content={content} />;
      break;
    case "PAYMENT_TERMS":
      body = <RenderPaymentTerms content={content} />;
      break;
    case "SIGNATURES":
      body = <RenderSignatures content={content} settings={settings} />;
      break;
  }

  if (!body) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{section.title}</h3>
      {body}
    </div>
  );
}
