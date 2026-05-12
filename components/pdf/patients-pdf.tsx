import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { base, BRAND } from "./pdf-styles";

const TA_R = "right" as const;

const s = StyleSheet.create({
  col: {
    num:   { width: 28,  fontSize: 9, color: BRAND.textMuted },
    id:    { width: 72,  fontSize: 9 },
    name:  { flex: 1,    fontSize: 9 },
    dept:  { width: 90,  fontSize: 9 },
    phone: { width: 80,  fontSize: 9 },
    appts: { width: 36,  fontSize: 9, textAlign: TA_R },
  },
});

interface PatientsPDFProps {
  tenantName: string;
  employees: Array<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department: string | null;
    position: string | null;
    phone: string | null;
    email: string | null;
    gender: string | null;
    birthDate: Date | null;
    _count: { appointments: number; medicalRecords: number };
  }>;
}

export function PatientsPDF({ tenantName, employees }: PatientsPDFProps) {
  const cols = [
    { label: "#",          style: s.col.num },
    { label: "Nº Emp.",    style: s.col.id },
    { label: "Nombre completo", style: s.col.name },
    { label: "Dpto / Cargo",    style: s.col.dept },
    { label: "Teléfono",   style: s.col.phone },
    { label: "Citas",      style: s.col.appts },
  ];

  return (
    <Document title="Listado de Pacientes" author={tenantName} creator="Remedis">
      <Page size="A4" orientation="landscape" style={base.page}>
        {/* Header */}
        <View style={base.header}>
          <View style={base.headerLeft}>
            <Text style={base.tenantName}>{tenantName}</Text>
            <Text style={base.tenantSub}>Sistema de Gestión Médica · Remedis</Text>
          </View>
          <View style={base.headerRight}>
            <Text style={base.docTitle}>LISTADO DE PACIENTES</Text>
            <Text style={base.docMeta}>{employees.length} empleados registrados</Text>
            <Text style={base.docMeta}>
              Generado: {new Date().toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={base.table}>
          {/* Header row */}
          <View style={base.tableHeader}>
            {cols.map(c => (
              <Text key={c.label} style={[base.tableHeaderCell, c.style]}>{c.label}</Text>
            ))}
          </View>

          {/* Data rows */}
          {employees.map((emp, idx) => (
            <View
              key={emp.id}
              style={[base.tableRow, idx % 2 === 1 ? base.tableRowAlt : {}]}
              wrap={false}
            >
              <Text style={[base.tableCell, s.col.num]}>{idx + 1}</Text>
              <Text style={[base.tableCell, s.col.id]}>{emp.employeeNumber}</Text>
              <View style={s.col.name}>
                <Text style={base.tableCell}>{emp.lastName}, {emp.firstName}</Text>
                {emp.email && (
                  <Text style={base.tableCellMuted}>{emp.email}</Text>
                )}
              </View>
              <View style={s.col.dept}>
                <Text style={base.tableCell}>{emp.department ?? "—"}</Text>
                {emp.position && (
                  <Text style={base.tableCellMuted}>{emp.position}</Text>
                )}
              </View>
              <Text style={[base.tableCell, s.col.phone]}>{emp.phone ?? "—"}</Text>
              <Text style={[base.tableCell, s.col.appts]}>
                {emp._count.appointments}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={base.footer}>
          <Text style={base.footerText}>{tenantName} · Remedis</Text>
          <Text style={base.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}
