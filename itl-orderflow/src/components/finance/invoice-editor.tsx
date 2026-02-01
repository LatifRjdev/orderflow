"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { createInvoice, updateInvoice } from "@/actions/invoices";

interface Order {
  id: string;
  title: string;
  number: string;
  clientId: string;
  client?: { id: string; name: string };
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceData {
  id?: string;
  number?: string;
  orderId?: string;
  clientId?: string;
  clientName?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  notes?: string;
  discountPercent?: number;
  taxPercent?: number;
  items?: InvoiceItem[];
}

interface InvoiceEditorProps {
  orders: Order[];
  invoice?: InvoiceData;
  mode: "create" | "edit";
}

export function InvoiceEditor({ orders, invoice, mode }: InvoiceEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState(invoice?.orderId || "");
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length
      ? invoice.items
      : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  );
  const [discountPercent, setDiscountPercent] = useState(invoice?.discountPercent || 0);
  const [taxPercent, setTaxPercent] = useState(invoice?.taxPercent || 0);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const totalAmount = afterDiscount + taxAmount;

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

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

    const validItems = items.filter((item) => item.description && item.amount > 0);
    if (validItems.length === 0) {
      setError("Добавьте хотя бы одну позицию");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "edit" && invoice?.id) {
        const result = await updateInvoice(
          invoice.id,
          { issueDate, dueDate, notes, discountPercent, taxPercent },
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
          router.push(`/finance/${invoice.id}`);
        }
      } else {
        if (!selectedOrderId || !selectedOrder) {
          setError("Выберите заказ");
          setIsLoading(false);
          return;
        }
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
          router.push("/finance");
        }
      }
    } catch (err) {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={mode === "edit" && invoice?.id ? `/finance/${invoice.id}` : "/finance"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? `Редактирование ${invoice?.number}` : "Новый счёт"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "edit"
              ? "Измените данные счёта"
              : "Заполните данные для создания нового счёта"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order & Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Основные данные</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Заказ *</Label>
                    {mode === "edit" ? (
                      <Input
                        disabled
                        value={
                          invoice?.clientName
                            ? `${selectedOrder?.number || ""} — ${invoice.clientName}`
                            : selectedOrder?.number || ""
                        }
                      />
                    ) : (
                      <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите заказ" />
                        </SelectTrigger>
                        <SelectContent>
                          {orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.number} — {order.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                      defaultValue={invoice?.issueDate || today}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Оплатить до *</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      defaultValue={invoice?.dueDate || in30Days}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Позиции</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Добавить позицию
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                    <div className="col-span-5">Описание</div>
                    <div className="col-span-2">Кол-во</div>
                    <div className="col-span-2">Цена (TJS)</div>
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
                </div>

                {/* Discount & Tax */}
                <div className="mt-6 pt-4 border-t space-y-3">
                  <div className="flex items-center gap-4 justify-end">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">
                      Скидка (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-24"
                      value={discountPercent || ""}
                      onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-4 justify-end">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">
                      НДС (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-24"
                      value={taxPercent || ""}
                      onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Примечания</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="notes"
                  placeholder="Дополнительная информация для клиента..."
                  rows={3}
                  defaultValue={invoice?.notes || ""}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-6">
            {/* Totals Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Итого</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Подытог:</span>
                  <span>{subtotal.toLocaleString("ru-RU")} TJS</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Скидка ({discountPercent}%):</span>
                    <span>-{discountAmount.toLocaleString("ru-RU")} TJS</span>
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">НДС ({taxPercent}%):</span>
                    <span>+{taxAmount.toLocaleString("ru-RU")} TJS</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>К оплате:</span>
                  <span>{totalAmount.toLocaleString("ru-RU")} TJS</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading
                    ? "Сохранение..."
                    : mode === "edit"
                    ? "Сохранить изменения"
                    : "Сохранить черновик"}
                </Button>
                <Link
                  href={mode === "edit" && invoice?.id ? `/finance/${invoice.id}` : "/finance"}
                  className="block"
                >
                  <Button type="button" variant="outline" className="w-full">
                    Отмена
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
