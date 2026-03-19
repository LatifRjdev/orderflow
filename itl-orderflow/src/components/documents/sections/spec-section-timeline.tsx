"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { TimelineContent, TimelinePhase } from "@/types/tech-spec-sections";

interface SpecSectionTimelineProps {
  content: TimelineContent;
  onChange: (content: TimelineContent) => void;
}

export function SpecSectionTimeline({ content, onChange }: SpecSectionTimelineProps) {
  const phases = content.phases || [];

  function addPhase() {
    onChange({
      phases: [...phases, { name: "", duration: "", deliverables: "" }],
    });
  }

  function removePhase(index: number) {
    if (phases.length <= 1) return;
    onChange({ phases: phases.filter((_, i) => i !== index) });
  }

  function updatePhase(index: number, field: keyof TimelinePhase, value: string) {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ phases: updated });
  }

  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Этап {idx + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removePhase(idx)}
              disabled={phases.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs text-muted-foreground">Название этапа</Label>
              <Input
                placeholder="Название этапа"
                value={phase.name || ""}
                onChange={(e) => updatePhase(idx, "name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Длительность</Label>
              <Input
                placeholder="2 недели"
                value={phase.duration || ""}
                onChange={(e) => updatePhase(idx, "duration", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Результаты</Label>
            <Textarea
              rows={2}
              placeholder="Ожидаемые результаты этапа"
              value={phase.deliverables || ""}
              onChange={(e) => updatePhase(idx, "deliverables", e.target.value)}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addPhase}>
        <Plus className="w-3 h-3 mr-1" />
        Добавить этап
      </Button>
    </div>
  );
}
