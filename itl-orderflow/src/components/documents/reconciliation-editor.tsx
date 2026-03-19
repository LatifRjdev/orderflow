"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { createReconciliation } from "@/actions/reconciliations";

interface ReconciliationEditorProps {
  clients: { id: string; name: string }[];
}

export function ReconciliationEditor({ clients }: ReconciliationEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!clientId) {
      setError("Выберите клиента");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createReconciliation({
        clientId,
        periodFrom: formData.get("periodFrom") as string,
        periodTo: formData.get("periodTo") as string,
        currency: (formData.get("currency") as string) || "TJS",
        openingBalance: Number(formData.get("openingBalance")) || 0,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/documents/reconciliations/${result.id}`);
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
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
          <p className="text-sm text-muted-foreground">
            Операции будут автоматически загружены из счетов и оплат
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
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Параметры акта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Клиент *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodFrom">Период с *</Label>
                    <Input id="periodFrom" name="periodFrom" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodTo">Период по *</Label>
                    <Input id="periodTo" name="periodTo" type="date" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingBalance">Начальное сальдо</Label>
                    <Input
                      id="openingBalance"
                      name="openingBalance"
                      type="number"
                      step="0.01"
                      defaultValue="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Валюта</Label>
                    <Select defaultValue="TJS" name="currency">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TJS">TJS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                  После создания акт автоматически заполнится операциями из счетов (дебет) и оплат (кредит) клиента за указанный период.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Создание..." : "Создать акт сверки"}
                </Button>
                <Link href="/documents?tab=reconciliations" className="block">
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
