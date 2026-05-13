"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { APP_URL } from "@/lib/constants";
import { ContactTeamModal } from "@/components/contact-team-modal";

export function CTA() {
  const [open, setOpen] = useState(false);

  return (
    <section className="py-32" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div
          style={{
            background:   "#0c0a08",
            borderRadius: "12px",
            padding:      "80px 40px",
            textAlign:    "center",
            position:     "relative",
            overflow:     "hidden",
          }}
        >
          {/* Subtle glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(228,242,34,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-[540px] mx-auto animate-in">
            <p style={{ fontSize: "13px", fontWeight: 400, color: "#5683d2", marginBottom: "16px", letterSpacing: "0.04em" }}>
              14 DÍAS GRATIS · SIN TARJETA
            </p>
            <h2
              style={{
                fontSize:     "clamp(32px, 5vw, 48px)",
                fontWeight:   500,
                lineHeight:   1.14,
                color:        "#ffffff",
                marginBottom: "16px",
              }}
            >
              Tu clínica merece un sistema a la altura.
            </h2>
            <p
              style={{
                fontSize:     "18px",
                fontWeight:   400,
                lineHeight:   1.38,
                color:        "#999ba3",
                marginBottom: "40px",
              }}
            >
              Comienza en minutos. Cancela en cualquier momento. Sin complicaciones.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`${APP_URL}/register`}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
                style={{
                  background:     "#e4f222",
                  color:          "#0c0a08",
                  fontSize:       "14px",
                  fontWeight:     500,
                  borderRadius:   "4px",
                  padding:        "10px 20px",
                  textDecoration: "none",
                  boxShadow:      "rgba(255,255,255,0.6) 0px 0px 2px 0px inset",
                }}
              >
                Comenzar gratis — 14 días
                <ArrowRight style={{ width: 16, height: 16 }} />
              </a>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 w-full sm:w-auto justify-center transition-colors hover:text-white"
                style={{
                  background:     "transparent",
                  color:          "#ffffff",
                  fontSize:       "14px",
                  fontWeight:     400,
                  borderRadius:   "4px",
                  padding:        "10px 20px",
                  border:         "1px solid rgba(255,255,255,0.12)",
                  textDecoration: "none",
                }}
                >
                Hablar con el equipo
              </button>
            </div>
          </div>
        </div>
      </div>
      <ContactTeamModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
