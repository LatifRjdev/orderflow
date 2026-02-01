"use client";

import type { ProposalSectionType } from "@prisma/client";
import { SECTION_TYPE_LABELS } from "@/types/proposal-sections";
import type {
  AboutSolutionContent,
  TechStackContent,
  KeyAdvantagesContent,
  FunctionalModulesContent,
  ArchitectureContent,
  ImplementationStagesContent,
  AdditionalTermsContent,
  ContactInfoContent,
  CustomSectionContent,
} from "@/types/proposal-sections";
import { Badge } from "@/components/ui/badge";

interface SectionRendererProps {
  section: {
    type: ProposalSectionType;
    title: string;
    content: any;
    isVisible: boolean;
  };
  settings?: {
    companyName?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    companyAddress?: string | null;
    companyWebsite?: string | null;
  } | null;
}

interface PaymentRendererProps {
  payments: {
    stageName: string;
    percentage: number;
    amount: number;
    description?: string | null;
  }[];
  currency: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

function RenderAboutSolution({ content }: { content: AboutSolutionContent }) {
  if (!content.text) return null;
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>;
}

function RenderTechStack({ content }: { content: TechStackContent }) {
  if (!content.items?.length) return null;
  return (
    <div className="grid gap-2">
      {content.items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {item.category || "Технология"}
          </Badge>
          <div>
            <span className="font-medium text-sm">{item.name}</span>
            {item.description && (
              <span className="text-sm text-muted-foreground ml-2">— {item.description}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderKeyAdvantages({ content }: { content: KeyAdvantagesContent }) {
  if (!content.items?.length) return null;
  return (
    <ul className="space-y-2">
      {content.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-primary mt-1 shrink-0">•</span>
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

function RenderFunctionalModules({ content }: { content: FunctionalModulesContent }) {
  if (!content.modules?.length) return null;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium">Модуль</th>
            <th className="text-left p-3 font-medium">Описание</th>
            <th className="text-left p-3 font-medium">Функции</th>
          </tr>
        </thead>
        <tbody>
          {content.modules.map((mod, i) => (
            <tr key={i} className="border-t">
              <td className="p-3 font-medium align-top">{mod.name}</td>
              <td className="p-3 align-top text-muted-foreground">{mod.description}</td>
              <td className="p-3 align-top">
                <ul className="list-disc list-inside space-y-0.5">
                  {mod.features.filter(Boolean).map((f, j) => (
                    <li key={j} className="text-muted-foreground">{f}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderArchitecture({ content }: { content: ArchitectureContent }) {
  if (!content.text) return null;
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>;
}

function RenderImplementationStages({ content }: { content: ImplementationStagesContent }) {
  if (!content.stages?.length) return null;
  return (
    <div className="space-y-3">
      {content.stages.map((stage, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{stage.name}</span>
              {stage.duration && (
                <Badge variant="outline" className="text-xs">{stage.duration}</Badge>
              )}
            </div>
            {stage.description && (
              <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderAdditionalTerms({ content }: { content: AdditionalTermsContent }) {
  if (!content.text) return null;
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>;
}

function RenderContactInfo({
  content,
  settings,
}: {
  content: ContactInfoContent;
  settings?: SectionRendererProps["settings"];
}) {
  if (content.autoFromSettings && settings) {
    return (
      <div className="text-sm space-y-1">
        {settings.companyName && <p className="font-medium">{settings.companyName}</p>}
        {settings.companyAddress && <p className="text-muted-foreground">{settings.companyAddress}</p>}
        {settings.companyPhone && <p className="text-muted-foreground">Тел: {settings.companyPhone}</p>}
        {settings.companyEmail && <p className="text-muted-foreground">Email: {settings.companyEmail}</p>}
        {settings.companyWebsite && <p className="text-muted-foreground">Сайт: {settings.companyWebsite}</p>}
      </div>
    );
  }
  if (content.customText) {
    return <p className="whitespace-pre-wrap text-sm">{content.customText}</p>;
  }
  return null;
}

function RenderCustom({ content }: { content: CustomSectionContent }) {
  if (!content.text) return null;
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>;
}

export function SectionRenderer({ section, settings }: SectionRendererProps) {
  if (!section.isVisible) return null;

  const content = section.content as any;

  let body: React.ReactNode = null;

  switch (section.type) {
    case "ABOUT_SOLUTION":
      body = <RenderAboutSolution content={content} />;
      break;
    case "TECH_STACK":
      body = <RenderTechStack content={content} />;
      break;
    case "KEY_ADVANTAGES":
      body = <RenderKeyAdvantages content={content} />;
      break;
    case "FUNCTIONAL_MODULES":
      body = <RenderFunctionalModules content={content} />;
      break;
    case "ARCHITECTURE":
      body = <RenderArchitecture content={content} />;
      break;
    case "IMPLEMENTATION_STAGES":
      body = <RenderImplementationStages content={content} />;
      break;
    case "ADDITIONAL_TERMS":
      body = <RenderAdditionalTerms content={content} />;
      break;
    case "CONTACT_INFO":
      body = <RenderContactInfo content={content} settings={settings} />;
      break;
    case "CUSTOM":
      body = <RenderCustom content={content} />;
      break;
    case "PAYMENT_SCHEDULE":
      // Payment schedule is rendered separately via PaymentScheduleRenderer
      return null;
  }

  if (!body) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{section.title}</h3>
      {body}
    </div>
  );
}

export function PaymentScheduleRenderer({ payments, currency }: PaymentRendererProps) {
  if (!payments?.length) return null;

  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">График оплаты</h3>
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
            {payments.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">
                  {p.stageName}
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                  )}
                </td>
                <td className="p-3 text-right">{p.percentage}%</td>
                <td className="p-3 text-right font-medium">{formatCurrency(p.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30">
              <td className="p-3 font-medium">Итого</td>
              <td className="p-3 text-right font-medium">{totalPercentage}%</td>
              <td className="p-3 text-right font-medium">
                {formatCurrency(payments.reduce((s, p) => s + p.amount, 0), currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
