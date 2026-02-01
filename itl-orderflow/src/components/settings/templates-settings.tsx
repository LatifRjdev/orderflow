"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card key={preset.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{preset.name}</CardTitle>
                  <Badge variant="secondary">{preset.sections.length} разделов</Badge>
                </div>
                <CardDescription>{preset.description}</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
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
            <Card key={style.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: style.accentColor }}
                  />
                  <CardTitle className="text-base">{style.name}</CardTitle>
                </div>
                <CardDescription>{style.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {style.features.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
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
            <Card key={tmpl.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{tmpl.name}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {tmpl.trigger}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1.5">{tmpl.description}</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                      Тема: {tmpl.subject}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
