import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { base, BRAND } from "./pdf-styles";

const s = StyleSheet.create({
  certBox: {
    borderWidth: 2,
    borderColor: BRAND.navy,
    borderRadius: 6,
    padding: 16,
    marginTop: 12,
  },
  certText: {
    fontSize: 10.5,
    color: BRAND.text,
    lineHeight: 1.6,
  },
  certHighlight: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  periodBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BRAND.navy,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  periodLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  periodDate: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
  },
  arrow: {
    fontSize: 16,
    color: BRAND.navy,
    fontFamily: "Helvetica-Bold",
  },
  daysBox: {
    backgroundColor: BRAND.navy,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  daysNum: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
  },
  daysLbl: {
    fontSize: 8,
    color: "#a0b4d0",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  ihssBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#d97706",
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  sigArea: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 28,
  },
  sigBlock: {
    alignItems: "center",
    width: 200,
  },
  stamp: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: BRAND.navy,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    alignSelf: "center",
  },
  stampText: { fontSize: 7, color: BRAND.navy, textAlign: "center" },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: BRAND.text,
    width: 180,
    paddingTop: 4,
    alignItems: "center",
  },
  sigName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
    marginTop: 2,
    textAlign: "center",
  },
  sigSub: { fontSize: 8, color: BRAND.textMuted, textAlign: "center" },
});

const TIPO_LABEL: Record<string, string> = {
  REPOSO_MEDICO:      "Reposo Médico",
  INCAPACIDAD_IHSS:   "Incapacidad IHSS",
  CERTIFICADO_TRABAJO:"Certificado para el Empleador",
};

const ESTADO_COLOR: Record<string, string> = {
  EMITIDA:            "#16a34a",
  ENTREGADA_PACIENTE: "#2563eb",
  PRESENTADA_RRHH:    "#7c3aed",
  CANCELADA:          "#dc2626",
};

const ESTADO_LABEL: Record<string, string> = {
  EMITIDA:            "Emitida",
  ENTREGADA_PACIENTE: "Entregada al paciente",
  PRESENTADA_RRHH:    "Presentada a RRHH",
  CANCELADA:          "Cancelada",
};

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtShort(d: Date) {
  return new Date(d).toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export interface IncapacidadPDFProps {
  tenantName: string;
  incapacidad: {
    id: string;
    folio: string;
    tipo: string;
    estado: string;
    fechaInicio: Date;
    fechaFin: Date;
    dias: number;
    diagnostico: string;
    motivo: string;
    restricciones: string | null;
    recomendaciones: string | null;
    fechaRetorno: Date | null;
    esIHSS: boolean;
    numeroIHSS: string | null;
    createdAt: Date;
    doctor: { name: string | null; specialty: string | null; licenseNumber: string | null };
    employee?: { firstName: string; lastName: string; employeeNumber: string; department: string | null; position: string | null } | null;
    dependent?: { firstName: string; lastName: string } | null;
  };
}

export function IncapacidadPDF({ tenantName, incapacidad: inc }: IncapacidadPDFProps) {
  const patientName = inc.employee
    ? `${inc.employee.lastName.toUpperCase()}, ${inc.employee.firstName.toUpperCase()}`
    : inc.dependent
    ? `${inc.dependent.lastName.toUpperCase()}, ${inc.dependent.firstName.toUpperCase()}`
    : "PACIENTE NO ESPECIFICADO";

  const estadoColor = ESTADO_COLOR[inc.estado] ?? BRAND.textMuted;

  return (
    <Document title={`Incapacidad ${inc.folio}`} author={tenantName} creator="Remedis">
      <Page size="A4" style={base.page}>
        {/* Header */}
        <View style={base.header}>
          <View style={base.headerLeft}>
            <Text style={base.tenantName}>{tenantName}</Text>
            <Text style={base.tenantSub}>Sistema de Gestión Médica · Remedis</Text>
          </View>
          <View style={base.headerRight}>
            <Text style={base.docTitle}>CERTIFICADO MÉDICO</Text>
            <Text style={[base.docTitle, { fontSize: 11, marginTop: 1 }]}>DE INCAPACIDAD</Text>
            <Text style={base.docMeta}>{TIPO_LABEL[inc.tipo] ?? inc.tipo}</Text>
            <Text style={base.docMeta}>Folio: {inc.folio}</Text>
            <Text style={base.docMeta}>{fmt(inc.createdAt)}</Text>
            <View style={{ marginTop: 5, alignSelf: "flex-end" }}>
              <View style={[base.badge, { backgroundColor: `${estadoColor}18` }]}>
                <Text style={[base.badgeText, { color: estadoColor }]}>
                  {ESTADO_LABEL[inc.estado] ?? inc.estado}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Patient + Doctor row */}
        <View style={[base.row, { gap: 16 }]}>
          <View style={[base.col2, base.section]}>
            <Text style={base.sectionTitle}>Paciente</Text>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Nombre:</Text>
              <Text style={base.infoValue}>{patientName}</Text>
            </View>
            {inc.employee && (
              <>
                <View style={base.infoRow}>
                  <Text style={base.infoLabel}>Nº Empleado:</Text>
                  <Text style={base.infoValue}>{inc.employee.employeeNumber}</Text>
                </View>
                {inc.employee.department && (
                  <View style={base.infoRow}>
                    <Text style={base.infoLabel}>Departamento:</Text>
                    <Text style={base.infoValue}>{inc.employee.department}</Text>
                  </View>
                )}
                {inc.employee.position && (
                  <View style={base.infoRow}>
                    <Text style={base.infoLabel}>Cargo:</Text>
                    <Text style={base.infoValue}>{inc.employee.position}</Text>
                  </View>
                )}
              </>
            )}
          </View>
          <View style={[base.col2, base.section]}>
            <Text style={base.sectionTitle}>Médico tratante</Text>
            <View style={base.infoRow}>
              <Text style={base.infoLabel}>Dr. / Dra.:</Text>
              <Text style={base.infoValue}>{inc.doctor.name ?? "—"}</Text>
            </View>
            {inc.doctor.specialty && (
              <View style={base.infoRow}>
                <Text style={base.infoLabel}>Especialidad:</Text>
                <Text style={base.infoValue}>{inc.doctor.specialty}</Text>
              </View>
            )}
            {inc.doctor.licenseNumber && (
              <View style={base.infoRow}>
                <Text style={base.infoLabel}>Colegiación:</Text>
                <Text style={base.infoValue}>{inc.doctor.licenseNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Certificate body */}
        <View style={[base.section, { marginTop: 16 }]}>
          <Text style={base.sectionTitle}>Certificación</Text>
          <View style={s.certBox}>
            <Text style={s.certText}>
              El médico que suscribe certifica que el/la paciente{" "}
              <Text style={s.certHighlight}>{patientName}</Text>
              {" "}ha sido atendido/a en esta unidad de salud, presentando el siguiente cuadro clínico:
            </Text>

            <View style={{ marginTop: 10 }}>
              <Text style={[base.sectionTitle, { marginBottom: 3 }]}>Diagnóstico</Text>
              <Text style={[s.certText, { fontFamily: "Helvetica-Bold" }]}>{inc.diagnostico}</Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={[base.sectionTitle, { marginBottom: 3 }]}>Justificación médica</Text>
              <Text style={s.certText}>{inc.motivo}</Text>
            </View>

            <Text style={[s.certText, { marginTop: 10 }]}>
              Por lo anterior, se le concede <Text style={s.certHighlight}>{inc.dias} día{inc.dias !== 1 ? "s" : ""}</Text>{" "}
              de {TIPO_LABEL[inc.tipo]?.toLowerCase() ?? "reposo"}, comprendidos del{" "}
              <Text style={s.certHighlight}>{fmt(inc.fechaInicio)}</Text>{" "}
              al{" "}
              <Text style={s.certHighlight}>{fmt(inc.fechaFin)}</Text>.
            </Text>
          </View>
        </View>

        {/* Period visual */}
        <View style={s.periodRow}>
          <View style={s.periodBox}>
            <Text style={s.periodLabel}>Fecha inicio</Text>
            <Text style={s.periodDate}>{fmtShort(inc.fechaInicio)}</Text>
          </View>
          <Text style={s.arrow}>→</Text>
          <View style={s.daysBox}>
            <Text style={s.daysNum}>{inc.dias}</Text>
            <Text style={s.daysLbl}>{inc.dias === 1 ? "día" : "días"}</Text>
          </View>
          <Text style={s.arrow}>→</Text>
          <View style={s.periodBox}>
            <Text style={s.periodLabel}>Fecha fin</Text>
            <Text style={s.periodDate}>{fmtShort(inc.fechaFin)}</Text>
          </View>
        </View>

        {/* Restrictions & Recommendations */}
        {(inc.restricciones || inc.recomendaciones || inc.fechaRetorno) && (
          <View style={base.section}>
            <Text style={base.sectionTitle}>Indicaciones y restricciones</Text>
            <View style={{ gap: 6, marginTop: 4 }}>
              {inc.restricciones && (
                <View style={base.infoRow}>
                  <Text style={base.infoLabel}>Restricciones:</Text>
                  <Text style={base.infoValue}>{inc.restricciones}</Text>
                </View>
              )}
              {inc.recomendaciones && (
                <View style={base.infoRow}>
                  <Text style={base.infoLabel}>Recomendaciones:</Text>
                  <Text style={base.infoValue}>{inc.recomendaciones}</Text>
                </View>
              )}
              {inc.fechaRetorno && (
                <View style={base.infoRow}>
                  <Text style={base.infoLabel}>Fecha retorno:</Text>
                  <Text style={[base.infoValue, { fontFamily: "Helvetica-Bold", color: BRAND.navy }]}>
                    {fmt(inc.fechaRetorno)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* IHSS block */}
        {inc.esIHSS && (
          <View style={s.ihssBox}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#92400e", marginBottom: 4 }}>
              TRÁMITE IHSS
            </Text>
            <Text style={{ fontSize: 9.5, color: "#78350f" }}>
              Esta incapacidad está sujeta a presentación ante el Instituto Hondureño de Seguridad Social (IHSS).
              {inc.numeroIHSS ? `  Número de caso IHSS: ${inc.numeroIHSS}` : ""}
            </Text>
          </View>
        )}

        {/* Signature */}
        <View style={s.sigArea}>
          <View style={s.sigBlock}>
            <View style={s.stamp}>
              <Text style={s.stampText}>SELLO{"\n"}MÉDICO</Text>
            </View>
            <View style={s.sigLine}>
              <Text style={{ fontSize: 9, color: BRAND.textMuted }}>Firma y sello del médico</Text>
              <Text style={s.sigName}>{inc.doctor.name ?? ""}</Text>
              {inc.doctor.specialty && (
                <Text style={s.sigSub}>{inc.doctor.specialty}</Text>
              )}
              {inc.doctor.licenseNumber && (
                <Text style={s.sigSub}>Colegiación Nº {inc.doctor.licenseNumber}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={base.footer}>
          <Text style={base.footerText}>
            {tenantName} · {fmt(inc.createdAt)}
          </Text>
          <Text style={base.footerText}>
            {inc.folio} · Documento generado por Remedis
          </Text>
        </View>
      </Page>
    </Document>
  );
}
