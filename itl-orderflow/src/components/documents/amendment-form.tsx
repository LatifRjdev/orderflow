"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createAmendment } from "@/actions/amendments";

interface AmendmentFormProps {
  contracts: {
    id: string;
    number: string;
    title: string;
    client: { id: string; name: string };
  }[];
}

export function AmendmentForm({ contracts }: AmendmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await createAmendment({
      title: form.get("title") as string,
      contractId: form.get("contractId") as string,
      effectiveDate: form.get("effectiveDate") as string,
      description: form.get("description") as string,
      changes: form.get("changes") as string || null,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/documents/amendments/${result.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents?tab=amendments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новое доп. соглашение</h1>
          <p className="text-sm text-muted-foreground mt-1">Заполните данные дополнительного соглашения</p>
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
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" required placeholder="Изменение сроков проекта..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractId">Договор</Label>
                <select
                  id="contractId"
                  name="contractId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Выберите договор</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.number} — {c.title} ({c.client.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Дата вступления в силу</Label>
                <Input id="effectiveDate" name="effectiveDate" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание изменений</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Опишите суть изменений..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changes">Детали изменений (JSON, необязательно)</Label>
                <textarea
                  id="changes"
                  name="changes"
                  placeholder='{"пункт": "новое значение"}'
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 sticky top-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Создать доп. соглашение
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
