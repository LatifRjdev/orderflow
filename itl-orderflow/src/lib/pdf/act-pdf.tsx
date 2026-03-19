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
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
  actNumber: { fontSize: 12, textAlign: "center", color: "#6b7280", marginBottom: 20 },
  muted: { color: "#6b7280", fontSize: 9 },
  bold: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  mb20: { marginBottom: 20 },
  mb10: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  paragraph: { marginBottom: 10, lineHeight: 1.6 },
  // Table
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
  colNum: { width: "6%" },
  colDesc: { width: "54%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },
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
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
  },
  signatureBlock: { width: "45%" },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    marginTop: 40,
    marginBottom: 4,
  },
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

interface ActPdfProps {
  actNumber: string;
  actDate: Date | string;
  order: any;
  client: any;
  settings: any;
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  totalAmount: number;
  currency: string;
}

export function ActPdf({
  actNumber,
  actDate,
  order,
  client,
  settings,
  items,
  totalAmount,
  currency,
}: ActPdfProps) {
  const companyName = settings?.companyName || "ITL Solutions";
  const companyLegal = settings?.companyLegalName || companyName;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>АКТ СДАЧИ-ПРИЁМКИ РАБОТ</Text>
        <Text style={styles.actNumber}>
          № {actNumber} от {fmtDate(actDate)}
        </Text>

        {/* Parties */}
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>Исполнитель: </Text>
            {companyLegal}
            {settings?.companyInn ? `, ИНН ${settings.companyInn}` : ""}
            {settings?.companyAddress ? `, ${settings.companyAddress}` : ""}
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>Заказчик: </Text>
            {client?.legalName || client?.name}
            {client?.inn ? `, ИНН ${client.inn}` : ""}
            {client?.address ? `, ${client.address}` : ""}
          </Text>
        </View>

        {/* Reference */}
        <View style={styles.paragraph}>
          <Text>
            Настоящий акт составлен о том, что Исполнитель выполнил, а Заказчик
            принял следующие работы по проекту{" "}
            <Text style={styles.bold}>
              {order.number} — {order.title}
            </Text>
            :
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.mb20}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colNum]}>№</Text>
            <Text style={[styles.thText, styles.colDesc]}>Описание работ</Text>
            <Text style={[styles.thText, styles.colQty]}>Кол-во</Text>
            <Text style={[styles.thText, styles.colPrice]}>Цена</Text>
            <Text style={[styles.thText, styles.colAmount]}>Сумма</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {fmtCurrency(item.unitPrice, currency)}
              </Text>
              <Text style={styles.colAmount}>
                {fmtCurrency(item.amount, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalsBlock}>
          <View style={[styles.totalRow, styles.totalLine]}>
            <Text style={styles.grandTotal}>Итого:</Text>
            <Text style={styles.grandTotal}>
              {fmtCurrency(totalAmount, currency)}
            </Text>
          </View>
        </View>

        {/* Closing */}
        <View style={[styles.paragraph, { marginTop: 20 }]}>
          <Text>
            Вышеперечисленные работы выполнены полностью и в срок. Заказчик
            претензий по объёму, качеству и срокам оказания работ не имеет.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <Text style={styles.bold}>ИСПОЛНИТЕЛЬ</Text>
            <Text style={styles.muted}>{companyLegal}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.muted}>Подпись / ФИО</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.bold}>ЗАКАЗЧИК</Text>
            <Text style={styles.muted}>
              {client?.legalName || client?.name}
            </Text>
            <View style={styles.signatureLine} />
            <Text style={styles.muted}>Подпись / ФИО</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
