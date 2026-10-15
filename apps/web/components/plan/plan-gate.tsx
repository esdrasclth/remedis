"use client";

import { ShieldOff, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { UpgradeModal } from "./upgrade-modal";
import type { PlanStatus } from "@/lib/actions/plan";

interface Props {
  status:     PlanStatus;
  tenantId:   string;
  tenantName: string;
  userName:   string;
  userEmail:  string;
}

const MESSAGES: Partial<Record<PlanStatus["type"], { title: string; body: string }>> = {
  trial_expired: {
    title: "Tu período de prueba ha expirado",
    body:  "Los 14 días de prueba gratuita han concluido. Adquiere un plan para continuar usando Remedis sin interrupciones.",
  },
  plan_expired: {
    title: "Tu plan ha vencido",
    body:  "Tu suscripción ha expirado. Renueva tu plan para recuperar el acceso completo al sistema.",
  },
  suspended: {
    title: "Cuenta suspendida",
    body:  "Esta cuenta ha sido suspendida. Por favor contacta al administrador del sistema para más información.",
  },
};

export function PlanGate({ status, tenantId, tenantName, userName, userEmail }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isSuspended = status.type === "suspended";
  const info = MESSAGES[status.type];
  if (!info) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(14,12,10,0.92)" }}>
        <div className="max-w-md w-full bg-[#1a1917] rounded-[16px] border border-white/[0.08] p-8 text-center space-y-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
            isSuspended ? "bg-blaze-orange/10" : "bg-sunbeam-yellow/10"
          }`}>
            {isSuspended
              ? <ShieldOff className="w-7 h-7 text-blaze-orange" />
              : <AlertTriangle className="w-7 h-7 text-sunbeam-yellow" />}
          </div>

          <div>
            <h2 className="text-[18px] font-medium text-pure-white">{info.title}</h2>
            <p className="text-[13px] text-slate-gray mt-2 leading-relaxed">{info.body}</p>
          </div>

          {!isSuspended && (
            <div className="space-y-3 pt-1">
              <button
                onClick={() => setShowUpgrade(true)}
                className="w-full bg-sunbeam-yellow text-charcoal-black font-medium text-[14px] py-3 rounded-[10px] hover:bg-sunbeam-yellow/90 transition-colors"
              >
                Ver planes y adquirir
              </button>
              <a
                href="mailto:esdrasclth@brandsofts.com"
                className="block text-[12px] text-iron-gray hover:text-slate-gray transition-colors"
              >
                ¿Tienes preguntas? Contáctanos
              </a>
            </div>
          )}

          {isSuspended && (
            <a
              href="mailto:esdrasclth@brandsofts.com"
              className="inline-block text-[13px] text-slate-gray hover:text-pure-white transition-colors border border-white/[0.12] rounded-[10px] px-5 py-2.5"
            >
              Contactar soporte
            </a>
          )}
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          tenantId={tenantId}
          tenantName={tenantName}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setShowUpgrade(false)}
          closable
        />
      )}
    </>
  );
}
