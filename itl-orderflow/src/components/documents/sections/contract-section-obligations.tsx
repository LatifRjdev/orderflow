"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { ObligationsContent, ObligationItem } from "@/types/contract-sections";

interface ContractSectionObligationsProps {
  content: ObligationsContent;
  onChange: (content: ObligationsContent) => void;
}

export function ContractSectionObligations({ content, onChange }: ContractSectionObligationsProps) {
  const items = content.items || [];

  function addItem() {
    onChange({ items: [...items, { title: "", description: "" }] });
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== index) });
  }

  function updateItem(index: number, field: keyof ObligationItem, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ items: updated });
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Обязанность {idx + 1}</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeItem(idx)}
              disabled={items.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Название</Label>
            <Input
              placeholder="Краткое название обязанности"
              value={item.title || ""}
              onChange={(e) => updateItem(idx, "title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Описание</Label>
            <Textarea
              rows={2}
              placeholder="Подробное описание..."
              value={item.description || ""}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-3 h-3 mr-1" />
        Добавить обязанность
      </Button>
    </div>
  );
}
