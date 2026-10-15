import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { base, BRAND } from "./pdf-styles";

const TA_R = "right" as const;

const s = StyleSheet.create({
  vitalCard: {
    width: "31%",
    backgroundColor: BRAND.bg,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    marginRight: "2%",
  },
  vitalLabel: { fontSize: 7, color: BRAND.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  vitalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND.navy, marginTop: 2 },
  soapLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    backgroundColor: BRAND.navy,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  soapText: {
    fontSize: 9.5,
    color: BRAND.text,
    lineHeight: 1.5,
    paddingLeft: 2,
  },
  dxRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  dxCode: { width: 56, fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND.accent },
  dxDesc: { flex: 1, fontSize: 9.5, color: BRAND.text },
  dxPrimary: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
    backgroundColor: "#dbeafe",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 6,
    alignSelf: "flex-start",
  },
  rxBox: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 5,
  },
  rxProduct: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND.text },
  rxDetail: { fontSize: 8.5, color: BRAND.textMuted, marginTop: 2 },
});

const RX_STATUS: Record<string, string> = {
  EMITIDA: "Emitida", DISPENSADA: "Dispensada",
  PARCIAL: "Parcial", VENCIDA: "Vencida", CANCELADA: "Cancelada",
};
const RX_COLOR: Record<string, string> = {
  EMITIDA: "#16a34a", DISPENSADA: "#6b7280",
  PARCIAL: "#d97706", VENCIDA: "#dc2626", CANCELADA: "#6b7280",
};

interface MedicalRecordPDFProps {
  tenantName: string;
  record: {
    id: string;
    createdAt: Date;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    notes: string | null;
    referral: string | null;
    doctor: { name: string | null };
    employee: { firstName: string; lastName: string; employeeNumber: string; department?: string | null; position?: string | null } | null;
    dependent: { firstName: string; lastName: string } | null;
    vitalSigns: {
      weight: number | null; height: number | null; bmi: number | null;
      systolicBp: number | null; diastolicBp: number | null;
      heartRate: number | null; temperature: number | null;
      glucose: number | null; spo2: number | null; respiratoryRate: number | null;
    } | null;
    diagnoses: Array<{ id: string; cie10Code: string; description: string; isPrimary: boolean }>;
    prescriptions: Array<{
      id: string;
      status: string;
      expiresAt: Date;
      items: Array<{
        id: string;
        quantity: number;
        dispensedQty: number;
        dose: string | null;
        frequency: string | null;
        duration: string | null;
        instructions: string | null;
        product: { genericName: string; commercialName: string | null; unit: string | null };
      }>;
    }>;
  };
}

export function MedicalRecordPDF({ tenantName, record }: MedicalRecordPDFProps) {
  const patient = record.employee
    ? `${record.employee.lastName}, ${record.employee.firstName}`
    : record.dependent
    ? `${record.dependent.lastName}, ${record.dependent.firstName}`
    : "Paciente no especificado";

  const v = record.vitalSigns;
  const vitalItems = v ? [
    { label: "Peso",         value: v.weight      != null ? `${v.weight} kg`           : null },
    { label: "Talla",        value: v.height      != null ? `${v.height} cm`           : null },
    { label: "IMC",          value: v.bmi         != null ? v.bmi.toFixed(1)           : null },
    { label: "Presión art.", value: v.systolicBp  != null ? `${v.systolicBp}/${v.diastolicBp} mmHg` : null },
    { label: "Frec. cardíaca", value: v.heartRate != null ? `${v.heartRate} lpm`       : null },
    { label: "Temperatura",  value: v.temperature != null ? `${v.temperature} °C`      : null },
    { label: "Glucosa",      value: v.glucose     != null ? `${v.glucose} mg/dL`       : null },
    { label: "SpO₂",         value: v.spo2        != null ? `${v.spo2}%`              : null },
    { label: "Frec. resp.",  value: v.respiratoryRate != null ? `${v.respiratoryRate} rpm` : null },
  ].filter(i => i.value !== null) : [];

  const soapFields = [
    { key: "S", label: "Subjetivo",  value: record.subjective },
    { key: "O", label: "Objetivo",   value: record.objective },
    { key: "A", label: "Evaluación", value: record.assessment },
    { key: "P", label: "Plan",       value: record.plan },
    { key: "N", label: "Notas",      value: record.notes },
    { key: "R", label: "Referido a", value: record.referral },
  ].filter(f => f.value);

  const recCode = record.id.slice(-8).toUpperCase();

  return (
    <Document
      title={`Consulta ${recCode} — ${patient}`}
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
            <Text style={base.docTitle}>NOTA DE CONSULTA</Text>
            <Text style={base.docMeta}>Ref. {recCode}</Text>
            <Text style={base.docMeta}>
              {new Date(record.createdAt).toLocaleDateString("es-HN", {
                weekday: "long", day: "2-digit", month: "long", year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Patient + Doctor */}
        <View style={[base.row, { gap: 16 }]}>
          <View style={[base.col2, base.section]}>
            <Text style={base.sectionTitle}>Paciente</Text>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Nombre:</Text>
              <Text style={[base.infoValue, { fontFamily: "Helvetica-Bold" }]}>{patient}</Text>
            </View>
            {record.employee && (
              <>
                <View style={base.infoRow}>
                  <Text style={base.infoLabel}>Nº Empleado:</Text>
                  <Text style={base.infoValue}>{record.employee.employeeNumber}</Text>
                </View>
                {record.employee.department && (
                  <View style={base.infoRow}>
                    <Text style={base.infoLabel}>Departamento:</Text>
                    <Text style={base.infoValue}>{record.employee.department}</Text>
                  </View>
                )}
              </>
            )}
          </View>
          <View style={[base.col2, base.section]}>
            <Text style={base.sectionTitle}>Médico tratante</Text>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Dr. / Dra.:</Text>
              <Text style={[base.infoValue, { fontFamily: "Helvetica-Bold" }]}>
                {record.doctor.name ?? "—"}
              </Text>
            </View>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Diagnósticos:</Text>
              <Text style={base.infoValue}>{record.diagnoses.length}</Text>
            </View>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Recetas:</Text>
              <Text style={base.infoValue}>{record.prescriptions.length}</Text>
            </View>
          </View>
        </View>

        {/* Vital Signs */}
        {vitalItems.length > 0 && (
          <View style={[base.section, { marginTop: 16 }]}>
            <Text style={base.sectionTitle}>Signos vitales</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
              {vitalItems.map(item => (
                <View key={item.label} style={s.vitalCard}>
                  <Text style={s.vitalLabel}>{item.label}</Text>
                  <Text style={s.vitalValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SOAP */}
        {soapFields.length > 0 && (
          <View style={[base.section, { marginTop: 16 }]}>
            <Text style={base.sectionTitle}>Nota SOAP</Text>
            <View style={{ marginTop: 8, gap: 10 }}>
              {soapFields.map(field => (
                <View key={field.key} wrap={false}>
                  <Text style={s.soapLabel}>{field.key} — {field.label}</Text>
                  <Text style={s.soapText}>{field.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Diagnoses */}
        {record.diagnoses.length > 0 && (
          <View style={[base.section, { marginTop: 16 }]} wrap={false}>
            <Text style={base.sectionTitle}>Diagnósticos CIE-10</Text>
            <View style={{ marginTop: 4, borderWidth: 1, borderColor: BRAND.border, borderRadius: 4, overflow: "hidden" }}>
              {record.diagnoses.map((d, idx) => (
                <View
                  key={d.id}
                  style={[s.dxRow, idx % 2 === 1 ? { backgroundColor: BRAND.bg } : {}]}
                >
                  <Text style={s.dxCode}>{d.cie10Code}</Text>
                  <Text style={s.dxDesc}>{d.description}</Text>
                  {d.isPrimary && <Text style={s.dxPrimary}>PRINCIPAL</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Prescriptions */}
        {record.prescriptions.length > 0 && (
          <View style={[base.section, { marginTop: 16 }]}>
            <Text style={base.sectionTitle}>
              Receta{record.prescriptions.length > 1 ? "s" : ""} médica{record.prescriptions.length > 1 ? "s" : ""}
            </Text>
            {record.prescriptions.map(rx => (
              <View key={rx.id} style={{ marginTop: 8 }} wrap={false}>
                <View style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  backgroundColor: BRAND.navy, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6,
                  marginBottom: 4,
                }}>
                  <Text style={{ fontSize: 9, color: BRAND.white, fontFamily: "Helvetica-Bold" }}>
                    Receta #{rx.id.slice(-8).toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Text style={{ fontSize: 8, color: "#93c5fd" }}>
                      Vence: {new Date(rx.expiresAt).toLocaleDateString("es-HN")}
                    </Text>
                    <Text style={{ fontSize: 8, color: RX_COLOR[rx.status] ?? "#6b7280", fontFamily: "Helvetica-Bold" }}>
                      {RX_STATUS[rx.status] ?? rx.status}
                    </Text>
                  </View>
                </View>
                {rx.items.map((item, idx) => (
                  <View key={item.id} style={[s.rxBox, idx % 2 === 1 ? { backgroundColor: BRAND.bg } : {}]}>
                    <Text style={s.rxProduct}>
                      {item.product.genericName}
                      {item.product.commercialName ? ` (${item.product.commercialName})` : ""}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 3 }}>
                      {item.dose && (
                        <Text style={s.rxDetail}>Dosis: {item.dose}</Text>
                      )}
                      {item.frequency && (
                        <Text style={s.rxDetail}>Frecuencia: {item.frequency}</Text>
                      )}
                      {item.duration && (
                        <Text style={s.rxDetail}>Duración: {item.duration}</Text>
                      )}
                      <Text style={s.rxDetail}>
                        Cant.: {item.quantity}{item.product.unit ? ` ${item.product.unit}` : ""}
                        {item.dispensedQty > 0 ? ` (dispensado: ${item.dispensedQty})` : ""}
                      </Text>
                    </View>
                    {item.instructions && (
                      <Text style={[s.rxDetail, { marginTop: 3, color: BRAND.text }]}>
                        Indicaciones: {item.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={base.footer}>
          <Text style={base.footerText}>
            {tenantName} · Documento confidencial · Generado por Remedis
          </Text>
          <Text style={base.footerText}>
            {new Date().toLocaleDateString("es-HN")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
