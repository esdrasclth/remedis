"use client";

import { useState } from "react";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLANS, PLAN_ORDER, formatPrice, annualMonthlyEquiv, annualDiscountPct } from "@/lib/plans";
import type { PlanKey } from "@/lib/plans";
import { submitPlanRequest } from "@/lib/actions/plan";

interface Props {
  tenantId:     string;
  tenantName:   string;
  userName:     string;
  userEmail:    string;
  onClose?:     () => void;
  closable?:    boolean;
}

type Step = "plans" | "form" | "success";
type Billing = "monthly" | "annual";

export function UpgradeModal({ tenantId, tenantName, userName, userEmail, onClose, closable = true }: Props) {
  const [billing,     setBilling]     = useState<Billing>("annual");
  const [selectedKey, setSelectedKey] = useState<PlanKey | null>(null);
  const [step,        setStep]        = useState<Step>("plans");
  const [name,        setName]        = useState(userName);
  const [email,       setEmail]       = useState(userEmail);
  const [message,     setMessage]     = useState("");
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKey) return;
    setBusy(true); setError("");

    const res = await submitPlanRequest(tenantId, {
      planKey:      selectedKey,
      billing,
      contactName:  name,
      contactEmail: email,
      message:      message || undefined,
    });

    if (res.success) setStep("success");
    else setError(res.error);
    setBusy(false);
  }

  function selectAndContinue(key: PlanKey) {
    setSelectedKey(key);
    setStep("form");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1917] rounded-[16px] shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-4 bg-[#1a1917] border-b border-white/[0.06]">
          <div>
            <h2 className="text-[18px] font-medium text-pure-white">
              {step === "success" ? "¡Solicitud enviada!" : "Adquirir un plan"}
            </h2>
            <p className="text-[12px] text-slate-gray mt-0.5">
              {step === "plans" && "Elige el plan que mejor se adapta a tu clínica"}
              {step === "form"  && `Plan ${PLANS[selectedKey!].name} · ${billing === "annual" ? "Anual" : "Mensual"}`}
              {step === "success" && "Te contactaremos a la brevedad para confirmar el plan"}
            </p>
          </div>
          {closable && onClose && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-iron-gray hover:text-pure-white hover:bg-ash-gray transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* ── Step: Plans ── */}
          {step === "plans" && (
            <div className="space-y-6">
              {/* Billing toggle */}
              <div className="flex justify-center">
                <div className="flex bg-ash-gray p-1 rounded-[10px] gap-1">
                  {(["monthly", "annual"] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setBilling(b)}
                      className={`px-5 py-2 rounded-[8px] text-[13px] transition-colors ${
                        billing === b
                          ? "bg-sunbeam-yellow text-charcoal-black font-medium"
                          : "text-slate-gray hover:text-pure-white"
                      }`}
                    >
                      {b === "monthly" ? "Mensual" : "Anual"}
                      {b === "annual" && (
                        <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          billing === "annual" ? "bg-deep-space-black/20 text-charcoal-black" : "bg-sunbeam-yellow/20 text-sunbeam-yellow"
                        }`}>
                          2 meses gratis
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-3 gap-4">
                {PLAN_ORDER.map(key => {
                  const plan = PLANS[key];
                  const price = billing === "annual" ? annualMonthlyEquiv(plan) : plan.monthlyPrice;
                  const savingsPct = annualDiscountPct(plan);
                  return (
                    <div
                      key={key}
                      className={`relative rounded-[14px] border p-5 flex flex-col gap-4 transition-colors ${
                        plan.popular
                          ? "border-sunbeam-yellow/60 bg-sunbeam-yellow/[0.04]"
                          : "border-white/[0.08] bg-ash-gray"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="flex items-center gap-1 bg-sunbeam-yellow text-charcoal-black text-[10px] font-bold px-3 py-1 rounded-full">
                            <Zap className="w-3 h-3" /> MÁS POPULAR
                          </span>
                        </div>
                      )}

                      <div>
                        <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">{plan.name}</p>
                        <div className="flex items-end gap-1 mt-2">
                          <span className="text-[28px] font-bold text-pure-white leading-none">{formatPrice(price)}</span>
                          <span className="text-[12px] text-slate-gray pb-0.5">/mes</span>
                        </div>
                        {billing === "annual" && (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-[11px] text-slate-gray">
                              {formatPrice(plan.annualPrice)}/año
                            </p>
                            <p className="text-[11px] text-emerald-400 font-medium">
                              Ahorra {formatPrice(plan.annualSavings)} ({savingsPct}% dto.)
                            </p>
                          </div>
                        )}
                      </div>

                      <ul className="space-y-2 flex-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2 text-[12px] text-slate-gray">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        size="sm"
                        variant={plan.popular ? "primary" : "ghost"}
                        className="w-full"
                        onClick={() => selectAndContinue(key)}
                      >
                        Elegir {plan.name}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-iron-gray">
                ¿Tienes preguntas? Escríbenos a{" "}
                <a href="mailto:esdrasclth@brandsofts.com" className="text-slate-gray hover:text-pure-white underline">
                  esdrasclth@brandsofts.com
                </a>
              </p>
            </div>
          )}

          {/* ── Step: Form ── */}
          {step === "form" && selectedKey && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="bg-ash-gray rounded-[10px] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-pure-white font-medium">
                    Plan {PLANS[selectedKey].name} · {billing === "annual" ? "Anual" : "Mensual"}
                  </p>
                  <p className="text-[12px] text-slate-gray">
                    {billing === "annual"
                      ? `${formatPrice(PLANS[selectedKey].annualPrice)}/año — ahorra ${formatPrice(PLANS[selectedKey].annualSavings)}`
                      : `${formatPrice(PLANS[selectedKey].monthlyPrice)}/mes`}
                  </p>
                </div>
                <button onClick={() => setStep("plans")} className="text-[12px] text-iron-gray hover:text-pure-white">
                  Cambiar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Tu nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email de contacto"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">
                    Mensaje adicional <span className="normal-case text-iron-gray">(opcional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Ej. Necesito factura, tengo preguntas sobre el plan..."
                    className="w-full bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white placeholder:text-iron-gray/60 resize-none focus:outline-none focus:border-iron-gray"
                  />
                </div>

                {error && <p className="text-[12px] text-blaze-orange">{error}</p>}

                <div className="pt-1">
                  <Button type="submit" size="md" className="w-full" disabled={busy}>
                    {busy ? "Enviando solicitud…" : "Enviar solicitud de plan"}
                  </Button>
                  <p className="text-[11px] text-iron-gray text-center mt-2">
                    Recibirás respuesta en menos de 24 horas hábiles
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === "success" && (
            <div className="max-w-sm mx-auto text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[16px] font-medium text-pure-white">¡Solicitud enviada!</h3>
                <p className="text-[13px] text-slate-gray mt-2 leading-relaxed">
                  Hemos recibido tu solicitud para el plan{" "}
                  <strong className="text-pure-white">{selectedKey ? PLANS[selectedKey].name : ""}</strong>.
                  Te contactaremos a <strong className="text-pure-white">{email}</strong> en las próximas 24 horas hábiles para coordinar el pago y la activación.
                </p>
              </div>
              {closable && onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
