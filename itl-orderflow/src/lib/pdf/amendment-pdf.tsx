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
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 16,
  },
  referenceBlock: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  changesBlock: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#fefce8",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#eab308",
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

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface AmendmentPdfProps {
  amendment: any;
  settings: any;
}

export function AmendmentPdf({ amendment, settings }: AmendmentPdfProps) {
  const companyName = settings?.companyName || "ITL Solutions";
  const companyLegal = settings?.companyLegalName || companyName;
  const contract = amendment.contract;
  const client = contract?.client;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ</Text>
        <Text style={styles.subtitle}>
          № {amendment.number}
        </Text>

        {/* Reference to parent contract */}
        <View style={styles.referenceBlock}>
          <Text>
            <Text style={styles.bold}>К договору: </Text>
            № {contract?.number} — {contract?.title}
          </Text>
        </View>

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

        {/* Effective date */}
        <View style={styles.paragraph}>
          <Text>
            <Text style={styles.bold}>Дата вступления в силу: </Text>
            {fmtDate(amendment.effectiveDate)}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Описание изменений</Text>
        <View style={styles.paragraph}>
          <Text>{amendment.description}</Text>
        </View>

        {/* Changes detail */}
        {amendment.changes && (
          <>
            <Text style={styles.sectionTitle}>Детали изменений</Text>
            <View style={styles.changesBlock}>
              <Text>
                {typeof amendment.changes === "string"
                  ? amendment.changes
                  : JSON.stringify(amendment.changes, null, 2)}
              </Text>
            </View>
          </>
        )}

        {/* Closing */}
        <View style={[styles.paragraph, { marginTop: 20 }]}>
          <Text>
            Настоящее дополнительное соглашение является неотъемлемой частью
            Договора № {contract?.number} и вступает в силу с момента подписания
            обеими сторонами.
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
