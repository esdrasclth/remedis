import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { base, BRAND } from "./pdf-styles";

const TA_R = "right" as const;

const s = StyleSheet.create({
  col: {
    num:     { width: 24,  fontSize: 9 },
    name:    { flex: 1,    fontSize: 9 },
    rtn:     { width: 80,  fontSize: 9 },
    contact: { width: 90,  fontSize: 9 },
    phone:   { width: 80,  fontSize: 9 },
    orders:  { width: 44,  fontSize: 9, textAlign: TA_R },
  },
  orderRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#f0f4ff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
});

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador", ENVIADA: "Enviada", PARCIAL: "Parcial",
  RECIBIDA: "Recibida", CANCELADA: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  BORRADOR: "#6b7280", ENVIADA: "#d97706", PARCIAL: "#d97706",
  RECIBIDA: "#16a34a", CANCELADA: "#dc2626",
};

interface SuppliersPDFProps {
  tenantName: string;
  suppliers: Array<{
    id: string;
    name: string;
    rtn: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    purchaseOrders: Array<{
      id: string;
      status: string;
      orderDate: Date;
      items: Array<{
        requestedQty: number;
        receivedQty: number;
        unitCost: number | null;
        product: { genericName: string };
      }>;
    }>;
  }>;
}

export function SuppliersPDF({ tenantName, suppliers }: SuppliersPDFProps) {
  const totalOrders = suppliers.reduce((s, sup) => s + sup.purchaseOrders.length, 0);

  return (
    <Document title="Proveedores" author={tenantName} creator="Remedis">
      <Page size="A4" orientation="landscape" style={base.page}>
        {/* Header */}
        <View style={base.header}>
          <View style={base.headerLeft}>
            <Text style={base.tenantName}>{tenantName}</Text>
            <Text style={base.tenantSub}>Sistema de Gestión Médica · Remedis</Text>
          </View>
          <View style={base.headerRight}>
            <Text style={base.docTitle}>PROVEEDORES & COMPRAS</Text>
            <Text style={base.docMeta}>{suppliers.length} proveedores · {totalOrders} órdenes</Text>
            <Text style={base.docMeta}>
              Generado: {new Date().toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        {suppliers.map((supplier, idx) => (
          <View key={supplier.id} style={{ marginTop: idx === 0 ? 4 : 16 }} wrap={false}>
            {/* Supplier header */}
            <View style={{
              backgroundColor: BRAND.navy,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 4,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <View>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND.white }}>
                  {idx + 1}. {supplier.name}
                </Text>
                <Text style={{ fontSize: 8, color: "#93c5fd", marginTop: 1 }}>
                  {[supplier.rtn && `RTN: ${supplier.rtn}`, supplier.email].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {supplier.contact && (
                  <Text style={{ fontSize: 9, color: BRAND.white }}>{supplier.contact}</Text>
                )}
                {supplier.phone && (
                  <Text style={{ fontSize: 9, color: "#93c5fd" }}>{supplier.phone}</Text>
                )}
              </View>
            </View>

            {/* Orders */}
            {supplier.purchaseOrders.length === 0 ? (
              <Text style={{ fontSize: 9, color: BRAND.textMuted, paddingVertical: 6, paddingHorizontal: 12 }}>
                Sin órdenes de compra
              </Text>
            ) : (
              supplier.purchaseOrders.map((order, oidx) => {
                const orderTotal = order.items.reduce(
                  (s, item) => s + item.receivedQty * (item.unitCost ?? 0), 0
                );
                return (
                  <View key={order.id} style={[
                    s.orderRow,
                    oidx % 2 === 0 ? {} : { backgroundColor: BRAND.white },
                  ]} wrap={false}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND.text }}>
                          OC #{order.id.slice(-8).toUpperCase()}
                        </Text>
                        <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLOR[order.status]}20` }]}>
                          <Text style={{ fontSize: 8, color: STATUS_COLOR[order.status], fontFamily: "Helvetica-Bold" }}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 8, color: BRAND.textMuted }}>
                          {new Date(order.orderDate).toLocaleDateString("es-HN")}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 8, color: BRAND.textMuted, marginTop: 2 }}>
                        {order.items.map(i => `${i.product.genericName} (×${i.requestedQty})`).join(", ")}
                      </Text>
                    </View>
                    {orderTotal > 0 && (
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND.navy }}>
                        L {orderTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ))}

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
