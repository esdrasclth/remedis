"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTenantPlan, updateTenantStatus, deleteTenant, updatePlanRequestStatus, updateTenantClinicType } from "@/lib/actions/admin";

interface PlanRequest {
  id:           string;
  planKey:      string;
  billing:      string;
  contactName:  string;
  contactEmail: string;
  message:      string | null;
  status:       string;
  createdAt:    Date;
}

interface Props {
  tenantId:          string;
  currentPlan:       string;
  currentStatus:     string;
  currentClinicType: string;
  trialEndsAt?:      Date | null;
  planExpiresAt?:    Date | null;
  planNotes?:        string | null;
  planRequests?:     PlanRequest[];
}

const PLANS = ["TRIAL", "BASIC", "PROFESSIONAL", "ENTERPRISE"] as const;
const PLAN_LABEL: Record<string, string> = {
  TRIAL: "Trial (14 días)", BASIC: "Básico", PROFESSIONAL: "Pro", ENTERPRISE: "Enterprise",
};

const REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", CONTACTED: "Contactado", CONVERTED: "Convertido", DISMISSED: "Descartado",
};
const REQUEST_STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:   <Clock className="w-3.5 h-3.5 text-sunbeam-yellow" />,
  CONTACTED: <MessageSquare className="w-3.5 h-3.5 text-blue-400" />,
  CONVERTED: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  DISMISSED: <XCircle className="w-3.5 h-3.5 text-iron-gray" />,
};

function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function TenantActions({
  tenantId, currentPlan, currentStatus, currentClinicType,
  trialEndsAt, planExpiresAt, planNotes: initialNotes,
  planRequests = [],
}: Props) {
  const router  = useRouter();
  const [plan,       setPlan]       = useState(currentPlan);
  const [status,     setStatus]     = useState(currentStatus);
  const [clinicType, setClinicType] = useState(currentClinicType);
  const [expiresAt,  setExpiresAt]  = useState(toInputDate(planExpiresAt));
  const [notes,      setNotes]      = useState(initialNotes ?? "");
  const [busy,       setBusy]       = useState<string | null>(null);
  const [error,      setError]      = useState("");
  const [ok,         setOk]         = useState(false);
  const [clinicOk,   setClinicOk]   = useState(false);
  const [requests,   setRequests]   = useState(planRequests);

  async function handleClinicTypeSave() {
    setBusy("clinicType"); setError(""); setClinicOk(false);
    const res = await updateTenantClinicType(tenantId, clinicType as "EMPRESA" | "PRIVADA");
    if (res.success) { setClinicOk(true); router.refresh(); }
    else setError(res.error);
    setBusy(null);
  }

  async function handlePlanSave() {
    setBusy("plan"); setError(""); setOk(false);
    const res = await updateTenantPlan(
      tenantId, plan,
      expiresAt || null,
      notes || null
    );
    if (res.success) { setOk(true); router.refresh(); }
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
    if (!confirm("¿Eliminar este tenant permanentemente?\n\nEsta acción eliminará todos los datos asociados y no se puede deshacer.")) return;
    if (!confirm("¿Estás seguro? Esta acción es IRREVERSIBLE.")) return;
    setBusy("delete"); setError("");
    const res = await deleteTenant(tenantId);
    if (res.success) router.push("/admin/tenants");
    else { setError(res.error); setBusy(null); }
  }

  async function handleRequestStatus(requestId: string, newStatus: string) {
    await updatePlanRequestStatus(requestId, newStatus);
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* ── Clinic Type ── */}
      <div className="space-y-3">
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide">Tipo de clínica</label>
        <div className="relative">
          <select
            value={clinicType}
            disabled={!!busy}
            onChange={e => { setClinicType(e.target.value); setClinicOk(false); }}
            className="w-full appearance-none bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white pr-8 focus:outline-none focus:border-iron-gray disabled:opacity-50 cursor-pointer"
          >
            <option value="EMPRESA">Clínica de Empresa</option>
            <option value="PRIVADA">Clínica Privada</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray pointer-events-none" />
        </div>
        <p className="text-[11px] text-iron-gray">
          Cambia entre clínica de empresa (con seguro social) y clínica privada. Esto afecta la UI de sus usuarios.
        </p>
        <Button size="sm" className="w-full" disabled={!!busy} onClick={handleClinicTypeSave}>
          {busy === "clinicType" ? "Guardando…" : "Guardar tipo"}
        </Button>
        {clinicOk && <p className="text-[11px] text-emerald-400">Tipo actualizado correctamente</p>}
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* ── Plan ── */}
      <div className="space-y-3">
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide">Plan</label>
        <div className="relative">
          <select
            value={plan}
            disabled={!!busy}
            onChange={e => { setPlan(e.target.value); setOk(false); }}
            className="w-full appearance-none bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white pr-8 focus:outline-none focus:border-iron-gray disabled:opacity-50 cursor-pointer"
          >
            {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray pointer-events-none" />
        </div>

        {plan === "TRIAL" && trialEndsAt && (
          <p className="text-[11px] text-slate-gray">
            Trial vence: {new Date(trialEndsAt).toLocaleDateString("es-HN")}
          </p>
        )}

        {plan !== "TRIAL" && (
          <Input
            label="Fecha de vencimiento del plan"
            type="date"
            value={expiresAt}
            onChange={e => { setExpiresAt(e.target.value); setOk(false); }}
          />
        )}

        <div>
          <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">Notas internas</label>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setOk(false); }}
            rows={2}
            placeholder="Ej. Pago recibido el 10/05/2026..."
            className="w-full bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2 text-[12px] text-pure-white placeholder:text-iron-gray/60 resize-none focus:outline-none focus:border-iron-gray"
          />
        </div>

        <Button size="sm" className="w-full" disabled={!!busy} onClick={handlePlanSave}>
          {busy === "plan" ? "Guardando…" : "Guardar plan"}
        </Button>
        {ok    && <p className="text-[11px] text-emerald-400">Plan actualizado correctamente</p>}
        {error && <p className="text-[11px] text-blaze-orange">{error}</p>}
      </div>

      {/* ── Plan requests ── */}
      {requests.length > 0 && (
        <div className="pt-4 border-t border-white/[0.06] space-y-3">
          <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide">
            Solicitudes de plan ({requests.length})
          </label>
          {requests.map(r => (
            <div key={r.id} className="bg-input-bg rounded-[8px] p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] text-pure-white font-medium">
                    {PLAN_LABEL[r.planKey] ?? r.planKey} · {r.billing === "annual" ? "Anual" : "Mensual"}
                  </p>
                  <p className="text-[11px] text-slate-gray">{r.contactName} · {r.contactEmail}</p>
                  {r.message && (
                    <p className="text-[11px] text-iron-gray mt-1 italic">"{r.message}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {REQUEST_STATUS_ICON[r.status]}
                  <span className="text-[10px] text-slate-gray">{REQUEST_STATUS_LABEL[r.status]}</span>
                </div>
              </div>
              <div className="relative">
                <select
                  value={r.status}
                  onChange={e => handleRequestStatus(r.id, e.target.value)}
                  className="w-full appearance-none bg-table-header border border-iron-gray/30 rounded-[6px] px-2.5 py-1.5 text-[11px] text-pure-white pr-6 focus:outline-none cursor-pointer"
                >
                  {["PENDING","CONTACTED","CONVERTED","DISMISSED"].map(s => (
                    <option key={s} value={s}>{REQUEST_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-iron-gray pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Status ── */}
      <div className="pt-4 border-t border-white/[0.06]">
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-2">Estado</label>
        <Button
          variant={status === "ACTIVE" ? "ghost" : "primary"}
          size="sm"
          disabled={!!busy}
          onClick={handleStatusToggle}
          className="w-full"
        >
          {busy === "status" ? "Actualizando…" : status === "ACTIVE" ? "Suspender tenant" : "Activar tenant"}
        </Button>
        <p className="text-[11px] text-iron-gray mt-1.5">
          {status === "ACTIVE"
            ? "Suspender bloqueará el acceso de todos los usuarios."
            : "Reactivar restaurará el acceso completo."}
        </p>
      </div>

      {/* ── Danger ── */}
      <div className="pt-4 border-t border-white/[0.06]">
        <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-2">Zona de peligro</label>
        <Button variant="danger" size="sm" disabled={!!busy} onClick={handleDelete} className="w-full">
          {busy === "delete" ? "Eliminando…" : "Eliminar tenant"}
        </Button>
        <p className="text-[11px] text-iron-gray mt-1.5">Elimina permanentemente el tenant y todos sus datos.</p>
      </div>
    </div>
  );
}
