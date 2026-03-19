"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SignaturesContent } from "@/types/contract-sections";

interface ContractSectionSignaturesProps {
  content: SignaturesContent;
  onChange: (content: SignaturesContent) => void;
}

export function ContractSectionSignatures({ content, onChange }: ContractSectionSignaturesProps) {
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
          Использовать данные компании из настроек
        </Label>
      </div>

      {!content.autoFromSettings && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Реквизиты сторон</Label>
          <Textarea
            rows={6}
            placeholder="Введите реквизиты и подписи сторон..."
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
