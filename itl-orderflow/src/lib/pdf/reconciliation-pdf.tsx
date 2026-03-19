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
  subtitle: { fontSize: 12, textAlign: "center", color: "#6b7280", marginBottom: 20 },
  muted: { color: "#6b7280", fontSize: 9 },
  bold: { fontFamily: "Helvetica-Bold" },
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
  colDate: { width: "14%", textAlign: "center" },
  colDesc: { width: "40%" },
  colDebit: { width: "13%", textAlign: "right" },
  colCredit: { width: "13%", textAlign: "right" },
  colBalance: { width: "14%", textAlign: "right" },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  balanceBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
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

function fmtDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface ReconciliationPdfProps {
  reconciliation: any;
  settings: any;
}

export function ReconciliationPdf({ reconciliation, settings }: ReconciliationPdfProps) {
  const companyName = settings?.companyName || "ITL Solutions";
  const companyLegal = settings?.companyLegalName || companyName;
  const client = reconciliation.client;
  const entries = reconciliation.entries || [];
  const currency = reconciliation.currency || "TJS";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>АКТ СВЕРКИ ВЗАИМОРАСЧЁТОВ</Text>
        <Text style={styles.subtitle}>
          № {reconciliation.number}
        </Text>

        {/* Period */}
        <View style={[styles.paragraph, { textAlign: "center" }]}>
          <Text>
            За период с {fmtDate(reconciliation.periodFrom)} по{" "}
            {fmtDate(reconciliation.periodTo)}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>Между: </Text>
            {companyLegal} (Исполнитель)
          </Text>
        </View>
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>И: </Text>
            {client?.legalName || client?.name} (Заказчик)
          </Text>
        </View>

        {/* Opening balance */}
        <View style={styles.balanceBlock}>
          <View style={styles.balanceRow}>
            <Text style={styles.bold}>Сальдо на начало периода:</Text>
            <Text style={styles.bold}>
              {fmtCurrency(Number(reconciliation.openingBalance), currency)}
            </Text>
          </View>
        </View>

        {/* Entries Table */}
        <View style={{ marginTop: 16, marginBottom: 10 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colNum]}>№</Text>
            <Text style={[styles.thText, styles.colDate]}>Дата</Text>
            <Text style={[styles.thText, styles.colDesc]}>Описание</Text>
            <Text style={[styles.thText, styles.colDebit]}>Дебет</Text>
            <Text style={[styles.thText, styles.colCredit]}>Кредит</Text>
            <Text style={[styles.thText, styles.colBalance]}>Сальдо</Text>
          </View>
          {entries.map((entry: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colDate}>{fmtDateShort(entry.date)}</Text>
              <Text style={styles.colDesc}>{entry.description}</Text>
              <Text style={styles.colDebit}>
                {Number(entry.debit) > 0
                  ? fmtCurrency(Number(entry.debit), currency)
                  : "—"}
              </Text>
              <Text style={styles.colCredit}>
                {Number(entry.credit) > 0
                  ? fmtCurrency(Number(entry.credit), currency)
                  : "—"}
              </Text>
              <Text style={styles.colBalance}>
                {fmtCurrency(Number(entry.balance), currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Closing balance */}
        <View style={styles.balanceBlock}>
          <View style={styles.balanceRow}>
            <Text style={styles.bold}>Сальдо на конец периода:</Text>
            <Text style={styles.bold}>
              {fmtCurrency(Number(reconciliation.closingBalance), currency)}
            </Text>
          </View>
        </View>

        {/* Closing text */}
        <View style={[styles.paragraph, { marginTop: 20 }]}>
          <Text>
            Настоящий акт сверки составлен в двух экземплярах, имеющих одинаковую
            юридическую силу, по одному для каждой из сторон.
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
