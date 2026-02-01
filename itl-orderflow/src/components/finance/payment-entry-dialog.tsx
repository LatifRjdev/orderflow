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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2 } from "lucide-react";
import { recordPayment } from "@/actions/invoices";

interface PaymentEntryDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  expectedAmount: number;
  currency?: string;
  children?: React.ReactNode;
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Банковский перевод (Р/С)" },
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта" },
  { value: "other", label: "Другое" },
] as const;

export function PaymentEntryDialog({
  invoiceId,
  invoiceNumber,
  expectedAmount,
  currency = "TJS",
  children,
}: PaymentEntryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  function formatCurrency(amount: number): string {
    return amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const reference = (formData.get("reference") as string)?.trim() || undefined;
    const date = formData.get("date") as string;
    const notes = (formData.get("notes") as string)?.trim() || undefined;

    if (!amount || amount <= 0) {
      setError("Укажите корректную сумму платежа");
      setIsLoading(false);
      return;
    }

    if (!paymentMethod) {
      setError("Выберите способ оплаты");
      setIsLoading(false);
      return;
    }

    if (!date) {
      setError("Укажите дату оплаты");
      setIsLoading(false);
      return;
    }

    try {
      const result = await recordPayment(invoiceId, {
        amount,
        paymentMethod,
        reference,
        date,
      });

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setPaymentMethod("");
        setError(null);
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка при записи платежа");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <CreditCard className="w-4 h-4 mr-2" />
            Записать оплату
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Запись платежа
          </DialogTitle>
          <DialogDescription>
            Зафиксируйте поступление оплаты по счёту.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice summary */}
        <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Счёт</span>
            <span className="font-medium">{invoiceNumber}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ожидаемая сумма</span>
            <span className="font-semibold text-base">
              {formatCurrency(expectedAmount)} {currency}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Сумма платежа *</Label>
            <div className="relative">
              <Input
                id="payment-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={expectedAmount}
                required
                placeholder="0.00"
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                {currency}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Способ оплаты *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите способ оплаты" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Reference */}
          <div className="space-y-2">
            <Label htmlFor="payment-reference">Номер транзакции</Label>
            <Input
              id="payment-reference"
              name="reference"
              type="text"
              placeholder="напр. TXN-992031"
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="payment-date">Дата оплаты *</Label>
            <Input
              id="payment-date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="payment-notes">Заметки</Label>
            <Textarea
              id="payment-notes"
              name="notes"
              placeholder="Дополнительная информация о платеже..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Записать платёж"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
