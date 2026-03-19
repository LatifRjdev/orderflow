"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { PaymentTermsContent, PaymentScheduleItem } from "@/types/contract-sections";

interface ContractSectionPaymentTermsProps {
  content: PaymentTermsContent;
  onChange: (content: PaymentTermsContent) => void;
}

export function ContractSectionPaymentTerms({ content, onChange }: ContractSectionPaymentTermsProps) {
  const schedule = content.schedule || [];

  function addScheduleItem() {
    onChange({
      ...content,
      schedule: [...schedule, { milestone: "", percentage: 0, amount: 0 }],
    });
  }

  function removeScheduleItem(index: number) {
    onChange({
      ...content,
      schedule: schedule.filter((_, i) => i !== index),
    });
  }

  function updateScheduleItem(index: number, field: keyof PaymentScheduleItem, value: string | number) {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...content, schedule: updated });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Условия оплаты</Label>
        <Textarea
          rows={4}
          placeholder="Опишите условия оплаты..."
          value={content.text || ""}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">График оплаты</Label>
        {schedule.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Этап</Label>}
                <Input
                  placeholder="Этап оплаты"
                  value={item.milestone || ""}
                  onChange={(e) => updateScheduleItem(idx, "milestone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Процент (%)</Label>}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={item.percentage || ""}
                  onChange={(e) => updateScheduleItem(idx, "percentage", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Сумма</Label>}
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={item.amount || ""}
                  onChange={(e) => updateScheduleItem(idx, "amount", Number(e.target.value))}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-10 w-10 shrink-0 ${idx === 0 ? "mt-5" : ""}`}
              onClick={() => removeScheduleItem(idx)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addScheduleItem}>
          <Plus className="w-3 h-3 mr-1" />
          Добавить этап оплаты
        </Button>
      </div>
    </div>
  );
}
