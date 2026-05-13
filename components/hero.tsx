import { ArrowRight, CheckCircle } from "lucide-react";
import { APP_URL } from "@/lib/constants";

const STATS = [
  { value: "2", label: "Tipos de clínica" },
  { value: "11", label: "Módulos integrados" },
  { value: "SS", label: "Seguro Social incluido" },
  { value: "14d", label: "Prueba gratuita" },
];

const TRUST = [
  "Sin tarjeta de crédito",
  "Configuración en minutos",
  "Soporte en español",
];

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center pt-[62px] overflow-hidden"
      style={{
        backgroundImage: "url('/images/fondo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(12,10,8,0.82) 0%, rgba(11,13,27,0.70) 100%)" }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(12,10,8,0.6) 0%, transparent 100%)" }}
      />

      <div className="relative w-full max-w-6xl mx-auto px-6 py-24">
        <div
          className="inline-flex items-center gap-2 mb-8"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "4px",
            padding: "6px 14px",
            animation: "fadeInUp 0.5s ease both",
          }}
        >
          <span style={{ fontSize: "13px" }}>🌎</span>
          <span style={{ fontSize: "13px", fontWeight: 400, color: "#d2cecb" }}>
            Para clínicas que gestionan pacientes, farmacia y seguro social
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(40px, 6.5vw, 72px)",
            fontWeight: 500,
            lineHeight: 1.04,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            maxWidth: "840px",
            marginBottom: "24px",
            animation: "fadeInUp 0.6s 0.1s ease both",
          }}
        >
          Salud que se gestiona,{" "}
          <span style={{ color: "#e4f222" }}>vida que se cuida.</span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            fontWeight: 400,
            lineHeight: 1.38,
            color: "rgba(255,255,255,0.70)",
            maxWidth: "520px",
            marginBottom: "40px",
            animation: "fadeInUp 0.6s 0.2s ease both",
          }}
        >
          El sistema todo-en-uno para clínicas empresariales y privadas.
          Expedientes, farmacia, dispensación e integración con seguro social.
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-3 mb-8" style={{ animation: "fadeInUp 0.6s 0.3s ease both" }}>
          <a
            href={`${APP_URL}/register`}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              background: "#e4f222",
              color: "#0c0a08",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "4px",
              padding: "10px 20px",
              boxShadow: "rgba(255,255,255,0.6) 0px 0px 2px 0px inset",
              textDecoration: "none",
            }}
          >
            Comenzar gratis — 14 días
            <ArrowRight style={{ width: 16, height: 16 }} />
          </a>
          <a
            href="#features"
            className="flex items-center gap-2 transition-colors hover:text-white"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 400,
              borderRadius: "4px",
              padding: "10px 20px",
              border: "1px solid rgba(255,255,255,0.18)",
              textDecoration: "none",
            }}
          >
            Ver características
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-20" style={{ animation: "fadeIn 0.6s 0.4s ease both" }}>
          {TRUST.map(t => (
            <span key={t} className="flex items-center gap-1.5" style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
              <CheckCircle style={{ width: 14, height: 14, color: "#00d638", flexShrink: 0 }} />
              {t}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16" style={{ animation: "fadeInUp 0.6s 0.5s ease both" }}>
          {STATS.map(s => (
            <div
              key={s.label}
              style={{
                background: "rgba(11,13,27,0.70)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "12px",
                padding: "20px 24px",
                backdropFilter: "blur(12px)",
              }}
            >
              <p style={{ fontSize: "28px", fontWeight: 500, color: "#e4f222", lineHeight: 1, marginBottom: "6px" }}>
                {s.value}
              </p>
              <p style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            overflow: "hidden",
            background: "rgba(20,18,16,0.85)",
            backdropFilter: "blur(16px)",
            animation: "fadeInUp 0.7s 0.6s ease both, floatY 5s 1.5s ease-in-out infinite",
          }}
        >
          <div
            style={{
              background: "rgba(26,25,25,0.95)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div className="flex gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,73,44,0.5)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(228,242,34,0.5)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(0,214,56,0.5)" }} />
            </div>
            <div
              className="flex-1 mx-8 flex items-center justify-center"
              style={{ background: "#222120", borderRadius: "4px", height: "24px" }}
            >
              <span style={{ fontSize: "11px", color: "#4d505d", fontFamily: "monospace" }}>
                miempresa.remedis.brandsofts.com
              </span>
            </div>
          </div>

          <div className="flex" style={{ minHeight: "340px" }}>
            <div
              className="hidden sm:flex flex-col"
              style={{ width: "176px", background: "#0e0d0b", borderRight: "1px solid rgba(255,255,255,0.04)", padding: "12px" }}
            >
              <div className="flex items-center gap-2 mb-5 px-1 py-2">
                <div style={{ width: 22, height: 22, borderRadius: "3px", background: "#e4f222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 500, color: "#0c0a08" }}>R</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#ffffff" }}>Mi Clínica</span>
              </div>
              {["Dashboard", "Pacientes", "Citas", "Consultas", "Recetas", "Farmacia", "Inventario", "Reportes"].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-2 mb-0.5"
                  style={{
                    padding: "6px 8px",
                    borderRadius: "4px",
                    background: i === 0 ? "#0b0d1b" : "transparent",
                    color: i === 0 ? "#e4f222" : "#4d505d",
                    fontSize: "11px",
                    fontWeight: i === 0 ? 500 : 400,
                  }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: i === 0 ? "#e4f222" : "#2a2825" }} />
                  {item}
                </div>
              ))}
            </div>

            <div style={{ flex: 1, padding: "20px", overflow: "hidden" }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div style={{ height: 14, width: 140, background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: 6 }} />
                  <div style={{ height: 11, width: 100, background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
                </div>
                <div style={{ height: 32, width: 110, background: "rgba(228,242,34,0.12)", borderRadius: "4px", border: "1px solid rgba(228,242,34,0.2)" }} />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Citas hoy", val: "12", accent: "#5683d2" },
                  { label: "Stock crítico", val: "3", accent: "#ff492c" },
                  { label: "Recetas activas", val: "8", accent: "#00d638" },
                ].map(k => (
                  <div key={k.label} style={{ background: "#1a1919", borderRadius: "12px", padding: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "10px", color: k.accent, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: "24px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>{k.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#1a1919", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <div style={{ background: "#222120", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "8px 12px" }}>
                  <div style={{ height: 10, width: 90, background: "rgba(255,255,255,0.08)", borderRadius: "4px" }} />
                </div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2a2825" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 10, width: 120, background: "rgba(255,255,255,0.08)", borderRadius: "4px", marginBottom: 4 }} />
                      <div style={{ height: 8, width: 80, background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
                    </div>
                    <div style={{ height: 20, width: 60, background: "rgba(228,242,34,0.08)", borderRadius: "4px", border: "1px solid rgba(228,242,34,0.15)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
