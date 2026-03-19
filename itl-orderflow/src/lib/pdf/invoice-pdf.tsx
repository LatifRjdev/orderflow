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
  title: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 16, color: "#6b7280", marginTop: 2 },
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
  mb10: { marginBottom: 10 },
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
  // Totals
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
  notes: { marginTop: 30, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12 },
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

interface InvoicePdfProps {
  invoice: any;
  settings: any;
}

export function InvoicePdf({ invoice, settings }: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>СЧЁТ</Text>
            <Text style={styles.subtitle}>{invoice.number}</Text>
          </View>
          <View>
            <Text style={styles.companyName}>
              {settings?.companyName || "ITL Solutions"}
            </Text>
            {settings?.companyInn && (
              <Text style={[styles.muted, { textAlign: "right" }]}>
                ИНН: {settings.companyInn}
              </Text>
            )}
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
            <Text style={styles.sectionTitle}>ПОЛУЧАТЕЛЬ</Text>
            <Text style={styles.bold}>{invoice.client?.name}</Text>
            {invoice.client?.legalName && (
              <Text>{invoice.client.legalName}</Text>
            )}
            {invoice.client?.inn && (
              <Text style={styles.muted}>ИНН: {invoice.client.inn}</Text>
            )}
            {invoice.client?.address && (
              <Text style={styles.muted}>{invoice.client.address}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.sectionTitle}>Дата выставления</Text>
            <Text style={styles.bold}>{fmtDate(invoice.issueDate)}</Text>
            {invoice.dueDate && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                  Срок оплаты
                </Text>
                <Text style={styles.bold}>{fmtDate(invoice.dueDate)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Order reference */}
        {invoice.order && (
          <View style={styles.mb20}>
            <Text style={styles.sectionTitle}>ПРОЕКТ</Text>
            <Text>
              {invoice.order.number} — {invoice.order.title}
            </Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colNum]}>№</Text>
            <Text style={[styles.thText, styles.colDesc]}>Описание</Text>
            <Text style={[styles.thText, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.thText, styles.colPrice]}>Цена</Text>
            <Text style={[styles.thText, styles.colAmount]}>Сумма</Text>
          </View>
          {invoice.items?.map((item: any, idx: number) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {fmtCurrency(Number(item.unitPrice), invoice.currency)}
              </Text>
              <Text style={styles.colAmount}>
                {fmtCurrency(Number(item.total || item.amount), invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Подитог:</Text>
            <Text>{fmtCurrency(Number(invoice.subtotal), invoice.currency)}</Text>
          </View>
          {Number(invoice.discountAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Скидка:</Text>
              <Text>
                -{fmtCurrency(Number(invoice.discountAmount), invoice.currency)}
              </Text>
            </View>
          )}
          {Number(invoice.taxAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Налог:</Text>
              <Text>
                {fmtCurrency(Number(invoice.taxAmount), invoice.currency)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalLine]}>
            <Text style={styles.grandTotal}>Итого:</Text>
            <Text style={styles.grandTotal}>
              {fmtCurrency(Number(invoice.totalAmount), invoice.currency)}
            </Text>
          </View>
          {Number(invoice.paidAmount) > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={{ color: "#16a34a" }}>Оплачено:</Text>
                <Text style={{ color: "#16a34a" }}>
                  -{fmtCurrency(Number(invoice.paidAmount), invoice.currency)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.bold}>К оплате:</Text>
                <Text style={styles.bold}>
                  {fmtCurrency(
                    Number(invoice.totalAmount) - Number(invoice.paidAmount),
                    invoice.currency
                  )}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>ПРИМЕЧАНИЯ</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
