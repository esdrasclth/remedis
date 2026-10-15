import {
  FileText, Pill, Package, Calendar, Receipt, BarChart2,
  ShoppingCart, Users, Building2, Stethoscope, Shield,
} from "lucide-react";

const MODULES = [
  { icon: FileText, title: "Expedientes SOAP", desc: "Historial clínico digital con notas SOAP, diagnósticos CIE-10 y evolución del paciente." },
  { icon: Stethoscope, title: "Consultas médicas", desc: "Registro de consultas, signos vitales, alergias y antecedentes en un solo flujo." },
  { icon: Receipt, title: "Recetas digitales", desc: "Genera y envía recetas en PDF firmadas. Medicamentos permanentes para ciclos crónicos." },
  { icon: Pill, title: "Farmacia y dispensación", desc: "Control de entregas por receta. Historial de dispensación por paciente y médico." },
  { icon: Package, title: "Inventario con lotes", desc: "Gestión FEFO, alertas de stock crítico, vencimientos y trazabilidad de lotes." },
  { icon: Calendar, title: "Citas médicas", desc: "Agenda por médico con disponibilidad en tiempo real y notificaciones automáticas." },
  { icon: ShoppingCart, title: "Órdenes de compra", desc: "Solicitudes a proveedores, recepciones parciales y conciliación de inventario." },
  { icon: BarChart2, title: "Reportes financieros", desc: "Ingresos, consumo farmacéutico, costos por lote y exportación a Excel o PDF." },
  { icon: Users, title: "Gestión de usuarios", desc: "Roles y permisos granulares: médicos, enfermeras, farmacéuticos y administradores." },
  { icon: Building2, title: "Multi-almacén", desc: "Controla múltiples bodegas o sucursales desde un solo panel centralizado." },
  { icon: Shield, title: "Integración Seguro Social", desc: "Reporte automático al seguro social de atenciones y medicamentos dispensados. Incluida en todos los planes." },
];

export function Features() {
  return (
    <section id="features" className="py-32" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 items-end mb-16">
          <div className="animate-in">
            <p style={{ fontSize: "13px", fontWeight: 400, color: "#5683d2", marginBottom: "12px", letterSpacing: "0.04em" }}>
              11 MÓDULOS INTEGRADOS
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 500,
                lineHeight: 1.14,
                color: "#0c0a08",
              }}
            >
              Todo lo que tu clínica necesita, en un solo sistema.
            </h2>
          </div>
          <p className="animate-in" style={{ fontSize: "18px", fontWeight: 400, lineHeight: 1.38, color: "#4d505d", transitionDelay: "100ms" }}>
            Sin integraciones de terceros. Sin módulos adicionales. Sin sorpresas en la factura.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            const isIHSS = i === MODULES.length - 1;
            return (
              <div
                key={m.title}
                className="animate-in"
                style={{
                  background: isIHSS ? "#0b0d1b" : "#f4f2f0",
                  border: isIHSS ? "1px solid rgba(228,242,34,0.2)" : "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "12px",
                  padding: "24px",
                  transitionDelay: `${i * 55}ms`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    background: isIHSS ? "rgba(228,242,34,0.12)" : "rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Icon
                    style={{ width: 16, height: 16, color: isIHSS ? "#e4f222" : "#4d505d" }}
                    strokeWidth={1.5}
                  />
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isIHSS ? "#ffffff" : "#0c0a08",
                    marginBottom: "8px",
                  }}
                >
                  {m.title}
                  {isIHSS && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "#e4f222",
                        background: "rgba(228,242,34,0.10)",
                        border: "1px solid rgba(228,242,34,0.20)",
                        borderRadius: "4px",
                        padding: "1px 6px",
                        verticalAlign: "middle",
                      }}
                    >
                      Incluida
                    </span>
                  )}
                </p>
                <p style={{ fontSize: "13px", fontWeight: 400, lineHeight: 1.5, color: isIHSS ? "#999ba3" : "#4d505d" }}>
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
