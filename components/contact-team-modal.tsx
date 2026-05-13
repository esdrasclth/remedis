"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Mail, Phone, MessageSquare, Building2, User } from "lucide-react";
import { APP_URL } from "@/lib/constants";

type ContactTeamModalProps = {
  open: boolean;
  onClose: () => void;
};

const DEFAULT_CLINIC_TYPE = "Clínica privada";

export function ContactTeamModal({ open, onClose }: ContactTeamModalProps) {
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const [clinicType, setClinicType] = useState(DEFAULT_CLINIC_TYPE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (open) setClinicType(DEFAULT_CLINIC_TYPE);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const clinic = String(formData.get("clinic") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const message = String(formData.get("message") || "").trim();

    try {
      const response = await fetch("/api/contact-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          clinic: clinic || clinicType,
          message: `${message}\n\nEnviado desde: ${APP_URL}`,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "No se pudo enviar el mensaje.");
      }

      setFeedback({
        type: "success",
        message: "Tu mensaje fue enviado al equipo. Te contactarán pronto por correo.",
      });
      form.reset();
      setClinicType(DEFAULT_CLINIC_TYPE);
      window.setTimeout(onClose, 1100);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Ocurrió un error al enviar el mensaje.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 sm:px-6"
      onMouseDown={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-team-title"
        className="relative w-full max-w-5xl overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#0c0a08",
          boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(228,242,34,0.10) 0%, transparent 65%)",
          }}
        />

        <div className="relative grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              style={{ width: 36, height: 36 }}
              aria-label="Cerrar modal"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>

            <p style={{ fontSize: "13px", fontWeight: 400, color: "#5683d2", letterSpacing: "0.04em", marginBottom: "14px" }}>
              HABLA CON EL EQUIPO
            </p>
            <h2
              id="contact-team-title"
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 500,
                lineHeight: 1.08,
                color: "#ffffff",
                marginBottom: "16px",
              }}
            >
              Cuéntanos qué necesita tu clínica.
            </h2>
            <p style={{ fontSize: "15px", fontWeight: 400, lineHeight: 1.6, color: "#999ba3", marginBottom: "28px" }}>
              Te respondemos por correo con una propuesta clara para tu tipo de operación, sin compromiso.
            </p>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Building2,
                  title: "Ajustado a tu flujo",
                  text: "Te orientamos según si eres clínica privada o empresarial.",
                },
                {
                  icon: MessageSquare,
                  title: "Respuesta directa",
                  text: "Recibes el seguimiento del equipo sin pasos innecesarios.",
                },
                {
                  icon: Phone,
                  title: "Contacto humano",
                  text: "Si prefieres una llamada, lo indicamos en el mensaje.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3"
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        background: "rgba(228,242,34,0.08)",
                        border: "1px solid rgba(228,242,34,0.16)",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: 16, height: 16, color: "#e4f222" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#ffffff", marginBottom: "3px" }}>{item.title}</p>
                      <p style={{ fontSize: "12px", fontWeight: 400, color: "#999ba3", lineHeight: 1.5 }}>{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form className="p-8 sm:p-10 lg:p-12" onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 sm:col-span-1">
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#d2cecb" }}>Nombre</span>
                <div className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-3 focus-within:border-[#e4f222]/50">
                  <User style={{ width: 16, height: 16, color: "#999ba3", flexShrink: 0 }} />
                  <input
                    ref={firstFieldRef}
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    required
                    className="w-full bg-transparent outline-none text-white placeholder:text-[#4d505d]"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 sm:col-span-1">
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#d2cecb" }}>Correo</span>
                <div className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-3 focus-within:border-[#e4f222]/50">
                  <Mail style={{ width: 16, height: 16, color: "#999ba3", flexShrink: 0 }} />
                  <input
                    name="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    required
                    className="w-full bg-transparent outline-none text-white placeholder:text-[#4d505d]"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 sm:col-span-1">
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#d2cecb" }}>Tipo de clínica</span>
                <select
                  name="clinic"
                  value={clinicType}
                  onChange={(event) => setClinicType(event.target.value)}
                  className="rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-3 outline-none text-white focus:border-[#e4f222]/50"
                  style={{ fontSize: "14px" }}
                >
                  <option value="Clínica privada">Clínica privada</option>
                  <option value="Clínica empresarial">Clínica empresarial</option>
                  <option value="Consultorio">Consultorio</option>
                  <option value="Otra">Otra</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 sm:col-span-1">
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#d2cecb" }}>Teléfono</span>
                <div className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-3 focus-within:border-[#e4f222]/50">
                  <Phone style={{ width: 16, height: 16, color: "#999ba3", flexShrink: 0 }} />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+504 ..."
                    className="w-full bg-transparent outline-none text-white placeholder:text-[#4d505d]"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 sm:col-span-2">
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#d2cecb" }}>Mensaje</span>
                <div className="flex items-start gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-3 focus-within:border-[#e4f222]/50">
                  <MessageSquare style={{ width: 16, height: 16, color: "#999ba3", flexShrink: 0, marginTop: "2px" }} />
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Cuéntanos cuántos usuarios necesitas, si tu clínica es privada o empresarial y cualquier detalle importante."
                    required
                    className="w-full bg-transparent outline-none text-white placeholder:text-[#4d505d] resize-none"
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{
                  background: "#e4f222",
                  color: "#0c0a08",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "4px",
                  padding: "12px 20px",
                  textDecoration: "none",
                  boxShadow: "rgba(255,255,255,0.6) 0px 0px 2px 0px inset",
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? "wait" : "pointer",
                }}
              >
                {isSubmitting ? "Enviando..." : "Enviar consulta"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center transition-colors hover:text-white"
                style={{
                  background: "transparent",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 400,
                  borderRadius: "4px",
                  padding: "12px 20px",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Seguir explorando
              </button>
            </div>

            {feedback && (
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  marginTop: "10px",
                  color: feedback.type === "success" ? "#00d638" : "#ff492c",
                }}
              >
                {feedback.message}
              </p>
            )}
            <p style={{ fontSize: "12px", fontWeight: 400, color: "#4d505d", marginTop: "16px", lineHeight: 1.5 }}>
              {feedback ? "Puedes cerrar este modal o enviar otro mensaje." : "Al enviar, el mensaje llegará directamente a esdrasclth@brandsofts.com a través de Resend."}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
