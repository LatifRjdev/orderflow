"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { createContract } from "@/actions/contracts";
import { ContractSectionType } from "@prisma/client";

interface ContractFormProps {
  clients: { id: string; name: string }[];
  orders: { id: string; title: string; number: string; clientId: string }[];
}

export function ContractForm({ clients, orders }: ContractFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [sections, setSections] = useState<{ type: ContractSectionType; title: string; content: string; position: number }[]>([]);

  const filteredOrders = orders.filter((o) => o.clientId === clientId);

  function addSection() {
    setSections([...sections, { type: "CUSTOM" as ContractSectionType, title: "", content: "", position: sections.length }]);
  }

  function removeSection(idx: number) {
    setSections(sections.filter((_, i) => i !== idx));
  }

  function updateSection(idx: number, field: string, value: string) {
    setSections(sections.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await createContract(
      {
        title: form.get("title") as string,
        clientId: form.get("clientId") as string,
        orderId: (form.get("orderId") as string) || null,
        contractDate: form.get("contractDate") as string,
        startDate: (form.get("startDate") as string) || null,
        endDate: (form.get("endDate") as string) || null,
        totalAmount: Number(form.get("totalAmount")) || 0,
        currency: (form.get("currency") as string) || "TJS",
      },
      sections.map((s, i) => ({ ...s, position: i }))
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/documents/contracts/${result.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents?tab=contracts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новый договор</h1>
          <p className="text-sm text-muted-foreground mt-1">Заполните данные договора</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" required placeholder="Договор на разработку..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Клиент</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Выберите клиента</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderId">Проект (необязательно)</Label>
                  <select
                    id="orderId"
                    name="orderId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Не привязан</option>
                    {filteredOrders.map((o) => (
                      <option key={o.id} value={o.id}>{o.number} — {o.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractDate">Дата договора</Label>
                  <Input id="contractDate" name="contractDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Начало</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Окончание</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Сумма</Label>
                  <Input id="totalAmount" name="totalAmount" type="number" step="0.01" defaultValue="0" />
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
            </div>

            {/* Sections */}
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Разделы договора</h3>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  <Plus className="w-4 h-4 mr-1" /> Добавить раздел
                </Button>
              </div>

              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Разделы не добавлены. Нажмите &quot;Добавить раздел&quot; для начала.
                </p>
              )}

              <div className="space-y-4">
                {sections.map((s, idx) => (
                  <div key={idx} className="p-4 border border-[#dbdfe6] rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Раздел {idx + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Название раздела"
                      value={s.title}
                      onChange={(e) => updateSection(idx, "title", e.target.value)}
                    />
                    <textarea
                      placeholder="Содержание раздела..."
                      value={s.content as string}
                      onChange={(e) => updateSection(idx, "content", e.target.value)}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 sticky top-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Создать договор
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
