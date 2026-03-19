"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Mail, ArrowRight } from "lucide-react";
import { PROPOSAL_PRESETS } from "@/lib/templates/proposal-presets";
import { INVOICE_STYLES } from "@/lib/templates/invoice-styles";
import { EMAIL_TEMPLATES } from "@/lib/templates/email-templates";

export function TemplatesSettings() {
  return (
    <div className="space-y-8">
      {/* Proposal Presets */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold">Шаблоны коммерческих предложений</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Готовые наборы разделов для быстрого создания КП под разные типы проектов.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {PROPOSAL_PRESETS.map((preset) => (
            <div key={preset.id} className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">{preset.name}</h4>
                  <Badge variant="secondary">{preset.sections.length} разделов</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
              </div>
              <div className="px-6 pb-6">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {preset.sections.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {s.title}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/proposals/new">
                    Использовать
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invoice Styles */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold">Стили счетов</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Оформление счетов для отправки клиентам. Выберите стиль по умолчанию.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {INVOICE_STYLES.map((style) => (
            <div key={style.id} className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm">
              <div className="p-6 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: style.accentColor }}
                  />
                  <h4 className="text-base font-semibold">{style.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
              </div>
              <div className="px-6 pb-6">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {style.features.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Email Templates */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Шаблоны писем</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Автоматические email-уведомления, отправляемые клиентам при наступлении событий.
        </p>
        <div className="space-y-3">
          {EMAIL_TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{tmpl.name}</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {tmpl.trigger}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1.5">{tmpl.description}</p>
                  <code className="text-xs bg-background-light px-2 py-1 rounded block truncate">
                    Тема: {tmpl.subject}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
