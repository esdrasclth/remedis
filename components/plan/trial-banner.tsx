"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";

interface Props {
  type:       "trial_active" | "plan_expiring";
  daysLeft:   number;
  tenantId:   string;
  tenantName: string;
  userName:   string;
  userEmail:  string;
}

export function TrialBanner({ type, daysLeft, tenantId, tenantName, userName, userEmail }: Props) {
  const [dismissed,    setDismissed]    = useState(false);
  const [showUpgrade,  setShowUpgrade]  = useState(false);

  if (dismissed) return null;

  const urgent = daysLeft <= 3;
  const message = type === "trial_active"
    ? `Tu período de prueba vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`
    : `Tu plan vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`;

  return (
    <>
      <div className={`flex items-center justify-between px-5 py-2.5 text-[13px] shrink-0 ${
        urgent ? "bg-blaze-orange/10 text-blaze-orange" : "bg-sunbeam-yellow/10 text-sunbeam-yellow"
      }`}>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{message}.</span>
          <button
            onClick={() => setShowUpgrade(true)}
            className={`underline font-medium hover:no-underline ${urgent ? "text-blaze-orange" : "text-sunbeam-yellow"}`}
          >
            Adquirir plan ahora
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-60 hover:opacity-100 transition-opacity ml-4 shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
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
