import { CheckCircle } from "lucide-react";
import { APP_URL } from "@/lib/constants";

const TYPES = [
  {
    tag: "CLÍNICA EMPRESARIAL",
    title: "Para la salud de tu fuerza laboral.",
    desc: "Diseñado para clínicas integradas en empresas, maquilas e industrias que brindan atención médica a sus empleados y cotizan al seguro social.",
    perks: [
      "Reportes de atención por empleado",
      "Dispensación de seguro social integrada",
      "Control de medicamentos permanentes",
      "Expedientes por número de empleado",
      "Estadísticas de ausentismo y salud laboral",
    ],
    accent: "#5683d2",
    topBorder: "#5683d2",
    cardBg: "#ffffff",
    border: "rgba(0,0,0,0.08)",
  },
  {
    tag: "CLÍNICA PRIVADA",
    title: "Atención privada con gestión profesional.",
    desc: "Para consultorios y clínicas privadas que atienden pacientes particulares y requieren un sistema completo de expedientes, citas y farmacia.",
    perks: [
      "Agenda de citas con recordatorios",
      "Expedientes SOAP completos",
      "Farmacia propia con inventario",
      "Recetas digitales en PDF",
      "Reportes de ingresos y facturación",
    ],
    accent: "#00d638",
    topBorder: "#00d638",
    cardBg: "#ffffff",
    border: "rgba(0,0,0,0.08)",
  },
];

export function ClinicTypes() {
  return (
    <section id="clinics" className="py-32" style={{ background: "#f4f2f0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 items-end mb-16">
          <div className="animate-in">
            <p style={{ fontSize: "13px", fontWeight: 400, color: "#5683d2", marginBottom: "12px", letterSpacing: "0.04em" }}>
              2 TIPOS DE CLÍNICA
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 500,
                lineHeight: 1.14,
                color: "#0c0a08",
              }}
            >
              Hecho a la medida de tu tipo de clínica.
            </h2>
          </div>
          <p className="animate-in" style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.38, color: "#4d505d", transitionDelay: "100ms" }}>
            Al registrarte eliges el tipo de clínica. El sistema se adapta a tu flujo de trabajo desde el primer día.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {TYPES.map((t, i) => (
            <div
              key={t.tag}
              className="animate-in"
              style={{
                background: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
                borderTop: `3px solid ${t.topBorder}`,
                padding: "32px",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  color: t.accent,
                  marginBottom: "20px",
                }}
              >
                {t.tag}
              </p>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 500,
                  lineHeight: 1.33,
                  color: "#0c0a08",
                  marginBottom: "12px",
                }}
              >
                {t.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: "#4d505d",
                  marginBottom: "24px",
                }}
              >
                {t.desc}
              </p>

              <ul className="flex flex-col gap-2.5 mb-8">
                {t.perks.map(p => (
                  <li key={p} className="flex items-start gap-2.5">
                    <CheckCircle style={{ width: 14, height: 14, color: t.accent, marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 400, color: "#0c0a08" }}>{p}</span>
                  </li>
                ))}
              </ul>

              <a
                href={`${APP_URL}/register`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: t.accent,
                  textDecoration: "none",
                }}
              >
                Comenzar con este tipo →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
