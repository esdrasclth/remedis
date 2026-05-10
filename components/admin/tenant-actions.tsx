"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTenantPlan, updateTenantStatus, deleteTenant } from "@/lib/actions/admin";

interface Props {
  tenantId:     string;
  currentPlan:  string;
  currentStatus: string;
}

const PLANS    = ["BASIC", "PROFESSIONAL", "ENTERPRISE"] as const;
const PLAN_LABEL: Record<string, string> = { BASIC: "Básico", PROFESSIONAL: "Profesional", ENTERPRISE: "Enterprise" };

export function TenantActions({ tenantId, currentPlan, currentStatus }: Props) {
  const router  = useRouter();
  const [plan,   setPlan]   = useState(currentPlan);
  const [status, setStatus] = useState(currentStatus);
  const [busy,   setBusy]   = useState<string | null>(null);
  const [error,  setError]  = useState("");

  async function handlePlanChange(newPlan: string) {
    if (newPlan === plan) return;
    setBusy("plan"); setError("");
    const res = await updateTenantPlan(tenantId, newPlan);
    if (res.success) { setPlan(newPlan); router.refresh(); }
    else setError(res.error);
    setBusy(null);
  }

  async function handleStatusToggle() {
    const newStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setBusy("status"); setError("");
    const res = await updateTenantStatus(tenantId, newStatus);
    if (res.success) { setStatus(newStatus); router.refresh(); }
    else setError(res.error);
    setBusy(null);
  }

  async function handleDelete() {
    const confirmed = confirm(
      "¿Eliminar este tenant permanentemente?\n\nEsta acción eliminará todos los datos asociados y no se puede deshacer."
    );
    if (!confirmed) return;
    const doubleConfirm = confirm("¿Estás seguro? Esta acción es IRREVERSIBLE.");
    if (!doubleConfirm) return;

    setBusy("delete"); setError("");
    const res = await deleteTenant(tenantId);
    if (res.success) router.push("/admin/tenants");
    else { setError(res.error); setBusy(null); }
  }

  return (
    <div className="space-y-4">
      {/* Plan selector */}
      <div>
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-2">Plan</label>
        <div className="relative">
          <select
            value={plan}
            disabled={!!busy}
            onChange={e => handlePlanChange(e.target.value)}
            className="w-full appearance-none bg-[#2a2825] border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white pr-8 focus:outline-none focus:border-iron-gray disabled:opacity-50 cursor-pointer"
          >
            {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray pointer-events-none" />
        </div>
        {busy === "plan" && <p className="text-[11px] text-iron-gray mt-1">Actualizando plan…</p>}
      </div>

      {/* Status toggle */}
      <div className="pt-3 border-t border-white/[0.06]">
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-2">Estado</label>
        <Button
          variant={status === "ACTIVE" ? "ghost" : "primary"}
          size="sm"
          disabled={!!busy}
          onClick={handleStatusToggle}
          className="w-full"
        >
          {busy === "status"
            ? "Actualizando…"
            : status === "ACTIVE"
            ? "Suspender tenant"
            : "Activar tenant"}
        </Button>
        <p className="text-[11px] text-iron-gray mt-1.5">
          {status === "ACTIVE"
            ? "Suspender bloqueará el acceso de todos los usuarios."
            : "Reactivar restaurará el acceso completo."}
        </p>
      </div>

      {/* Delete */}
      <div className="pt-3 border-t border-white/[0.06]">
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-2">Zona de peligro</label>
        <Button
          variant="danger"
          size="sm"
          disabled={!!busy}
          onClick={handleDelete}
          className="w-full"
        >
          {busy === "delete" ? "Eliminando…" : "Eliminar tenant"}
        </Button>
        <p className="text-[11px] text-iron-gray mt-1.5">
          Elimina permanentemente el tenant y todos sus datos.
        </p>
      </div>

      {error && <p className="text-[12px] text-blaze-orange">{error}</p>}
    </div>
  );
}
