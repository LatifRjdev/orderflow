"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type {
  TechStackContent,
  TechStackItem,
  KeyAdvantagesContent,
  KeyAdvantageItem,
} from "@/types/proposal-sections";

interface SectionListTechStackProps {
  variant: "tech-stack";
  content: TechStackContent;
  onChange: (content: TechStackContent) => void;
}

interface SectionListAdvantagesProps {
  variant: "advantages";
  content: KeyAdvantagesContent;
  onChange: (content: KeyAdvantagesContent) => void;
}

type SectionListProps = SectionListTechStackProps | SectionListAdvantagesProps;

export function SectionList(props: SectionListProps) {
  if (props.variant === "tech-stack") {
    const { content, onChange } = props;
    const items = content.items || [];

    const addItem = () => {
      onChange({ items: [...items, { name: "", description: "" }] });
    };

    const removeItem = (index: number) => {
      if (items.length <= 1) return;
      onChange({ items: items.filter((_, i) => i !== index) });
    };

    const updateItem = (index: number, field: keyof TechStackItem, value: string) => {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };
      onChange({ items: updated });
    };

    return (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Название</Label>}
                <Input
                  placeholder="Название технологии"
                  value={item.name || ""}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Описание</Label>}
                <Input
                  placeholder="Описание"
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
          Добавить
        </Button>
      </div>
    );
  }

  // variant === "advantages"
  const { content: advContent, onChange } = props;
  const items = (advContent as KeyAdvantagesContent).items || [];

  function addItem() {
    onChange({ items: [...items, { title: "", description: "" }] });
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== index) });
  }

  function updateItem(index: number, field: keyof KeyAdvantageItem, value: string) {
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
              {idx === 0 && <Label className="text-xs text-muted-foreground">Заголовок</Label>}
              <Input
                placeholder="Заголовок преимущества"
                value={item.title || ""}
                onChange={(e) => updateItem(idx, "title", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              {idx === 0 && <Label className="text-xs text-muted-foreground">Описание</Label>}
              <Input
                placeholder="Описание"
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
        Добавить
      </Button>
    </div>
  );
}
