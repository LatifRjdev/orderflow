"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Trash2 } from "lucide-react";
import { createInvoice } from "@/actions/invoices";

interface Order {
  id: string;
  title: string;
  number: string;
  clientId: string;
  client?: { id: string; name: string };
}

interface CreateInvoiceDialogProps {
  orders: Order[];
  children?: React.ReactNode;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export function CreateInvoiceDialog({
  orders,
  children,
}: CreateInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === "description") {
      item.description = value as string;
    } else if (field === "quantity") {
      item.quantity = Number(value) || 0;
      item.amount = item.quantity * item.unitPrice;
    } else if (field === "unitPrice") {
      item.unitPrice = Number(value) || 0;
      item.amount = item.quantity * item.unitPrice;
    }

    updated[index] = item;
    setItems(updated);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const issueDate = formData.get("issueDate") as string;
    const dueDate = formData.get("dueDate") as string;
    const notes = formData.get("notes") as string;

    if (!selectedOrderId || !selectedOrder) {
      setError("Выберите заказ");
      setIsLoading(false);
      return;
    }

    const validItems = items.filter((item) => item.description && item.amount > 0);
    if (validItems.length === 0) {
      setError("Добавьте хотя бы одну позицию");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createInvoice(
        {
          orderId: selectedOrderId,
          clientId: selectedOrder.clientId || selectedOrder.client?.id || "",
          issueDate,
          dueDate,
          currency: "TJS",
          notes: notes || undefined,
        },
        validItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.amount,
        }))
      );

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setItems([{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
        setSelectedOrderId("");
        router.refresh();
      }
    } catch (err) {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Создать счёт
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Новый счёт
          </DialogTitle>
          <DialogDescription>
            Создайте счёт на оплату для клиента.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Order & Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Заказ *</Label>
              <Select
                value={selectedOrderId}
                onValueChange={setSelectedOrderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите заказ" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOrder?.client && (
                <p className="text-xs text-muted-foreground">
                  Клиент: {selectedOrder.client.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Дата выставления *</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Оплатить до *</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={in30Days}
                required
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Позиции</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3 h-3 mr-1" />
                Добавить
              </Button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                <div className="col-span-5">Описание</div>
                <div className="col-span-2">Кол-во</div>
                <div className="col-span-2">Цена</div>
                <div className="col-span-2 text-right">Сумма</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Описание услуги"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium">
                    {item.amount.toLocaleString("ru-RU")} TJS
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t">
                <div className="col-span-9 text-right font-medium">Итого:</div>
                <div className="col-span-2 text-right text-lg font-bold">
                  {totalAmount.toLocaleString("ru-RU")} TJS
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Дополнительная информация для клиента..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать счёт"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
