"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { APP_URL } from "@/lib/constants";

const PLANS = [
  {
    key:      "BASIC",
    name:     "Basic",
    monthly:  699,
    annual:   7689,   // 699 × 11 — 1 mes gratis
    popular:  false,
    limits:   "2 médicos · 5 usuarios · 1 almacén",
    features: [
      "Expedientes médicos SOAP",
      "Recetas digitales con PDF",
      "Farmacia y dispensación",
      "Inventario con lotes y FEFO",
      "Citas médicas",
      "Alertas de stock y vencimientos",
      "Integración Seguro Social",
      "Soporte por email",
    ],
  },
  {
    key:      "PROFESSIONAL",
    name:     "Pro",
    monthly:  1299,
    annual:   14289,  // 1299 × 11 — 1 mes gratis
    popular:  true,
    limits:   "8 médicos · 20 usuarios · 5 almacenes",
    features: [
      "Todo lo incluido en Basic",
      "Reportes financieros avanzados",
      "Exportación PDF y Excel",
      "Órdenes de compra a proveedores",
      "Medicamentos permanentes (ciclos)",
      "Multi-almacén hasta 5 bodegas",
      "Soporte prioritario por email",
      "Acceso API (próximamente)",
    ],
  },
  {
    key:      "ENTERPRISE",
    name:     "Enterprise",
    monthly:  2499,
    annual:   27489,  // 2499 × 11 — 1 mes gratis
    popular:  false,
    limits:   "Médicos, usuarios y almacenes ilimitados",
    features: [
      "Todo lo incluido en Pro",
      "Usuarios y médicos ilimitados",
      "Pacientes y almacenes ilimitados",
      "Onboarding personalizado",
      "Capacitación para el equipo",
      "Soporte directo con el desarrollador",
      "Acceso anticipado a nuevas funciones",
      "Acuerdo de nivel de servicio (SLA)",
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-32" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="grid md:grid-cols-2 gap-8 items-end mb-12">
          <div>
            <p style={{ fontSize: "13px", fontWeight: 400, color: "#5683d2", marginBottom: "12px", letterSpacing: "0.04em" }}>
              PLANES Y PRECIOS
            </p>
            <h2
              style={{
                fontSize:   "clamp(32px, 5vw, 48px)",
                fontWeight: 500,
                lineHeight: 1.14,
                color:      "#0c0a08",
              }}
            >
              Precios claros. Sin letra pequeña.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.38, color: "#4d505d", marginBottom: "20px" }}>
              Prueba gratuita de 14 días. Sin tarjeta de crédito.
            </p>

            {/* Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAnnual(false)}
                style={{
                  fontSize:   "13px",
                  fontWeight: 400,
                  color:      !annual ? "#0c0a08" : "#999ba3",
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  padding:    0,
                  transition: "color 0.15s",
                }}
              >
                Mensual
              </button>

              <button
                onClick={() => setAnnual(v => !v)}
                aria-label="Cambiar a plan anual"
                style={{
                  width:        44,
                  height:       24,
                  borderRadius: "100px",
                  background:   annual ? "#0c0a08" : "rgba(0,0,0,0.12)",
                  border:       "none",
                  cursor:       "pointer",
                  position:     "relative",
                  transition:   "background 0.2s",
                  flexShrink:   0,
                }}
              >
                <span
                  style={{
                    position:     "absolute",
                    top:          3,
                    left:         annual ? 23 : 3,
                    width:        18,
                    height:       18,
                    borderRadius: "50%",
                    background:   "#ffffff",
                    boxShadow:    "0 1px 3px rgba(0,0,0,0.2)",
                    transition:   "left 0.2s",
                    display:      "block",
                  }}
                />
              </button>

              <button
                onClick={() => setAnnual(true)}
                style={{
                  fontSize:   "13px",
                  fontWeight: 400,
                  color:      annual ? "#0c0a08" : "#999ba3",
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  padding:    0,
                  transition: "color 0.15s",
                }}
              >
                Anual
              </button>

              <span
                style={{
                  fontSize:     "11px",
                  fontWeight:   500,
                  color:        annual ? "#0c0a08" : "#999ba3",
                  background:   annual ? "#e4f222" : "rgba(0,0,0,0.06)",
                  border:       "none",
                  borderRadius: "4px",
                  padding:      "2px 8px",
                  transition:   "all 0.2s",
                }}
              >
                1 mes gratis
              </span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const price = annual ? Math.round(p.annual / 12) : p.monthly;
            const saved = p.monthly * 12 - p.annual;

            return (
              <div
                key={p.key}
                style={{
                  background:   p.popular ? "#0c0a08" : "#f4f2f0",
                  border:       p.popular ? "none" : "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                  padding:      "28px 24px",
                  position:     "relative",
                }}
              >
                {p.popular && (
                  <div
                    style={{
                      position:      "absolute",
                      top:           -1,
                      left:          "50%",
                      transform:     "translateX(-50%)",
                      background:    "#e4f222",
                      color:         "#0c0a08",
                      fontSize:      "10px",
                      fontWeight:    500,
                      letterSpacing: "0.06em",
                      padding:       "3px 12px",
                      borderRadius:  "0 0 6px 6px",
                      whiteSpace:    "nowrap",
                    }}
                  >
                    MÁS POPULAR
                  </div>
                )}

                <div style={{ marginTop: p.popular ? "12px" : "0" }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: p.popular ? "#ffffff" : "#0c0a08", marginBottom: "4px" }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: "12px", fontWeight: 400, color: p.popular ? "#4d505d" : "#999ba3", marginBottom: "20px" }}>
                    {p.limits}
                  </p>

                  <div style={{ marginBottom: "24px" }}>
                    <span style={{ fontSize: "36px", fontWeight: 500, color: p.popular ? "#ffffff" : "#0c0a08", lineHeight: 1 }}>
                      L.&nbsp;{price.toLocaleString("es-HN")}
                    </span>
                    <p style={{ fontSize: "12px", fontWeight: 400, color: p.popular ? "#4d505d" : "#999ba3", marginTop: "4px" }}>
                      {annual ? "/mes · cobro anual" : "/mes"}
                    </p>
                    {annual && (
                      <p style={{ fontSize: "12px", fontWeight: 400, color: "#00d638", marginTop: "4px" }}>
                        Ahorras L.&nbsp;{saved.toLocaleString("es-HN")} al año
                      </p>
                    )}
                  </div>

                  <a
                    href={`${APP_URL}/register`}
                    style={{
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      gap:            "6px",
                      width:          "100%",
                      background:     p.popular ? "#e4f222" : "transparent",
                      color:          p.popular ? "#0c0a08" : "#0c0a08",
                      fontSize:       "14px",
                      fontWeight:     500,
                      borderRadius:   "4px",
                      padding:        "10px 20px",
                      border:         p.popular ? "none" : "1px solid rgba(0,0,0,0.15)",
                      textDecoration: "none",
                      marginBottom:   "24px",
                      boxShadow:      p.popular ? "rgba(255,255,255,0.6) 0px 0px 2px 0px inset" : "none",
                    }}
                  >
                    {p.popular && <Zap style={{ width: 14, height: 14 }} />}
                    Comenzar gratis — 14 días
                  </a>

                  <ul className="flex flex-col gap-2.5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <Check style={{ width: 13, height: 13, color: "#00d638", marginTop: "2px", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", fontWeight: 400, color: p.popular ? "#999ba3" : "#4d505d", lineHeight: 1.5 }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center mt-8" style={{ fontSize: "13px", fontWeight: 400, color: "#999ba3" }}>
          Todos los planes incluyen 14 días de prueba gratuita. El pago se activa una vez que decidas continuar.
        </p>
      </div>
    </section>
  );
}
