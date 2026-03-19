"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { AcceptanceCriteriaContent, AcceptanceCriterionItem } from "@/types/tech-spec-sections";

interface SpecSectionCriteriaProps {
  content: AcceptanceCriteriaContent;
  onChange: (content: AcceptanceCriteriaContent) => void;
}

export function SpecSectionCriteria({ content, onChange }: SpecSectionCriteriaProps) {
  const items = content.items || [];

  function addItem() {
    onChange({ items: [...items, { criterion: "", method: "" }] });
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== index) });
  }

  function updateItem(index: number, field: keyof AcceptanceCriterionItem, value: string) {
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
              {idx === 0 && <Label className="text-xs text-muted-foreground">Критерий</Label>}
              <Input
                placeholder="Критерий приёмки"
                value={item.criterion || ""}
                onChange={(e) => updateItem(idx, "criterion", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              {idx === 0 && <Label className="text-xs text-muted-foreground">Метод проверки</Label>}
              <Input
                placeholder="Как проверить"
                value={item.method || ""}
                onChange={(e) => updateItem(idx, "method", e.target.value)}
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
        Добавить критерий
      </Button>
    </div>
  );
}
