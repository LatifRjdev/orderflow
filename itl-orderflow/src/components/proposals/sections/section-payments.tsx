"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { PaymentDraft } from "@/types/proposal-sections";

interface SectionPaymentsProps {
  payments: PaymentDraft[];
  onChange: (payments: PaymentDraft[]) => void;
  totalAmount: number;
}

export function SectionPayments({ payments, onChange, totalAmount }: SectionPaymentsProps) {
  const items = payments || [];

  const totalPercentage = items.reduce((sum, p) => sum + (p.percentage || 0), 0);

  function addPayment() {
    onChange([
      ...items,
      {
        stageName: "",
        percentage: 0,
        amount: 0,
        description: "",
        position: items.length,
      },
    ]);
  }

  function removePayment(index: number) {
    if (items.length <= 1) return;
    const updated = items
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, position: i }));
    onChange(updated);
  }

  function updatePayment(index: number, field: keyof PaymentDraft, value: string | number) {
    const updated = [...items];
    const payment = { ...updated[index] };

    if (field === "stageName") {
      payment.stageName = value as string;
    } else if (field === "description") {
      payment.description = value as string;
    } else if (field === "percentage") {
      payment.percentage = Number(value) || 0;
      payment.amount = Math.round((totalAmount * payment.percentage) / 100);
    }

    updated[index] = payment;
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {items.map((payment, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-12 gap-2">
              <div className="col-span-5 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Название этапа</Label>}
                <Input
                  placeholder="Название этапа оплаты"
                  value={payment.stageName || ""}
                  onChange={(e) => updatePayment(idx, "stageName", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">%</Label>}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={payment.percentage || ""}
                  onChange={(e) => updatePayment(idx, "percentage", e.target.value)}
                />
              </div>
              <div className="col-span-3 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Сумма (TJS)</Label>}
                <Input
                  disabled
                  value={Math.round((totalAmount * (payment.percentage || 0)) / 100).toLocaleString("ru-RU")}
                />
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Описание</Label>}
                <Input
                  placeholder="Описание"
                  value={payment.description || ""}
                  onChange={(e) => updatePayment(idx, "description", e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-10 w-10 shrink-0 ${idx === 0 ? "mt-5" : ""}`}
              onClick={() => removePayment(idx)}
              disabled={items.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addPayment}>
          <Plus className="w-3 h-3 mr-1" />
          Добавить этап оплаты
        </Button>

        <div className="text-sm">
          <span className="text-muted-foreground">Итого: </span>
          <span className={totalPercentage !== 100 ? "text-destructive font-medium" : "font-medium"}>
            {totalPercentage}%
          </span>
          {totalPercentage !== 100 && (
            <span className="text-destructive text-xs ml-2">
              (сумма процентов должна быть 100%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
