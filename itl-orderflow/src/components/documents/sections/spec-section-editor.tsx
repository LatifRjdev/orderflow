"use client";

import { TechSpecSectionType } from "@prisma/client";
import type {
  SpecSectionDraft,
  SpecSectionContent,
  GoalsContent,
  FunctionalRequirementsContent,
  NonFunctionalRequirementsContent,
  SpecTechStackContent,
  TimelineContent,
  AcceptanceCriteriaContent,
} from "@/types/tech-spec-sections";
import { SpecSectionText } from "./spec-section-text";
import { SpecSectionGoals } from "./spec-section-goals";
import { SpecSectionRequirements } from "./spec-section-requirements";
import { SpecSectionNonFunctional } from "./spec-section-non-functional";
import { SpecSectionTimeline } from "./spec-section-timeline";
import { SpecSectionCriteria } from "./spec-section-criteria";

// Reuse the non-functional list editor for tech stack (same shape: name + description)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

function SpecSectionTechStack({
  content,
  onChange,
}: {
  content: SpecTechStackContent;
  onChange: (content: SpecTechStackContent) => void;
}) {
  const items = content.items || [];

  function addItem() {
    onChange({ items: [...items, { name: "", description: "" }] });
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== index) });
  }

  function updateItem(index: number, field: "name" | "description", value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              {idx === 0 && <Label className="text-xs text-muted-foreground">Технология</Label>}
              <Input
                placeholder="Название технологии"
                value={item.name || ""}
                onChange={(e) => updateItem(idx, "name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              {idx === 0 && <Label className="text-xs text-muted-foreground">Описание</Label>}
              <Input
                placeholder="Назначение"
                value={item.description || ""}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-10 w-10 shrink-0 ${idx === 0 ? "mt-5" : ""}`}
            onClick={() => removeItem(idx)}
            disabled={items.length <= 1}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-3 h-3 mr-1" />
        Добавить технологию
      </Button>
    </div>
  );
}

interface SpecSectionEditorProps {
  section: SpecSectionDraft;
  onChange: (content: SpecSectionContent) => void;
}

export function SpecSectionEditor({ section, onChange }: SpecSectionEditorProps) {
  switch (section.type) {
    case TechSpecSectionType.INTRODUCTION:
    case TechSpecSectionType.CUSTOM:
      return <SpecSectionText content={section.content as { text: string }} onChange={onChange} />;

    case TechSpecSectionType.GOALS:
      return <SpecSectionGoals content={section.content as GoalsContent} onChange={onChange} />;

    case TechSpecSectionType.FUNCTIONAL_REQUIREMENTS:
      return (
        <SpecSectionRequirements
          content={section.content as FunctionalRequirementsContent}
          onChange={onChange}
        />
      );

    case TechSpecSectionType.NON_FUNCTIONAL_REQUIREMENTS:
      return (
        <SpecSectionNonFunctional
          content={section.content as NonFunctionalRequirementsContent}
          onChange={onChange}
        />
      );

    case TechSpecSectionType.TECH_STACK:
      return (
        <SpecSectionTechStack
          content={section.content as SpecTechStackContent}
          onChange={onChange}
        />
      );

    case TechSpecSectionType.TIMELINE:
      return <SpecSectionTimeline content={section.content as TimelineContent} onChange={onChange} />;

    case TechSpecSectionType.ACCEPTANCE_CRITERIA:
      return (
        <SpecSectionCriteria
          content={section.content as AcceptanceCriteriaContent}
          onChange={onChange}
        />
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Неизвестный тип секции
        </p>
      );
  }
}
