"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Trash2, Plus } from "lucide-react";
import { generateActPdf } from "@/actions/pdf";

interface ActItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface GenerateActDialogProps {
  orderId: string;
  orderNumber: string;
  currency: string;
  tasks?: { title: string }[];
  milestones?: { title: string; amount?: number }[];
}

export function GenerateActDialog({
  orderId,
  orderNumber,
  currency,
  tasks = [],
  milestones = [],
}: GenerateActDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actNumber, setActNumber] = useState(`ACT-${orderNumber}`);
  const [actDate, setActDate] = useState(new Date().toISOString().split("T")[0]);

  // Initialize items from milestones or tasks
  const initialItems: ActItem[] =
    milestones.length > 0
      ? milestones.map((m) => ({
          description: m.title,
          quantity: 1,
          unitPrice: Number(m.amount || 0),
          amount: Number(m.amount || 0),
        }))
      : tasks.length > 0
      ? tasks.map((t) => ({
          description: t.title,
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }];

  const [items, setItems] = useState<ActItem[]>(initialItems);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  function updateItem(index: number, field: keyof ActItem, value: string | number) {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "description") {
        item.description = value as string;
      } else {
        const numVal = Number(value) || 0;
        if (field === "quantity") {
          item.quantity = numVal;
          item.amount = numVal * item.unitPrice;
        } else if (field === "unitPrice") {
          item.unitPrice = numVal;
          item.amount = item.quantity * numVal;
        } else if (field === "amount") {
          item.amount = numVal;
        }
      }

      updated[index] = item;
      return updated;
    });
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (items.length === 0 || !actNumber.trim()) return;

    setLoading(true);
    try {
      const result = await generateActPdf(orderId, {
        actNumber: actNumber.trim(),
        actDate,
        items,
        totalAmount,
        currency,
      });

      if (result.url) {
        window.open(result.url, "_blank");
        setOpen(false);
      }
    } catch (error) {
      console.error("Act generation error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Сформировать Акт
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Акт сдачи-приёмки работ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Номер акта
              </label>
              <Input
                value={actNumber}
                onChange={(e) => setActNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Дата
              </label>
              <Input
                type="date"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Выполненные работы</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center"
                >
                  <Input
                    placeholder="Описание работ"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(idx, "description", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Кол-во"
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateItem(idx, "quantity", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      updateItem(idx, "unitPrice", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Сумма"
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateItem(idx, "amount", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Итого:</span>
            <span className="text-lg font-bold">
              {totalAmount.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
              })}{" "}
              {currency}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Сформировать PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
