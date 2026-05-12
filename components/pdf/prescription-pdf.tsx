import React from "react";
import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import { base, BRAND } from "./pdf-styles";

const s = StyleSheet.create({
  rxBox: {
    borderWidth: 1,
    borderColor: BRAND.navy,
    borderRadius: 6,
    padding: 14,
    marginTop: 14,
  },
  rxNum: {
    position: "absolute",
    top: -8,
    left: 12,
    backgroundColor: BRAND.white,
    paddingHorizontal: 6,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
  },
  productName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BRAND.text,
    marginBottom: 3,
  },
  detail: {
    fontSize: 9.5,
    color: BRAND.textMuted,
    marginBottom: 2,
  },
  indication: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    fontSize: 9.5,
    color: BRAND.text,
  },
  sigLine: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: BRAND.text,
    width: 180,
    paddingTop: 4,
    fontSize: 9,
    color: BRAND.textMuted,
    alignSelf: "flex-end",
    textAlign: "center",
  },
  stamp: {
    marginTop: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: BRAND.navy,
    borderStyle: "dashed",
    alignSelf: "flex-end",
    justifyContent: "center",
    alignItems: "center",
  },
  stampText: { fontSize: 7, color: BRAND.navy, textAlign: "center" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
});

interface PrescriptionPDFProps {
  tenantName: string;
  prescription: {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    status: string;
    doctor: { name: string | null };
    employee?: { firstName: string; lastName: string; employeeNumber: string } | null;
    dependent?: { firstName: string; lastName: string } | null;
    items: Array<{
      id: string;
      quantity: number;
      dose?: string | null;
      frequency?: string | null;
      duration?: string | null;
      indication?: string | null;
      product: { genericName: string; commercialName?: string | null; form?: string | null; concentration?: string | null; unit?: string | null };
    }>;
  };
}

const STATUS_LABEL: Record<string, string> = {
  EMITIDA: "Emitida", DISPENSADA: "Dispensada", PARCIAL: "Parcial",
  VENCIDA: "Vencida", CANCELADA: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  EMITIDA: "#16a34a", DISPENSADA: "#6b7280", PARCIAL: "#d97706",
  VENCIDA: "#dc2626", CANCELADA: "#6b7280",
};

export function PrescriptionPDF({ tenantName, prescription }: PrescriptionPDFProps) {
  const patient = prescription.employee
    ? `${prescription.employee.lastName}, ${prescription.employee.firstName}`
    : prescription.dependent
    ? `${prescription.dependent.lastName}, ${prescription.dependent.firstName}`
    : "—";

  const rxCode = prescription.id.slice(-8).toUpperCase();
  const expired = new Date(prescription.expiresAt) < new Date();

  return (
    <Document
      title={`Receta ${rxCode}`}
      author={tenantName}
      creator="Remedis"
    >
      <Page size="A4" style={base.page}>
        {/* Header */}
        <View style={base.header}>
          <View style={base.headerLeft}>
            <Text style={base.tenantName}>{tenantName}</Text>
            <Text style={base.tenantSub}>Sistema de Gestión Médica · Remedis</Text>
          </View>
          <View style={base.headerRight}>
            <Text style={base.docTitle}>RECETA MÉDICA</Text>
            <Text style={base.docMeta}>Nº {rxCode}</Text>
            <Text style={base.docMeta}>
              {new Date(prescription.createdAt).toLocaleDateString("es-HN", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </Text>
            <View style={{ marginTop: 4, flexDirection: "row", justifyContent: "flex-end" }}>
              <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLOR[prescription.status]}20` }]}>
                <Text style={[base.badgeText, { color: STATUS_COLOR[prescription.status] }]}>
                  {STATUS_LABEL[prescription.status] ?? prescription.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Patient + Doctor info */}
        <View style={[base.row, { gap: 16 }]}>
          <View style={[base.col2, base.section]}>
            <Text style={base.sectionTitle}>Paciente</Text>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Nombre:</Text>
              <Text style={base.infoValue}>{patient}</Text>
            </View>
            {prescription.employee && (
              <View style={base.infoRow}>
                <Text style={base.infoLabel}>Nº Empleado:</Text>
                <Text style={base.infoValue}>{prescription.employee.employeeNumber}</Text>
              </View>
            )}
          </View>
          <View style={[base.col2, base.section]}>
            <Text style={base.sectionTitle}>Médico tratante</Text>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Dr. / Dra.:</Text>
              <Text style={base.infoValue}>{prescription.doctor.name ?? "—"}</Text>
            </View>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Válida hasta:</Text>
              <Text style={[base.infoValue, expired ? { color: BRAND.danger } : {}]}>
                {new Date(prescription.expiresAt).toLocaleDateString("es-HN", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
                {expired ? " (VENCIDA)" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Medications */}
        <View style={[base.section, { marginTop: 20 }]}>
          <Text style={base.sectionTitle}>
            Medicamentos prescritos ({prescription.items.length})
          </Text>
          {prescription.items.map((item, idx) => (
            <View key={item.id} style={[s.rxBox, { marginTop: idx === 0 ? 10 : 8 }]}>
              <Text style={s.rxNum}>Rp. {idx + 1}</Text>
              <Text style={s.productName}>
                {item.product.genericName}
                {item.product.commercialName ? ` (${item.product.commercialName})` : ""}
              </Text>
              <Text style={s.detail}>
                {[item.product.form, item.product.concentration]
                  .filter(Boolean).join(" · ")}
              </Text>
              <View style={[base.row, { gap: 24, marginTop: 6 }]}>
                {item.dose && (
                  <View>
                    <Text style={{ fontSize: 8, color: BRAND.textMuted, fontFamily: "Helvetica-Bold" }}>DOSIS</Text>
                    <Text style={{ fontSize: 10, color: BRAND.text, marginTop: 1 }}>{item.dose}</Text>
                  </View>
                )}
                {item.frequency && (
                  <View>
                    <Text style={{ fontSize: 8, color: BRAND.textMuted, fontFamily: "Helvetica-Bold" }}>FRECUENCIA</Text>
                    <Text style={{ fontSize: 10, color: BRAND.text, marginTop: 1 }}>{item.frequency}</Text>
                  </View>
                )}
                {item.duration && (
                  <View>
                    <Text style={{ fontSize: 8, color: BRAND.textMuted, fontFamily: "Helvetica-Bold" }}>DURACIÓN</Text>
                    <Text style={{ fontSize: 10, color: BRAND.text, marginTop: 1 }}>{item.duration}</Text>
                  </View>
                )}
                <View>
                  <Text style={{ fontSize: 8, color: BRAND.textMuted, fontFamily: "Helvetica-Bold" }}>CANTIDAD</Text>
                  <Text style={{ fontSize: 10, color: BRAND.text, marginTop: 1 }}>
                    {item.quantity} {item.product.unit ?? "unidad(es)"}
                  </Text>
                </View>
              </View>
              {item.indication && (
                <Text style={s.indication}>Indicaciones: {item.indication}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Signature */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 32 }}>
          <View style={{ alignItems: "center" }}>
            <View style={s.stamp}>
              <Text style={s.stampText}>SELLO{"\n"}MÉDICO</Text>
            </View>
            <View style={s.sigLine}>
              <Text>Firma y sello del médico</Text>
              <Text style={{ marginTop: 2, color: BRAND.navy, fontFamily: "Helvetica-Bold" }}>
                {prescription.doctor.name ?? ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={base.footer}>
          <Text style={base.footerText}>
            {tenantName} · Generado el {new Date().toLocaleDateString("es-HN")}
          </Text>
          <Text style={base.footerText}>
            Documento generado por Remedis · Uso médico confidencial
          </Text>
        </View>
      </Page>
    </Document>
  );
}
