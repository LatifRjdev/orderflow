"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { createAmendment, updateAmendment } from "@/actions/amendments";
import { AMENDMENT_FIELD_OPTIONS, type AmendmentChange } from "@/types/amendment-changes";

interface AmendmentEditorProps {
  mode: "create" | "edit";
  contracts: {
    id: string;
    number: string;
    title: string;
    client: { id: string; name: string };
  }[];
  amendment?: {
    id?: string;
    title?: string;
    contractId?: string;
    effectiveDate?: string;
    description?: string;
    changes?: any;
  };
}

export function AmendmentEditor({ mode, contracts, amendment }: AmendmentEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState(amendment?.contractId || "");

  const [changes, setChanges] = useState<AmendmentChange[]>(() => {
    if (amendment?.changes && Array.isArray(amendment.changes)) {
      return amendment.changes as AmendmentChange[];
    }
    return [{ field: "", oldValue: "", newValue: "" }];
  });

  function addChange() {
    setChanges([...changes, { field: "", oldValue: "", newValue: "" }]);
  }

  function removeChange(index: number) {
    if (changes.length <= 1) return;
    setChanges(changes.filter((_, i) => i !== index));
  }

  function updateChange(index: number, key: keyof AmendmentChange, value: string) {
    const updated = [...changes];
    updated[index] = { ...updated[index], [key]: value };
    setChanges(updated);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const effectiveDate = formData.get("effectiveDate") as string;
    const description = formData.get("description") as string;

    if (!contractId) {
      setError("Выберите договор");
      setIsLoading(false);
      return;
    }

    const validChanges = changes.filter((c) => c.field && (c.oldValue || c.newValue));

    try {
      let result: any;
      if (mode === "edit" && amendment?.id) {
        result = await updateAmendment(amendment.id, {
          title,
          effectiveDate,
          description,
          changes: validChanges.length > 0 ? validChanges : null,
        });
      } else {
        result = await createAmendment({
          title,
          contractId,
          effectiveDate,
          description,
          changes: validChanges.length > 0 ? validChanges : null,
        });
      }

      if (result.error) {
        setError(result.error);
      } else {
        router.push(mode === "edit" ? `/documents/amendments/${amendment?.id}` : `/documents/amendments/${result.id}`);
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
        <Link href="/documents?tab=amendments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? "Редактирование доп. соглашения" : "Новое доп. соглашение"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Заполните данные дополнительного соглашения
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
                <CardTitle className="text-base">Основные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Изменение сроков проекта..."
                    defaultValue={amendment?.title || ""}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Договор *</Label>
                    <Select value={contractId} onValueChange={setContractId} disabled={mode === "edit"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите договор" />
                      </SelectTrigger>
                      <SelectContent>
                        {contracts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.number} — {c.title} ({c.client.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Дата вступления в силу *</Label>
                    <Input
                      id="effectiveDate"
                      name="effectiveDate"
                      type="date"
                      defaultValue={amendment?.effectiveDate || ""}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание изменений *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Опишите суть изменений..."
                    defaultValue={amendment?.description || ""}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Structured changes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Детали изменений</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addChange}>
                    <Plus className="w-3 h-3 mr-1" />
                    Добавить изменение
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {changes.map((change, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Изменение {idx + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeChange(idx)}
                          disabled={changes.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Что изменяется</Label>
                        <Select
                          value={change.field}
                          onValueChange={(v) => updateChange(idx, "field", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите поле" />
                          </SelectTrigger>
                          <SelectContent>
                            {AMENDMENT_FIELD_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Было</Label>
                          <Input
                            placeholder="Старое значение"
                            value={change.oldValue}
                            onChange={(e) => updateChange(idx, "oldValue", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Стало</Label>
                          <Input
                            placeholder="Новое значение"
                            value={change.newValue}
                            onChange={(e) => updateChange(idx, "newValue", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Сводка</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {changes.filter((c) => c.field).length} изменений
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Сохранение..." : mode === "edit" ? "Сохранить" : "Создать доп. соглашение"}
                </Button>
                <Link href="/documents?tab=amendments" className="block">
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
