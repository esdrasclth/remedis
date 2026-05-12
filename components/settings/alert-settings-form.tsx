"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Package, Clock, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAlertSettings } from "@/lib/actions/settings";

interface AlertSettings {
  expiryAlertDays:          number;
  stockAlertEnabled:        boolean;
  expiryAlertEnabled:       boolean;
  expiredAlertEnabled:      boolean;
  prescriptionAlertEnabled: boolean;
}

interface Props {
  tenantId: string;
  initial: AlertSettings;
}

function Toggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${checked ? "bg-sunbeam-yellow/10" : "bg-ash-gray"}`}>
          <Icon className={`w-4 h-4 ${checked ? "text-sunbeam-yellow" : "text-iron-gray"}`} />
        </div>
        <div>
          <p className="text-[13px] text-pure-white font-medium">{label}</p>
          <p className="text-[11px] text-slate-gray">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none ${checked ? "bg-sunbeam-yellow" : "bg-iron-gray/40"}`}
        style={{ height: "22px", width: "40px" }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[20px]" : "translate-x-[3px]"}`}
        />
      </button>
    </div>
  );
}

export function AlertSettingsForm({ tenantId, initial }: Props) {
  const router = useRouter();

  const [expiryDays,   setExpiryDays]   = useState(String(initial.expiryAlertDays));
  const [stockOn,      setStockOn]      = useState(initial.stockAlertEnabled);
  const [expiryOn,     setExpiryOn]     = useState(initial.expiryAlertEnabled);
  const [expiredOn,    setExpiredOn]    = useState(initial.expiredAlertEnabled);
  const [prescriptionOn, setPrescriptionOn] = useState(initial.prescriptionAlertEnabled);

  const [busy,  setBusy]  = useState(false);
  const [ok,    setOk]    = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setOk(false); setError("");

    const res = await updateAlertSettings(tenantId, {
      expiryAlertDays:          Number(expiryDays),
      stockAlertEnabled:        stockOn,
      expiryAlertEnabled:       expiryOn,
      expiredAlertEnabled:      expiredOn,
      prescriptionAlertEnabled: prescriptionOn,
    });

    if (res.success) {
      setOk(true);
      router.refresh();
    } else setError(res.error);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Expiry threshold */}
      <div className="space-y-3">
        <h3 className="text-[12px] font-medium text-slate-gray uppercase tracking-wide">Umbral de vencimiento próximo</h3>
        <div className="flex items-center gap-3">
          <div className="w-32">
            <Input
              label="Días de anticipación"
              type="number"
              min="1"
              max="365"
              value={expiryDays}
              onChange={e => setExpiryDays(e.target.value)}
            />
          </div>
          <p className="text-[12px] text-slate-gray mt-5">
            Se generará una alerta cuando un lote venza en menos de <strong className="text-pure-white">{expiryDays || "?"} días</strong>.
          </p>
        </div>
      </div>

      {/* Alert toggles */}
      <div className="space-y-1">
        <h3 className="text-[12px] font-medium text-slate-gray uppercase tracking-wide mb-3">Tipos de alertas activas</h3>
        <div className="bg-table-header rounded-[10px] px-4">
          <Toggle
            label="Stock mínimo"
            description="Alerta cuando el stock de un producto baja del mínimo configurado"
            icon={Package}
            checked={stockOn}
            onChange={setStockOn}
          />
          <Toggle
            label="Vencimiento próximo"
            description={`Alerta cuando un lote vence en menos de ${expiryDays || "?"} días`}
            icon={Clock}
            checked={expiryOn}
            onChange={setExpiryOn}
          />
          <Toggle
            label="Medicamentos vencidos"
            description="Alerta cuando hay lotes vencidos con stock disponible"
            icon={AlertTriangle}
            checked={expiredOn}
            onChange={setExpiredOn}
          />
          <Toggle
            label="Recetas vencidas"
            description="Alerta cuando una receta emitida vence sin ser dispensada"
            icon={FileText}
            checked={prescriptionOn}
            onChange={setPrescriptionOn}
          />
        </div>
      </div>

      {error && <p className="text-[12px] text-blaze-orange">{error}</p>}
      {ok    && <p className="text-[12px] text-emerald-400">Configuración guardada</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Guardando…" : "Guardar configuración"}
        </Button>
        {!stockOn && !expiryOn && !expiredOn && !prescriptionOn && (
          <span className="flex items-center gap-1.5 text-[11px] text-iron-gray">
            <BellOff className="w-3.5 h-3.5" /> Todas las alertas desactivadas
          </span>
        )}
        {(stockOn || expiryOn || expiredOn || prescriptionOn) && (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-gray">
            <Bell className="w-3.5 h-3.5" />
            {[stockOn, expiryOn, expiredOn, prescriptionOn].filter(Boolean).length} tipo{[stockOn, expiryOn, expiredOn, prescriptionOn].filter(Boolean).length !== 1 ? "s" : ""} activo{[stockOn, expiryOn, expiredOn, prescriptionOn].filter(Boolean).length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </form>
  );
}
