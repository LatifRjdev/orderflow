"use client";

import type { TechSpecSectionType } from "@prisma/client";
import { SPEC_SECTION_TYPE_LABELS } from "@/types/tech-spec-sections";
import type {
  SpecTextContent,
  GoalsContent,
  FunctionalRequirementsContent,
  NonFunctionalRequirementsContent,
  SpecTechStackContent,
  TimelineContent,
  AcceptanceCriteriaContent,
} from "@/types/tech-spec-sections";
import { Badge } from "@/components/ui/badge";

interface SpecSectionRendererProps {
  section: {
    type: TechSpecSectionType;
    title: string;
    content: any;
    isVisible: boolean;
  };
}

function RenderText({ content }: { content: SpecTextContent }) {
  if (!content.text) return null;
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.text}</p>;
}

function RenderGoals({ content }: { content: GoalsContent }) {
  if (!content.items?.length) return null;
  const priorityColors: Record<string, string> = {
    "Высокий": "bg-red-100 text-red-800",
    "Средний": "bg-yellow-100 text-yellow-800",
    "Низкий": "bg-green-100 text-green-800",
  };
  return (
    <ul className="space-y-2">
      {content.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-primary mt-1 shrink-0">{i + 1}.</span>
          <div className="flex-1">
            <span className="text-sm">{item.goal}</span>
          </div>
          <Badge className={`text-xs shrink-0 ${priorityColors[item.priority] || ""}`} variant="secondary">
            {item.priority}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function RenderFunctionalRequirements({ content }: { content: FunctionalRequirementsContent }) {
  if (!content.modules?.length) return null;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium">Модуль</th>
            <th className="text-left p-3 font-medium">Описание</th>
            <th className="text-left p-3 font-medium">Требования</th>
          </tr>
        </thead>
        <tbody>
          {content.modules.map((mod, i) => (
            <tr key={i} className="border-t">
              <td className="p-3 font-medium align-top">{mod.name}</td>
              <td className="p-3 align-top text-muted-foreground">{mod.description}</td>
              <td className="p-3 align-top">
                <ul className="list-disc list-inside space-y-0.5">
                  {mod.requirements.filter(Boolean).map((r, j) => (
                    <li key={j} className="text-muted-foreground">{r}</li>
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

function RenderNonFunctional({ content }: { content: NonFunctionalRequirementsContent }) {
  if (!content.items?.length) return null;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium">Категория</th>
            <th className="text-left p-3 font-medium">Требование</th>
          </tr>
        </thead>
        <tbody>
          {content.items.map((item, i) => (
            <tr key={i} className="border-t">
              <td className="p-3 font-medium align-top">{item.category}</td>
              <td className="p-3 text-muted-foreground">{item.requirement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderTechStack({ content }: { content: SpecTechStackContent }) {
  if (!content.items?.length) return null;
  return (
    <div className="grid gap-2">
      {content.items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {item.name}
          </Badge>
          {item.description && (
            <span className="text-sm text-muted-foreground">— {item.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function RenderTimeline({ content }: { content: TimelineContent }) {
  if (!content.phases?.length) return null;
  return (
    <div className="space-y-3">
      {content.phases.map((phase, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{phase.name}</span>
              {phase.duration && (
                <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
              )}
            </div>
            {phase.deliverables && (
              <p className="text-sm text-muted-foreground mt-1">{phase.deliverables}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderAcceptanceCriteria({ content }: { content: AcceptanceCriteriaContent }) {
  if (!content.items?.length) return null;
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium">Критерий</th>
            <th className="text-left p-3 font-medium">Метод проверки</th>
          </tr>
        </thead>
        <tbody>
          {content.items.map((item, i) => (
            <tr key={i} className="border-t">
              <td className="p-3">{item.criterion}</td>
              <td className="p-3 text-muted-foreground">{item.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SpecSectionRenderer({ section }: SpecSectionRendererProps) {
  if (!section.isVisible) return null;

  const content = section.content as any;
  let body: React.ReactNode = null;

  switch (section.type) {
    case "INTRODUCTION":
    case "CUSTOM":
      body = <RenderText content={content} />;
      break;
    case "GOALS":
      body = <RenderGoals content={content} />;
      break;
    case "FUNCTIONAL_REQUIREMENTS":
      body = <RenderFunctionalRequirements content={content} />;
      break;
    case "NON_FUNCTIONAL_REQUIREMENTS":
      body = <RenderNonFunctional content={content} />;
      break;
    case "TECH_STACK":
      body = <RenderTechStack content={content} />;
      break;
    case "TIMELINE":
      body = <RenderTimeline content={content} />;
      break;
    case "ACCEPTANCE_CRITERIA":
      body = <RenderAcceptanceCriteria content={content} />;
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
