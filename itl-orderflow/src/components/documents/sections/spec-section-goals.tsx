"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { GoalsContent, GoalItem } from "@/types/tech-spec-sections";

interface SpecSectionGoalsProps {
  content: GoalsContent;
  onChange: (content: GoalsContent) => void;
}

const PRIORITY_OPTIONS = ["Высокий", "Средний", "Низкий"];

export function SpecSectionGoals({ content, onChange }: SpecSectionGoalsProps) {
  const items = content.items || [];

  function addItem() {
    onChange({ items: [...items, { goal: "", priority: "Высокий" }] });
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== index) });
  }

  function updateItem(index: number, field: keyof GoalItem, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              {idx === 0 && <Label className="text-xs text-muted-foreground">Цель</Label>}
              <Input
                placeholder="Описание цели"
                value={item.goal || ""}
                onChange={(e) => updateItem(idx, "goal", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              {idx === 0 && <Label className="text-xs text-muted-foreground">Приоритет</Label>}
              <select
                value={item.priority || "Высокий"}
                onChange={(e) => updateItem(idx, "priority", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
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
        Добавить цель
      </Button>
    </div>
  );
}
