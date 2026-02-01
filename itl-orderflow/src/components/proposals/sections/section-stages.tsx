"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { ImplementationStagesContent, ImplementationStage } from "@/types/proposal-sections";

interface SectionStagesProps {
  content: ImplementationStagesContent;
  onChange: (content: ImplementationStagesContent) => void;
}

export function SectionStages({ content, onChange }: SectionStagesProps) {
  const stages = content.stages || [];

  function addStage() {
    onChange({
      stages: [...stages, { name: "", description: "", duration: "" }],
    });
  }

  function removeStage(index: number) {
    if (stages.length <= 1) return;
    onChange({ stages: stages.filter((_, i) => i !== index) });
  }

  function updateStage(index: number, field: keyof ImplementationStage, value: string) {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ stages: updated });
  }

  return (
    <div className="space-y-4">
      {stages.map((stage, idx) => (
        <div
          key={idx}
          className="border rounded-lg p-4 space-y-3 relative"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Этап {idx + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeStage(idx)}
              disabled={stages.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs text-muted-foreground">Название этапа</Label>
              <Input
                placeholder="Название этапа"
                value={stage.name || ""}
                onChange={(e) => updateStage(idx, "name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Длительность</Label>
              <Input
                placeholder="2 недели"
                value={stage.duration || ""}
                onChange={(e) => updateStage(idx, "duration", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Описание</Label>
            <Textarea
              rows={2}
              placeholder="Описание этапа"
              value={stage.description || ""}
              onChange={(e) => updateStage(idx, "description", e.target.value)}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addStage}>
        <Plus className="w-3 h-3 mr-1" />
        Добавить этап
      </Button>
    </div>
  );
}
