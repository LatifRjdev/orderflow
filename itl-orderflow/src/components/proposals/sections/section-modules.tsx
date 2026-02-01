"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { FunctionalModulesContent, FunctionalModule } from "@/types/proposal-sections";

interface SectionModulesProps {
  content: FunctionalModulesContent;
  onChange: (content: FunctionalModulesContent) => void;
}

export function SectionModules({ content, onChange }: SectionModulesProps) {
  const modules = content.modules || [];

  function addModule() {
    onChange({
      modules: [...modules, { name: "", description: "", features: [] }],
    });
  }

  function removeModule(index: number) {
    if (modules.length <= 1) return;
    onChange({ modules: modules.filter((_, i) => i !== index) });
  }

  function updateModule(index: number, field: keyof FunctionalModule, value: string | string[]) {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ modules: updated });
  }

  function handleFeaturesChange(index: number, value: string) {
    const features = value
      .split(",")
      .map((f) => f.trimStart());
    updateModule(index, "features", features);
  }

  function getFeaturesValue(features: string[]): string {
    return features.join(", ");
  }

  return (
    <div className="space-y-4">
      {modules.map((mod, idx) => (
        <div
          key={idx}
          className="border rounded-lg p-4 space-y-3 relative"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Модуль {idx + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeModule(idx)}
              disabled={modules.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Название модуля</Label>
            <Input
              placeholder="Название модуля"
              value={mod.name || ""}
              onChange={(e) => updateModule(idx, "name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Описание</Label>
            <Textarea
              rows={2}
              placeholder="Описание модуля"
              value={mod.description || ""}
              onChange={(e) => updateModule(idx, "description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Функции (через запятую)
            </Label>
            <Input
              placeholder="Функция 1, Функция 2, Функция 3"
              value={getFeaturesValue(mod.features || [])}
              onChange={(e) => handleFeaturesChange(idx, e.target.value)}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addModule}>
        <Plus className="w-3 h-3 mr-1" />
        Добавить модуль
      </Button>
    </div>
  );
}
