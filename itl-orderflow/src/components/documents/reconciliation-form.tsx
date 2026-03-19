"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createReconciliation } from "@/actions/reconciliations";

interface ReconciliationFormProps {
  clients: { id: string; name: string }[];
}

export function ReconciliationForm({ clients }: ReconciliationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await createReconciliation({
      clientId: form.get("clientId") as string,
      periodFrom: form.get("periodFrom") as string,
      periodTo: form.get("periodTo") as string,
      currency: (form.get("currency") as string) || "TJS",
      openingBalance: Number(form.get("openingBalance")) || 0,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/documents/reconciliations/${result.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents?tab=reconciliations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новый акт сверки</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Операции будут автоматически загружены из счетов и оплат
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Клиент</Label>
                <select
                  id="clientId"
                  name="clientId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Выберите клиента</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodFrom">Период с</Label>
                  <Input id="periodFrom" name="periodFrom" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodTo">Период по</Label>
                  <Input id="periodTo" name="periodTo" type="date" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingBalance">Начальное сальдо</Label>
                  <Input id="openingBalance" name="openingBalance" type="number" step="0.01" defaultValue="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue="TJS"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="TJS">TJS</option>
                    <option value="USD">USD</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                После создания акт автоматически заполнится операциями из счетов (дебет) и оплат (кредит) клиента за указанный период.
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 sticky top-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Создать акт сверки
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
