"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContactInfoContent } from "@/types/proposal-sections";

interface SectionContactsProps {
  content: ContactInfoContent;
  onChange: (content: ContactInfoContent) => void;
}

export function SectionContacts({ content, onChange }: SectionContactsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoFromSettings"
          checked={content.autoFromSettings}
          onCheckedChange={(checked) =>
            onChange({
              ...content,
              autoFromSettings: checked === true,
            })
          }
        />
        <Label htmlFor="autoFromSettings" className="text-sm cursor-pointer">
          Использовать данные компании
        </Label>
      </div>

      {!content.autoFromSettings && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Контактная информация</Label>
          <Textarea
            rows={4}
            placeholder="Введите контактную информацию..."
            value={content.customText || ""}
            onChange={(e) =>
              onChange({
                ...content,
                customText: e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
