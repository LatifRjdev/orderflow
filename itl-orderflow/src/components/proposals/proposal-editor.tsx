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
  GripVertical,
  FileText,
} from "lucide-react";
import { createProposal, updateProposal } from "@/actions/proposals";
import { SectionEditor } from "@/components/proposals/sections/section-editor";
import type { ProposalSectionType } from "@prisma/client";
import {
  SECTION_TYPE_LABELS,
  getDefaultContent,
  DEFAULT_PROPOSAL_SECTIONS,
  type SectionDraft,
  type PaymentDraft,
} from "@/types/proposal-sections";

interface ProposalItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface ProposalEditorProps {
  mode: "create" | "edit";
  clients: { id: string; name: string }[];
  orders: { id: string; title: string; number: string; clientId: string }[];
  proposal?: {
    id?: string;
    title?: string;
    clientId?: string;
    orderId?: string;
    validUntil?: string;
    introduction?: string;
    scope?: string;
    items?: ProposalItem[];
    sections?: {
      type: ProposalSectionType;
      title: string;
      content: any;
      position: number;
      isVisible: boolean;
    }[];
    payments?: {
      stageName: string;
      percentage: number;
      amount: number;
      description?: string;
      position: number;
    }[];
  };
}

const ALL_SECTION_TYPES: ProposalSectionType[] = [
  "ABOUT_SOLUTION",
  "TECH_STACK",
  "KEY_ADVANTAGES",
  "FUNCTIONAL_MODULES",
  "ARCHITECTURE",
  "IMPLEMENTATION_STAGES",
  "PAYMENT_SCHEDULE",
  "ADDITIONAL_TERMS",
  "CONTACT_INFO",
  "CUSTOM",
];

export function ProposalEditor({ mode, clients, orders, proposal }: ProposalEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(proposal?.clientId || "");
  const [orderId, setOrderId] = useState(proposal?.orderId || "");
  const [items, setItems] = useState<ProposalItem[]>(
    proposal?.items?.length
      ? proposal.items
      : [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  );

  // Sections state
  const [sections, setSections] = useState<SectionDraft[]>(() => {
    if (proposal?.sections?.length) {
      return proposal.sections.map((s) => ({
        type: s.type,
        title: s.title,
        content: s.content,
        position: s.position,
        isVisible: s.isVisible,
      }));
    }
    if (mode === "create") {
      return [...DEFAULT_PROPOSAL_SECTIONS];
    }
    return [];
  });

  // Payments state
  const [payments, setPayments] = useState<PaymentDraft[]>(() => {
    if (proposal?.payments?.length) {
      return proposal.payments.map((p) => ({
        stageName: p.stageName,
        percentage: p.percentage,
        amount: p.amount,
        description: p.description,
        position: p.position,
      }));
    }
    return [];
  });

  // Collapsed sections tracking
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  const filteredOrders = clientId
    ? orders.filter((o) => o.clientId === clientId)
    : orders;

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  // ========== Items management ==========

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ProposalItem, value: string | number) {
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

  // ========== Sections management ==========

  function addSection(type: ProposalSectionType) {
    const newSection: SectionDraft = {
      type,
      title: SECTION_TYPE_LABELS[type],
      content: getDefaultContent(type),
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
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCollapsedSections(next);
  }

  // ========== Submit ==========

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const validUntil = formData.get("validUntil") as string;

    if (!clientId) {
      setError("Выберите клиента");
      setIsLoading(false);
      return;
    }

    if (!title) {
      setError("Укажите название");
      setIsLoading(false);
      return;
    }

    const validItems = items.filter((item) => item.description && item.amount > 0);
    if (validItems.length === 0) {
      setError("Добавьте хотя бы одну позицию");
      setIsLoading(false);
      return;
    }

    const sectionsData = sections.map((s, i) => ({
      type: s.type,
      title: s.title,
      content: s.content,
      position: i,
      isVisible: s.isVisible,
    }));

    const paymentsData = payments
      .filter((p) => p.stageName)
      .map((p, i) => ({
        stageName: p.stageName,
        percentage: p.percentage,
        amount: Math.round((totalAmount * p.percentage) / 100 * 100) / 100,
        description: p.description,
        position: i,
      }));

    try {
      const itemsPayload = validItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.amount,
      }));

      let result;
      if (mode === "edit" && proposal?.id) {
        result = await updateProposal(
          proposal.id,
          {
            title,
            validUntil: validUntil || undefined,
          },
          itemsPayload,
          sectionsData,
          paymentsData
        );
      } else {
        result = await createProposal(
          {
            title,
            clientId,
            orderId: orderId || undefined,
            validUntil: validUntil || undefined,
          },
          itemsPayload,
          sectionsData,
          paymentsData
        );
      }

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/proposals");
      }
    } catch {
      setError("Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  }

  // Which section types are already added (excluding CUSTOM which can be repeated)
  const usedTypes = new Set(sections.filter((s) => s.type !== "CUSTOM").map((s) => s.type));
  const availableTypes = ALL_SECTION_TYPES.filter(
    (t) => t === "CUSTOM" || !usedTypes.has(t)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/proposals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "edit" ? "Редактирование КП" : "Новое коммерческое предложение"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Заполните данные для создания КП
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
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Основные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название КП *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Например: Разработка мобильного приложения"
                    defaultValue={proposal?.title || ""}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Клиент *</Label>
                    <Select value={clientId} onValueChange={(v) => { setClientId(v); setOrderId(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Проект (опционально)</Label>
                    <Select value={orderId} onValueChange={setOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Привязать к проекту" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredOrders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.number} — {o.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Действительно до</Label>
                    <Input
                      id="validUntil"
                      name="validUntil"
                      type="date"
                      defaultValue={proposal?.validUntil || in30Days}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Разделы КП
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
                            {SECTION_TYPE_LABELS[type]}
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
                    Нажмите «Добавить раздел» чтобы добавить содержание в КП
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section, idx) => {
                      const isCollapsed = collapsedSections.has(idx);
                      return (
                        <div
                          key={`${section.type}-${idx}`}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* Section header */}
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
                              {SECTION_TYPE_LABELS[section.type]}
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

                          {/* Section editor */}
                          {!isCollapsed && (
                            <div className="p-3">
                              <SectionEditor
                                section={section}
                                onChange={(content) => updateSectionContent(idx, content)}
                                payments={payments}
                                onPaymentsChange={setPayments}
                                totalAmount={totalAmount}
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

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Стоимость (позиции)</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-3 h-3 mr-1" />
                    Добавить позицию
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Итого</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between font-bold text-lg">
                  <span>К оплате:</span>
                  <span>{totalAmount.toLocaleString("ru-RU")} TJS</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {items.filter((i) => i.description && i.amount > 0).length} позиций
                  {sections.length > 0 && ` • ${sections.length} разделов`}
                  {payments.length > 0 && ` • ${payments.length} этапов оплаты`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Сохранение..." : "Сохранить КП"}
                </Button>
                <Link href="/proposals" className="block">
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
