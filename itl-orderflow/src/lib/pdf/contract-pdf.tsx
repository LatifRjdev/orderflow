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
  row: { flexDirection: "row", justifyContent: "space-between" },
  mb20: { marginBottom: 20 },
  mb10: { marginBottom: 10 },
  paragraph: { marginBottom: 10, lineHeight: 1.6 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 16,
  },
  sectionContent: { marginBottom: 10, lineHeight: 1.6 },
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
  totalBlock: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
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

interface ContractPdfProps {
  contract: any;
  settings: any;
}

export function ContractPdf({ contract, settings }: ContractPdfProps) {
  const companyName = settings?.companyName || "ITL Solutions";
  const companyLegal = settings?.companyLegalName || companyName;
  const client = contract.client;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ДОГОВОР</Text>
        <Text style={styles.subtitle}>
          № {contract.number} от {fmtDate(contract.contractDate)}
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

        {contract.order && (
          <View style={styles.paragraph}>
            <Text>
              <Text style={styles.bold}>Проект: </Text>
              {contract.order.number} — {contract.order.title}
            </Text>
          </View>
        )}

        {/* Period */}
        {(contract.startDate || contract.endDate) && (
          <View style={styles.paragraph}>
            <Text>
              <Text style={styles.bold}>Срок действия: </Text>
              {contract.startDate ? fmtDate(contract.startDate) : "—"}
              {" — "}
              {contract.endDate ? fmtDate(contract.endDate) : "бессрочно"}
            </Text>
          </View>
        )}

        {/* Sections */}
        {contract.sections?.map((section: any, idx: number) => (
          <View key={idx}>
            <Text style={styles.sectionTitle}>
              {idx + 1}. {section.title}
            </Text>
            <Text style={styles.sectionContent}>
              {typeof section.content === "string"
                ? section.content
                : JSON.stringify(section.content)}
            </Text>
          </View>
        ))}

        {/* Total Amount */}
        {Number(contract.totalAmount) > 0 && (
          <View style={styles.totalBlock}>
            <Text style={styles.bold}>
              Общая сумма договора: {fmtCurrency(Number(contract.totalAmount), contract.currency)}
            </Text>
          </View>
        )}

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
