"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { createTechSpec } from "@/actions/tech-specs";
import { TechSpecSectionType } from "@prisma/client";

interface TechSpecFormProps {
  clients: { id: string; name: string }[];
  orders: { id: string; title: string; number: string; clientId: string }[];
}

const sectionTypes = [
  { value: "INTRODUCTION", label: "Введение" },
  { value: "GOALS", label: "Цели" },
  { value: "FUNCTIONAL_REQUIREMENTS", label: "Функциональные требования" },
  { value: "NON_FUNCTIONAL_REQUIREMENTS", label: "Нефункциональные требования" },
  { value: "TECH_STACK", label: "Технологии" },
  { value: "TIMELINE", label: "Сроки" },
  { value: "ACCEPTANCE_CRITERIA", label: "Критерии приёмки" },
  { value: "CUSTOM", label: "Другое" },
];

export function TechSpecForm({ clients, orders }: TechSpecFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [sections, setSections] = useState<{ type: TechSpecSectionType; title: string; content: string; position: number }[]>([]);

  const filteredOrders = orders.filter((o) => o.clientId === clientId);

  function addSection(type: string = "CUSTOM") {
    const typeInfo = sectionTypes.find((t) => t.value === type);
    setSections([
      ...sections,
      { type: type as TechSpecSectionType, title: typeInfo?.label || "", content: "", position: sections.length },
    ]);
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
    const result = await createTechSpec(
      {
        title: form.get("title") as string,
        clientId: form.get("clientId") as string,
        orderId: (form.get("orderId") as string) || null,
        version: (form.get("version") as string) || "1.0",
      },
      sections.map((s, i) => ({ ...s, position: i }))
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/documents/specs/${result.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents?tab=specs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новое ТЗ</h1>
          <p className="text-sm text-muted-foreground mt-1">Заполните техническое задание</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" required placeholder="Техническое задание на..." />
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

              <div className="space-y-2">
                <Label htmlFor="version">Версия</Label>
                <Input id="version" name="version" defaultValue="1.0" />
              </div>
            </div>

            {/* Sections */}
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Разделы ТЗ</h3>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSection(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="text-sm border border-input rounded-md px-2 py-1"
                  >
                    <option value="">Добавить раздел...</option>
                    {sectionTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Выберите тип раздела из списка для добавления.
                </p>
              )}

              <div className="space-y-4">
                {sections.map((s, idx) => (
                  <div key={idx} className="p-4 border border-[#dbdfe6] rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {sectionTypes.find((t) => t.value === s.type)?.label || s.type}
                      </span>
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

          <div>
            <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-6 sticky top-6">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Создать ТЗ
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
