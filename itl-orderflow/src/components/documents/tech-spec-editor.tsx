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
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
} from "lucide-react";
import { createTechSpec, updateTechSpec } from "@/actions/tech-specs";
import { SpecSectionEditor } from "@/components/documents/sections/spec-section-editor";
import type { TechSpecSectionType } from "@prisma/client";
import {
  SPEC_SECTION_TYPE_LABELS,
  getDefaultSpecContent,
  DEFAULT_SPEC_SECTIONS,
  type SpecSectionDraft,
} from "@/types/tech-spec-sections";

interface TechSpecEditorProps {
  mode: "create" | "edit";
  clients: { id: string; name: string }[];
  orders: { id: string; title: string; number: string; clientId: string }[];
  techSpec?: {
    id?: string;
    title?: string;
    clientId?: string;
    orderId?: string;
    version?: string;
    sections?: {
      type: TechSpecSectionType;
      title: string;
      content: any;
      position: number;
    }[];
  };
}

const ALL_SECTION_TYPES: TechSpecSectionType[] = [
  "INTRODUCTION",
  "GOALS",
  "FUNCTIONAL_REQUIREMENTS",
  "NON_FUNCTIONAL_REQUIREMENTS",
  "TECH_STACK",
  "TIMELINE",
  "ACCEPTANCE_CRITERIA",
  "CUSTOM",
];

export function TechSpecEditor({ mode, clients, orders, techSpec }: TechSpecEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(techSpec?.clientId || "");
  const [orderId, setOrderId] = useState(techSpec?.orderId || "");

  const [sections, setSections] = useState<SpecSectionDraft[]>(() => {
    if (techSpec?.sections?.length) {
      return techSpec.sections.map((s) => ({
        type: s.type,
        title: s.title,
        content: s.content,
        position: s.position,
        isVisible: true,
      }));
    }
    if (mode === "create") {
      return [...DEFAULT_SPEC_SECTIONS];
    }
    return [];
  });

  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  const filteredOrders = clientId ? orders.filter((o) => o.clientId === clientId) : orders;

  // ========== Sections management ==========

  function addSection(type: TechSpecSectionType) {
    const newSection: SpecSectionDraft = {
      type,
      title: SPEC_SECTION_TYPE_LABELS[type],
      content: getDefaultSpecContent(type),
      position: sections.length,
      isVisible: true,
    };
    setSections([...sections, newSection]);
    setShowSectionMenu(false);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSectionContent(index: number, content: any) {
    const updated = [...sections];
    updated[index] = { ...updated[index], content };
    setSections(updated);
  }

  function updateSectionTitle(index: number, title: string) {
    const updated = [...sections];
    updated[index] = { ...updated[index], title };
    setSections(updated);
  }

  function moveSectionUp(index: number) {
    if (index === 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setSections(updated);
  }

  function moveSectionDown(index: number) {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setSections(updated);
  }

  function toggleCollapsed(index: number) {
    const next = new Set(collapsedSections);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setCollapsedSections(next);
  }

  // ========== Submit ==========

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    if (!clientId) {
      setError("Выберите клиента");
      setIsLoading(false);
      return;
    }

    const sectionsData = sections.map((s, i) => ({
      type: s.type,
      title: s.title,
      content: s.content,
      position: i,
    }));

    try {
      let result: any;
      if (mode === "edit" && techSpec?.id) {
        result = await updateTechSpec(
          techSpec.id,
          {
            title,
            clientId,
            orderId: orderId || null,
            version: (formData.get("version") as string) || "1.0",
          },
          sectionsData
        );
      } else {
        result = await createTechSpec(
          {
            title,
            clientId,
            orderId: orderId || null,
            version: (formData.get("version") as string) || "1.0",
          },
          sectionsData
        );
      }

      if (result.error) {
        setError(result.error);
      } else {
        router.push(mode === "edit" ? `/documents/specs/${techSpec?.id}` : `/documents/specs/${result.id}`);
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  const usedTypes = new Set(sections.filter((s) => s.type !== "CUSTOM").map((s) => s.type));
  const availableTypes = ALL_SECTION_TYPES.filter((t) => t === "CUSTOM" || !usedTypes.has(t));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documents?tab=specs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? "Редактирование ТЗ" : "Новое ТЗ"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Заполните техническое задание
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
                    placeholder="Техническое задание на..."
                    defaultValue={techSpec?.title || ""}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Клиент *</Label>
                    <Select value={clientId} onValueChange={(v) => { setClientId(v); setOrderId(""); }}>
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
                  <div className="space-y-2">
                    <Label>Проект (необязательно)</Label>
                    <Select value={orderId} onValueChange={setOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Привязать к проекту" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredOrders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.number} — {o.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Версия</Label>
                  <Input
                    id="version"
                    name="version"
                    defaultValue={techSpec?.version || "1.0"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Разделы ТЗ
                  </CardTitle>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSectionMenu(!showSectionMenu)}
                      disabled={availableTypes.length === 0}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить раздел
                    </Button>
                    {showSectionMenu && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-popover border rounded-lg shadow-lg z-50 py-1">
                        {availableTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                            onClick={() => addSection(type)}
                          >
                            {SPEC_SECTION_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Нажмите «Добавить раздел» чтобы добавить содержание
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section, idx) => {
                      const isCollapsed = collapsedSections.has(idx);
                      return (
                        <div key={`${section.type}-${idx}`} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                            <button
                              type="button"
                              onClick={() => toggleCollapsed(idx)}
                              className="p-0.5 hover:bg-accent rounded"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <Input
                              value={section.title}
                              onChange={(e) => updateSectionTitle(idx, e.target.value)}
                              className="h-7 text-sm font-medium bg-transparent border-none shadow-none px-1 focus-visible:ring-1"
                            />

                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                              {SPEC_SECTION_TYPE_LABELS[section.type]}
                            </span>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveSectionUp(idx)}
                                disabled={idx === 0}
                                className="p-1 hover:bg-accent rounded disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSectionDown(idx)}
                                disabled={idx === sections.length - 1}
                                className="p-1 hover:bg-accent rounded disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSection(idx)}
                                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className="p-3">
                              <SpecSectionEditor
                                section={section}
                                onChange={(content) => updateSectionContent(idx, content)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  {sections.length} разделов
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Сохранение..." : mode === "edit" ? "Сохранить изменения" : "Создать ТЗ"}
                </Button>
                <Link href="/documents?tab=specs" className="block">
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
