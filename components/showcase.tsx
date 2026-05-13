"use client";

import { useState } from "react";
import { FileText, Pill, Package, BarChart2, CheckCircle, ChevronRight } from "lucide-react";

const TABS = [
  {
    id: "expediente",
    icon: FileText,
    label: "Expediente SOAP",
    desc: "Historial clínico completo con diagnósticos CIE-10, antecedentes, alergias y evolución del paciente en un solo flujo.",
    features: [
      "Notas SOAP estructuradas",
      "Diagnósticos CIE-10",
      "Antecedentes y alergias",
      "Historial de consultas",
      "Medicamentos permanentes",
    ],
  },
  {
    id: "farmacia",
    icon: Pill,
    label: "Dispensación",
    desc: "Control total de entregas de medicamentos por receta, con trazabilidad completa por paciente, médico y lote.",
    features: [
      "Dispensación por receta",
      "Control por lote y vencimiento",
      "Historial por paciente",
      "Integración con seguro social",
      "Alertas de stock crítico",
    ],
  },
  {
    id: "inventario",
    icon: Package,
    label: "Inventario",
    desc: "Gestión FEFO con alertas automáticas de vencimiento y stock mínimo para mantener tu farmacia siempre abastecida.",
    features: [
      "Gestión por lotes (FEFO)",
      "Alertas de vencimiento",
      "Stock mínimo configurable",
      "Kardex de movimientos",
      "Órdenes de compra integradas",
    ],
  },
  {
    id: "reportes",
    icon: BarChart2,
    label: "Reportes",
    desc: "Métricas en tiempo real de atenciones, consumo farmacéutico y rendimiento por médico. Exporta a Excel o PDF.",
    features: [
      "Consultas y atenciones",
      "Consumo farmacéutico",
      "Exportación a Excel y PDF",
      "Estadísticas por médico",
      "Costos por lote y producto",
    ],
  },
];

function SoapMockup() {
  return (
    <div style={{ padding: "20px", minHeight: "380px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#1a1919", borderRadius: "8px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#2a2825", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "12px", color: "#999ba3", fontWeight: 500 }}>CM</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#fff", marginBottom: "2px" }}>Carlos Maradiaga</p>
          <p style={{ fontSize: "11px", color: "#4d505d" }}>34 años · Empleado #2847 · Dr. Ramos</p>
        </div>
        <span style={{ fontSize: "10px", fontWeight: 500, color: "#00d638", background: "rgba(0,214,56,0.1)", border: "1px solid rgba(0,214,56,0.2)", borderRadius: "4px", padding: "2px 8px", whiteSpace: "nowrap" }}>
          Consulta activa
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        {[
          { label: "S", title: "Subjetivo", content: "Cefalea frontal 7/10.\nInicio hace 2 días.\nPeor con el ruido." },
          { label: "O", title: "Objetivo", content: "FC 78 · PA 120/80\nTemp 36.8°C\nPeso 72kg" },
          { label: "A", title: "Análisis", content: "Cefalea tensional G44.2\nHTA estadio 1" },
          { label: "P", title: "Plan", content: "Ibuprofeno 400mg c/8h\nControl en 7 días\nReposo relativo" },
        ].map((box) => (
          <div key={box.label} style={{ background: "#1a1919", borderRadius: "8px", padding: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{ width: 18, height: 18, borderRadius: "4px", background: "rgba(228,242,34,0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600, color: "#e4f222", flexShrink: 0 }}>
                {box.label}
              </span>
              <span style={{ fontSize: "11px", color: "#4d505d", fontWeight: 500 }}>{box.title}</span>
            </div>
            <p style={{ fontSize: "11px", color: "#999ba3", lineHeight: 1.55, whiteSpace: "pre-line" }}>{box.content}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1, height: 32, background: "#e4f222", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#0c0a08" }}>Guardar consulta</span>
        </div>
        <div style={{ height: 32, padding: "0 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#999ba3" }}>Generar receta</span>
        </div>
      </div>
    </div>
  );
}

function DispensacionMockup() {
  return (
    <div style={{ padding: "20px", minHeight: "380px" }}>
      <div style={{ padding: "12px 16px", background: "#1a1919", borderRadius: "8px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>Receta #00234</span>
          <span style={{ fontSize: "10px", color: "#5683d2", background: "rgba(86,131,210,0.1)", border: "1px solid rgba(86,131,210,0.2)", borderRadius: "4px", padding: "2px 8px" }}>En proceso</span>
        </div>
        <span style={{ fontSize: "11px", color: "#4d505d" }}>Carlos Maradiaga · Dr. Ramos · 11 mayo 2025</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 44px 86px", gap: "8px", padding: "0 8px", marginBottom: "6px" }}>
        {["Medicamento", "Dosis", "Cant", "Estado"].map((h) => (
          <span key={h} style={{ fontSize: "10px", color: "#4d505d", fontWeight: 500, letterSpacing: "0.04em" }}>{h.toUpperCase()}</span>
        ))}
      </div>

      {[
        { med: "Ibuprofeno 400mg", dosis: "c/8h × 5d", cant: "15", status: "Dispensado", color: "#00d638" },
        { med: "Loratadina 10mg", dosis: "c/24h", cant: "7", status: "Pendiente", color: "#ff492c" },
        { med: "Omeprazol 20mg", dosis: "c/12h", cant: "10", status: "Dispensado", color: "#00d638" },
      ].map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 72px 44px 86px", gap: "8px", padding: "10px 8px", background: "#1a1919", borderRadius: "6px", marginBottom: "4px", border: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#fff" }}>{row.med}</span>
          <span style={{ fontSize: "11px", color: "#4d505d" }}>{row.dosis}</span>
          <span style={{ fontSize: "12px", color: "#999ba3", textAlign: "center" }}>{row.cant}</span>
          <span style={{ fontSize: "10px", color: row.color, background: `${row.color}18`, border: `1px solid ${row.color}35`, borderRadius: "4px", padding: "2px 6px", textAlign: "center" }}>
            {row.status}
          </span>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", padding: "10px 12px", background: "rgba(228,242,34,0.05)", borderRadius: "6px", border: "1px solid rgba(228,242,34,0.12)" }}>
        <span style={{ fontSize: "12px", color: "#999ba3" }}>2 de 3 dispensados</span>
        <div style={{ height: 28, padding: "0 14px", background: "#e4f222", borderRadius: "4px", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "#0c0a08" }}>Dispensar pendientes</span>
        </div>
      </div>
    </div>
  );
}

function InventarioMockup() {
  return (
    <div style={{ padding: "20px", minHeight: "380px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#fff", marginBottom: "2px" }}>Inventario</p>
          <p style={{ fontSize: "11px", color: "#ff492c" }}>3 alertas activas</p>
        </div>
        <div style={{ height: 28, padding: "0 12px", background: "rgba(228,242,34,0.08)", border: "1px solid rgba(228,242,34,0.2)", borderRadius: "4px", display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#e4f222" }}>+ Nuevo ingreso</span>
        </div>
      </div>

      <div style={{ height: 32, background: "#1a1919", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "12px", display: "flex", alignItems: "center", padding: "0 12px" }}>
        <span style={{ fontSize: "12px", color: "#4d505d" }}>Buscar producto...</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 46px 76px", gap: "8px", padding: "0 8px", marginBottom: "6px" }}>
        {["Producto", "Lote", "Venc.", "Stock", "Estado"].map((h) => (
          <span key={h} style={{ fontSize: "10px", color: "#4d505d", fontWeight: 500, letterSpacing: "0.04em" }}>{h.toUpperCase()}</span>
        ))}
      </div>

      {[
        { prod: "Ibuprofeno 400mg", lote: "L-2401", venc: "Feb/25", stock: "8", status: "Stock bajo", color: "#ff492c" },
        { prod: "Amoxicilina 500mg", lote: "L-2312", venc: "Dic/24", stock: "45", status: "Normal", color: "#00d638" },
        { prod: "Loratadina 10mg", lote: "L-2403", venc: "Mar/25", stock: "0", status: "Agotado", color: "#ff492c" },
        { prod: "Metformina 850mg", lote: "L-2402", venc: "Jun/25", stock: "120", status: "Normal", color: "#00d638" },
      ].map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 56px 70px 46px 76px", gap: "8px", padding: "9px 8px", background: "#1a1919", borderRadius: "6px", marginBottom: "4px", border: `1px solid ${row.status === "Normal" ? "rgba(255,255,255,0.04)" : `${row.color}20`}`, alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.prod}</span>
          <span style={{ fontSize: "10px", color: "#4d505d" }}>{row.lote}</span>
          <span style={{ fontSize: "10px", color: "#4d505d" }}>{row.venc}</span>
          <span style={{ fontSize: "12px", color: row.stock === "0" ? "#ff492c" : "#fff", fontWeight: 500, textAlign: "center" }}>{row.stock}</span>
          <span style={{ fontSize: "10px", color: row.color, background: `${row.color}15`, border: `1px solid ${row.color}30`, borderRadius: "4px", padding: "2px 4px", textAlign: "center" }}>
            {row.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportesMockup() {
  const bars = [35, 52, 48, 65, 58, 72, 45];
  return (
    <div style={{ padding: "20px", minHeight: "380px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>Reportes · Mayo 2025</p>
        <div style={{ height: 28, padding: "0 12px", background: "#1a1919", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", color: "#999ba3" }}>Exportar</span>
          <span style={{ fontSize: "9px", color: "#4d505d" }}>▾</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "14px" }}>
        {[
          { label: "Consultas", val: "247", color: "#5683d2" },
          { label: "Medicamentos", val: "1,842", color: "#00d638" },
          { label: "Médicos activos", val: "8", color: "#e4f222" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#1a1919", borderRadius: "8px", padding: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontSize: "10px", color: k.color, marginBottom: "4px" }}>{k.label}</p>
            <p style={{ fontSize: "20px", fontWeight: 500, color: "#fff", lineHeight: 1 }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#1a1919", borderRadius: "8px", padding: "14px", border: "1px solid rgba(255,255,255,0.04)", marginBottom: "10px" }}>
        <p style={{ fontSize: "11px", color: "#4d505d", marginBottom: "12px" }}>Consultas por semana</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "56px" }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "100%", height: `${h}%`, background: i === 5 ? "#e4f222" : "rgba(228,242,34,0.18)", borderRadius: "3px 3px 0 0", minHeight: "4px" }} />
              <span style={{ fontSize: "9px", color: "#4d505d" }}>S{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#1a1919", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: "11px", color: "#4d505d" }}>Top medicamentos dispensados</span>
        </div>
        {[
          { med: "Ibuprofeno 400mg", units: "384" },
          { med: "Metformina 850mg", units: "256" },
          { med: "Loratadina 10mg", units: "198" },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
            <span style={{ fontSize: "11px", color: "#fff" }}>{row.med}</span>
            <span style={{ fontSize: "11px", color: "#4d505d" }}>{row.units} unid.</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, React.ReactNode> = {
  expediente: <SoapMockup />,
  farmacia: <DispensacionMockup />,
  inventario: <InventarioMockup />,
  reportes: <ReportesMockup />,
};

export function Showcase() {
  const [active, setActive] = useState("expediente");
  const [fading, setFading] = useState(false);

  function handleTab(id: string) {
    if (id === active || fading) return;
    setFading(true);
    setTimeout(() => {
      setActive(id);
      setFading(false);
    }, 180);
  }

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <section
      id="demo"
      style={{
        background: "#0c0a08",
        padding: "128px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "300px", pointerEvents: "none",
          background: "radial-gradient(ellipse at top, rgba(228,242,34,0.07) 0%, transparent 70%)",
        }}
      />

      <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "0 24px", position: "relative" }}>
        <div className="animate-in" style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ fontSize: "13px", color: "#5683d2", letterSpacing: "0.04em", marginBottom: "12px" }}>
            VE EL SISTEMA EN ACCIÓN
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, lineHeight: 1.14,
              color: "#ffffff", maxWidth: "520px", margin: "0 auto",
            }}
          >
            Diseñado para el flujo real de tu clínica.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-12 items-start">
          <div className="animate-in" style={{ transitionDelay: "100ms" }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === active;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    marginBottom: "4px",
                    borderLeft: isActive ? "2px solid #e4f222" : "2px solid transparent",
                    background: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                    transition: "background 0.2s ease, border-color 0.2s ease",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: isActive ? "12px" : 0 }}>
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: "8px", flexShrink: 0,
                        background: isActive ? "rgba(228,242,34,0.1)" : "rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <Icon style={{ width: 15, height: 15, color: isActive ? "#e4f222" : "#4d505d" }} strokeWidth={1.5} />
                    </div>
                    <span
                      style={{
                        fontSize: "14px", fontWeight: isActive ? 500 : 400,
                        color: isActive ? "#ffffff" : "#999ba3",
                        transition: "color 0.2s ease",
                        flex: 1,
                      }}
                    >
                      {tab.label}
                    </span>
                    {!isActive && (
                      <ChevronRight style={{ width: 14, height: 14, color: "#4d505d", flexShrink: 0 }} />
                    )}
                  </div>

                  {isActive && (
                    <>
                      <p style={{ fontSize: "13px", color: "#999ba3", lineHeight: 1.6, marginBottom: "14px" }}>
                        {activeTab.desc}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {activeTab.features.map((f) => (
                          <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <CheckCircle style={{ width: 13, height: 13, color: "#e4f222", flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lg:sticky" style={{ top: "96px" }}>
            <div
              className="animate-in"
              style={{
                transitionDelay: "200ms",
              }}
            >
              <div
                style={{
                  opacity: fading ? 0 : 1,
                  transform: fading ? "translateY(6px)" : "translateY(0px)",
                  transition: "opacity 0.18s ease, transform 0.18s ease",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "rgba(18,16,14,0.95)",
                  animation: "floatY 5s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    background: "#1a1919",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,73,44,0.45)" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(228,242,34,0.45)" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(0,214,56,0.45)" }} />
                  </div>
                  <div
                    style={{
                      flex: 1, background: "#222120", borderRadius: "4px", height: "24px",
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 28px",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#4d505d", fontFamily: "monospace" }}>
                      miempresa.remedis.brandsofts.com
                    </span>
                  </div>
                </div>

                {MOCKUP_MAP[active]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
