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
  sectionContent: { marginBottom: 10, lineHeight: 1.6 },
  metaBlock: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  metaRow: { flexDirection: "row", marginBottom: 4 },
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

interface TechSpecPdfProps {
  spec: any;
  settings: any;
}

export function TechSpecPdf({ spec, settings }: TechSpecPdfProps) {
  const companyName = settings?.companyName || "ITL Solutions";
  const companyLegal = settings?.companyLegalName || companyName;
  const client = spec.client;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ТЕХНИЧЕСКОЕ ЗАДАНИЕ</Text>
        <Text style={styles.subtitle}>
          № {spec.number} (версия {spec.version})
        </Text>

        {/* Meta */}
        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.bold}>Название: </Text>
            <Text>{spec.title}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.bold}>Заказчик: </Text>
            <Text>{client?.legalName || client?.name}</Text>
          </View>
          {spec.order && (
            <View style={styles.metaRow}>
              <Text style={styles.bold}>Проект: </Text>
              <Text>{spec.order.number} — {spec.order.title}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.bold}>Дата создания: </Text>
            <Text>{fmtDate(spec.createdAt)}</Text>
          </View>
          {spec.approvedDate && (
            <View style={styles.metaRow}>
              <Text style={styles.bold}>Дата утверждения: </Text>
              <Text>{fmtDate(spec.approvedDate)}</Text>
            </View>
          )}
        </View>

        {/* Sections */}
        {spec.sections?.map((section: any, idx: number) => (
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
