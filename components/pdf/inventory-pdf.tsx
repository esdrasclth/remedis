import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { base, BRAND } from "./pdf-styles";

const TA = "right" as const;

const s = StyleSheet.create({
  col: {
    num:      { width: 24,  fontSize: 9 },
    name:     { flex: 1,    fontSize: 9 },
    cat:      { width: 72,  fontSize: 9 },
    form:     { width: 80,  fontSize: 9 },
    stock:    { width: 50,  fontSize: 9, textAlign: TA },
    min:      { width: 40,  fontSize: 9, textAlign: TA },
    cost:     { width: 60,  fontSize: 9, textAlign: TA },
    value:    { width: 70,  fontSize: 9, textAlign: TA },
    batches:  { width: 38,  fontSize: 9, textAlign: TA },
  },
  batchRow: {
    flexDirection: "row" as const,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f0f4ff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  batchLabel: { width: 8, fontSize: 8, color: BRAND.textMuted },
  batchNum:   { width: 90, fontSize: 8, color: BRAND.navy },
  batchDate:  { width: 70, fontSize: 8, color: BRAND.textMuted },
  batchQty:   { flex: 1,   fontSize: 8, textAlign: TA, color: BRAND.text },
  alertBadge: {
    backgroundColor: "#fee2e2",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
});

const CAT_LABEL: Record<string, string> = {
  MEDICAMENTO: "Medicamento",
  INSUMO_DESCARTABLE: "Insumo",
  EQUIPO_MEDICO: "Equipo",
};

interface InventoryPDFProps {
  tenantName: string;
  products: Array<{
    id: string;
    genericName: string;
    commercialName: string | null;
    category: string;
    form: string | null;
    concentration: string | null;
    unit: string | null;
    minStock: number;
    unitCost: number | null;
    batches: Array<{
      id: string;
      batchNumber: string;
      expiryDate: Date;
      currentQty: number;
      warehouse?: { name: string } | null;
    }>;
  }>;
}

export function InventoryPDF({ tenantName, products }: InventoryPDFProps) {
  const fmt = (n: number) =>
    `L ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cols = [
    { label: "#",           style: s.col.num },
    { label: "Producto",    style: s.col.name },
    { label: "Categoría",   style: s.col.cat },
    { label: "Presentación",style: s.col.form },
    { label: "Stock",       style: s.col.stock },
    { label: "Mín.",        style: s.col.min },
    { label: "Costo u.",    style: s.col.cost },
    { label: "Valor inv.",  style: s.col.value },
    { label: "Lotes",       style: s.col.batches },
  ];

  const totalValue = products.reduce((s, p) => {
    const stock = p.batches.reduce((a, b) => a + b.currentQty, 0);
    return s + stock * (p.unitCost ?? 0);
  }, 0);

  return (
    <Document title="Inventario" author={tenantName} creator="Remedis">
      <Page size="A4" orientation="landscape" style={base.page}>
        {/* Header */}
        <View style={base.header}>
          <View style={base.headerLeft}>
            <Text style={base.tenantName}>{tenantName}</Text>
            <Text style={base.tenantSub}>Sistema de Gestión Médica · Remedis</Text>
          </View>
          <View style={base.headerRight}>
            <Text style={base.docTitle}>REPORTE DE INVENTARIO</Text>
            <Text style={base.docMeta}>{products.length} productos · Valor total: {fmt(totalValue)}</Text>
            <Text style={base.docMeta}>
              Generado: {new Date().toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={base.table}>
          <View style={base.tableHeader}>
            {cols.map(c => (
              <Text key={c.label} style={[base.tableHeaderCell, c.style]}>{c.label}</Text>
            ))}
          </View>

          {products.map((product, idx) => {
            const totalStock = product.batches.reduce((a, b) => a + b.currentQty, 0);
            const invValue   = totalStock * (product.unitCost ?? 0);
            const isLow      = totalStock <= product.minStock;
            const activeBatches = product.batches.filter(b => b.currentQty > 0);

            return (
              <React.Fragment key={product.id}>
                <View
                  style={[base.tableRow, idx % 2 === 1 ? base.tableRowAlt : {}]}
                  wrap={false}
                >
                  <Text style={[base.tableCell, s.col.num]}>{idx + 1}</Text>
                  <View style={s.col.name}>
                    <Text style={[base.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                      {product.genericName}
                    </Text>
                    {product.commercialName && (
                      <Text style={base.tableCellMuted}>{product.commercialName}</Text>
                    )}
                  </View>
                  <Text style={[base.tableCell, s.col.cat]}>{CAT_LABEL[product.category] ?? product.category}</Text>
                  <Text style={[base.tableCell, s.col.form]}>
                    {[product.form, product.concentration].filter(Boolean).join(" ") || "—"}
                  </Text>
                  <View style={[s.col.stock, { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }]}>
                    <Text style={[base.tableCell, isLow ? { color: BRAND.danger, fontFamily: "Helvetica-Bold" } : {}]}>
                      {totalStock}
                    </Text>
                    {isLow && (
                      <View style={s.alertBadge}>
                        <Text style={{ fontSize: 7, color: BRAND.danger }}>!</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[base.tableCell, s.col.min, { color: BRAND.textMuted }]}>
                    {product.minStock}
                  </Text>
                  <Text style={[base.tableCell, s.col.cost]}>
                    {product.unitCost != null ? fmt(product.unitCost) : "—"}
                  </Text>
                  <Text style={[base.tableCell, s.col.value, { fontFamily: "Helvetica-Bold" }]}>
                    {product.unitCost != null ? fmt(invValue) : "—"}
                  </Text>
                  <Text style={[base.tableCell, s.col.batches]}>{activeBatches.length}</Text>
                </View>

                {/* Batch rows */}
                {activeBatches.map(batch => {
                  const expDays = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / 86400000);
                  const expWarn = expDays <= 30;
                  const expExpired = expDays <= 0;
                  return (
                    <View key={batch.id} style={s.batchRow} wrap={false}>
                      <Text style={s.batchLabel}>↳</Text>
                      <Text style={s.batchNum}>{batch.batchNumber}</Text>
                      <Text style={[s.batchDate, expWarn || expExpired ? { color: BRAND.danger } : {}]}>
                        {expExpired ? "VENCIDO" : `Vence: ${new Date(batch.expiryDate).toLocaleDateString("es-HN")}`}
                      </Text>
                      {batch.warehouse && (
                        <Text style={[s.batchDate, { flex: 1 }]}>{batch.warehouse.name}</Text>
                      )}
                      <Text style={s.batchQty}>{batch.currentQty} {product.unit ?? ""}</Text>
                    </View>
                  );
                })}
              </React.Fragment>
            );
          })}
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
