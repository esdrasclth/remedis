"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "¿Qué incluye el período de prueba de 14 días?",
    a: "Acceso completo a todos los módulos del plan que hayas seleccionado, sin restricciones. No necesitas tarjeta de crédito para comenzar. Al finalizar los 14 días, puedes contratar un plan o tu cuenta quedará pausada.",
  },
  {
    q: "¿Qué diferencia hay entre Clínica Empresarial y Clínica Privada?",
    a: "La Clínica Empresarial está diseñada para atender empleados de una empresa y gestionar reportes de seguro social, medicamentos cubiertos y estadísticas laborales. La Clínica Privada está orientada a pacientes particulares con agenda, cobros y recetas independientes.",
  },
  {
    q: "¿La integración con seguro social está incluida en todos los planes?",
    a: "Sí. La integración con seguro social está disponible en todos los planes, incluyendo el período de prueba. No hay costo adicional por activarla.",
  },
  {
    q: "¿Puedo migrar mis datos existentes al sistema?",
    a: "Sí. El plan Enterprise incluye onboarding personalizado con migración de datos. Para los planes Basic y Pro, podemos ayudarte con la importación mediante plantillas Excel durante las primeras semanas.",
  },
  {
    q: "¿El sistema funciona sin conexión a internet?",
    a: "Actualmente Remedis requiere conexión a internet para funcionar. Está alojado en servidores con alta disponibilidad para garantizar el acceso continuo.",
  },
  {
    q: "¿Cómo funciona el subdominio de mi clínica?",
    a: "Al registrarte, tu clínica recibe un subdominio único: miempresa.remedis.brandsofts.com. Todos tus usuarios acceden desde esa URL con sus propias credenciales.",
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Puedes solicitar un cambio de plan contactándonos directamente. Los cambios se aplican al siguiente ciclo de facturación o de forma inmediata según el caso.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Actualmente el pago se coordina directamente con el equipo de Remedis. Contacta a esdrasclth@brandsofts.com para conocer las opciones disponibles en tu país.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setOpen(prev => (prev === i ? null : i));
  }

  return (
    <section id="faq" className="py-32" style={{ background: "#f4f2f0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-16 lg:gap-24">
          <div>
            <p style={{ fontSize: "13px", fontWeight: 400, color: "#5683d2", marginBottom: "12px", letterSpacing: "0.04em" }}>
              PREGUNTAS FRECUENTES
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 500,
                lineHeight: 1.17,
                color: "#0c0a08",
                marginBottom: "16px",
              }}
            >
              ¿Tienes dudas?
            </h2>
            <p style={{ fontSize: "14px", fontWeight: 400, lineHeight: 1.6, color: "#4d505d", marginBottom: "24px" }}>
              Si no encuentras lo que buscas, escríbenos directamente.
            </p>
            <a
              href="mailto:esdrasclth@brandsofts.com"
              style={{ display: "inline-flex", fontSize: "13px", fontWeight: 500, color: "#5683d2", textDecoration: "none" }}
            >
              Contactar al equipo →
            </a>
          </div>

          <div>
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="w-full flex items-start justify-between gap-4 text-left"
                    style={{
                      padding: "20px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: isOpen ? "#0c0a08" : "#4d505d",
                        lineHeight: 1.5,
                        transition: "color 0.15s",
                      }}
                    >
                      {f.q}
                    </span>
                    <span style={{ flexShrink: 0, marginTop: "2px" }}>
                      {isOpen
                        ? <Minus style={{ width: 16, height: 16, color: "#0c0a08" }} />
                        : <Plus style={{ width: 16, height: 16, color: "#999ba3" }} />
                      }
                    </span>
                  </button>

                  {isOpen && (
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: 1.6,
                        color: "#4d505d",
                        paddingBottom: "20px",
                      }}
                    >
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
