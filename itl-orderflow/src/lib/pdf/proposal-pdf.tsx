import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  companyName: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  muted: { color: "#6b7280", fontSize: 9 },
  bold: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mb20: { marginBottom: 20 },
  sectionBlock: { marginBottom: 16 },
  sectionHeading: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  // Table
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colNum: { width: "5%" },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "right" },
  colPrice: { width: "19%", textAlign: "right" },
  colAmount: { width: "19%", textAlign: "right" },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalsBlock: { alignItems: "flex-end", marginTop: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    paddingVertical: 3,
  },
  totalLine: {
    borderTopWidth: 2,
    borderTopColor: "#1a1a1a",
    marginTop: 6,
    paddingTop: 6,
  },
  grandTotal: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  // Payment schedule
  scheduleRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  schedColName: { width: "55%" },
  schedColPct: { width: "15%", textAlign: "right" },
  schedColAmt: { width: "30%", textAlign: "right" },
});

function fmtCurrency(amount: number, currency = "TJS"): string {
  return `${amount.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface ProposalPdfProps {
  proposal: any;
  settings: any;
}

function SectionContent({ section }: { section: any }) {
  const content = section.content as any;
  if (!section.isVisible) return null;

  switch (section.type) {
    case "ABOUT_SOLUTION":
    case "ARCHITECTURE":
    case "ADDITIONAL_TERMS":
    case "CUSTOM":
      if (!content?.text) return null;
      return (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          <Text>{content.text}</Text>
        </View>
      );

    case "TECH_STACK":
      if (!content?.items?.length) return null;
      return (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          {content.items.map((item: any, i: number) => (
            <Text key={i}>
              <Text style={styles.bold}>{item.name}</Text>
              {item.description ? ` — ${item.description}` : ""}
            </Text>
          ))}
        </View>
      );

    case "KEY_ADVANTAGES":
      if (!content?.items?.length) return null;
      return (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          {content.items.map((item: any, i: number) => (
            <Text key={i}>
              • <Text style={styles.bold}>{item.title}</Text>
              {item.description ? ` — ${item.description}` : ""}
            </Text>
          ))}
        </View>
      );

    case "FUNCTIONAL_MODULES":
      if (!content?.modules?.length) return null;
      return (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          {content.modules.map((mod: any, i: number) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={styles.bold}>{mod.name}</Text>
              {mod.description && <Text style={styles.muted}>{mod.description}</Text>}
              {mod.features?.length > 0 && (
                <Text style={styles.muted}>
                  Функции: {mod.features.filter(Boolean).join(", ")}
                </Text>
              )}
            </View>
          ))}
        </View>
      );

    case "IMPLEMENTATION_STAGES":
      if (!content?.stages?.length) return null;
      return (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          {content.stages.map((stage: any, i: number) => (
            <Text key={i}>
              {i + 1}. <Text style={styles.bold}>{stage.name}</Text>
              {stage.description ? ` — ${stage.description}` : ""}
              {stage.duration ? ` (${stage.duration})` : ""}
            </Text>
          ))}
        </View>
      );

    default:
      return null;
  }
}

export function ProposalPdf({ proposal, settings }: ProposalPdfProps) {
  const hasSections = proposal.sections && proposal.sections.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</Text>
            <Text style={styles.subtitle}>{proposal.number}</Text>
          </View>
          <View>
            <Text style={styles.companyName}>
              {settings?.companyName || "ITL Solutions"}
            </Text>
            {settings?.companyAddress && (
              <Text style={[styles.muted, { textAlign: "right" }]}>
                {settings.companyAddress}
              </Text>
            )}
            {settings?.companyPhone && (
              <Text style={[styles.muted, { textAlign: "right" }]}>
                {settings.companyPhone}
              </Text>
            )}
            {settings?.companyEmail && (
              <Text style={[styles.muted, { textAlign: "right" }]}>
                {settings.companyEmail}
              </Text>
            )}
          </View>
        </View>

        {/* Client & Dates */}
        <View style={[styles.row, styles.mb20]}>
          <View>
            <Text style={styles.sectionTitle}>КЛИЕНТ</Text>
            <Text style={styles.bold}>{proposal.client?.name}</Text>
            {proposal.client?.legalName && (
              <Text>{proposal.client.legalName}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sectionTitle}>Дата</Text>
            <Text style={styles.bold}>{fmtDate(proposal.createdAt)}</Text>
            {proposal.validUntil && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                  Действительно до
                </Text>
                <Text style={styles.bold}>{fmtDate(proposal.validUntil)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Sections */}
        {hasSections ? (
          proposal.sections
            .filter((s: any) => s.isVisible)
            .map((section: any) => (
              <SectionContent key={section.id} section={section} />
            ))
        ) : (
          <>
            {proposal.introduction && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Введение</Text>
                <Text>{proposal.introduction}</Text>
              </View>
            )}
            {proposal.scope && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Объём работ</Text>
                <Text>{proposal.scope}</Text>
              </View>
            )}
          </>
        )}

        {/* Cost */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>СТОИМОСТЬ</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colNum]}>№</Text>
            <Text style={[styles.thText, styles.colDesc]}>Описание</Text>
            <Text style={[styles.thText, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.thText, styles.colPrice]}>Цена</Text>
            <Text style={[styles.thText, styles.colAmount]}>Сумма</Text>
          </View>
          {proposal.items?.map((item: any, idx: number) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {fmtCurrency(Number(item.unitPrice), proposal.currency)}
              </Text>
              <Text style={styles.colAmount}>
                {fmtCurrency(Number(item.total), proposal.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalsBlock}>
          <View style={[styles.totalRow, styles.totalLine]}>
            <Text style={styles.grandTotal}>Итого:</Text>
            <Text style={styles.grandTotal}>
              {fmtCurrency(Number(proposal.totalAmount), proposal.currency)}
            </Text>
          </View>
        </View>

        {/* Payment Schedule */}
        {proposal.payments && proposal.payments.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>ГРАФИК ОПЛАТЫ</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.schedColName]}>Этап</Text>
              <Text style={[styles.thText, styles.schedColPct]}>%</Text>
              <Text style={[styles.thText, styles.schedColAmt]}>Сумма</Text>
            </View>
            {proposal.payments.map((p: any, i: number) => (
              <View key={i} style={styles.scheduleRow}>
                <Text style={styles.schedColName}>{p.stageName}</Text>
                <Text style={styles.schedColPct}>{p.percentage}%</Text>
                <Text style={[styles.schedColAmt, styles.bold]}>
                  {fmtCurrency(Number(p.amount), proposal.currency)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
