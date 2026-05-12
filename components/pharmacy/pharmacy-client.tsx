"use client";

import { useState, useEffect, useTransition } from "react";
import { ShoppingBag, FileText, CheckCircle, Heart } from "lucide-react";
import { DispenseOTC } from "@/components/pharmacy/dispense-otc";
import { DispenseRX } from "@/components/pharmacy/dispense-rx";
import { DispensePermanent } from "@/components/pharmacy/dispense-permanent";
import { DispensationHistory } from "@/components/pharmacy/dispensation-history";
import { getActivePrescriptions, getDispensations } from "@/lib/actions/pharmacy";
import { getPermanentMeds } from "@/lib/actions/permanent-meds";

type Prescriptions  = Awaited<ReturnType<typeof getActivePrescriptions>>;
type Dispensations  = Awaited<ReturnType<typeof getDispensations>>;
type PermanentMeds  = Awaited<ReturnType<typeof getPermanentMeds>>;

interface Props {
  tenantId: string;
  pharmacistId: string;
}

export function PharmacyClient({ tenantId, pharmacistId }: Props) {
  const [tab, setTab]                         = useState<"otc" | "rx" | "permanent">("otc");
  const [prescriptions, setPrescriptions]     = useState<Prescriptions>([]);
  const [dispensations, setDispensations]     = useState<Dispensations>([]);
  const [permMeds, setPermMeds]               = useState<PermanentMeds>([]);
  const [success, setSuccess]                 = useState(false);
  const [, startTransition]                   = useTransition();

  async function loadData() {
    const [rxs, disps, perm] = await Promise.all([
      getActivePrescriptions(tenantId),
      getDispensations(tenantId),
      getPermanentMeds(tenantId),
    ]);
    setPrescriptions(rxs);
    setDispensations(disps);
    setPermMeds(perm);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  function handleSuccess() {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    startTransition(() => { loadData(); });
  }

  // Count overdue permanent meds for badge
  const MS_PER_DAY = 86_400_000;
  const overdueCount = permMeds.filter(m => {
    const base = m.deliveries[0]?.deliveredAt ?? m.startDate;
    const next = new Date(base);
    next.setDate(next.getDate() + 30);
    return next.getTime() <= Date.now();
  }).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Farmacia / Dispensario</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          {prescriptions.length} receta{prescriptions.length !== 1 ? "s" : ""} activa{prescriptions.length !== 1 ? "s" : ""}
          {overdueCount > 0 && (
            <span className="ml-2 text-blaze-orange">· {overdueCount} entrega{overdueCount !== 1 ? "s" : ""} permanente{overdueCount !== 1 ? "s" : ""} atrasada{overdueCount !== 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-green/10 rounded-[8px] px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-green shrink-0" />
          <p className="text-[13px] text-emerald-green">Dispensación registrada correctamente</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-ash-gray rounded-[12px] p-5 space-y-5">
          {/* Tab switcher */}
          <div className="flex gap-0.5 bg-table-header rounded-[6px] p-0.5">
            {([
              { key: "otc",       label: "Ventanilla", Icon: ShoppingBag },
              { key: "rx",        label: "Con receta", Icon: FileText },
              { key: "permanent", label: "Crónicos",   Icon: Heart },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 relative flex items-center justify-center gap-1 py-1.5 rounded-[4px] text-[11px] font-medium transition-colors ${
                  tab === key
                    ? "bg-sunbeam-yellow text-charcoal-black"
                    : "text-slate-gray hover:text-pure-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                {key === "permanent" && overdueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blaze-orange text-pure-white text-[9px] font-bold flex items-center justify-center">
                    {overdueCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "otc" && (
            <DispenseOTC tenantId={tenantId} pharmacistId={pharmacistId} onSuccess={handleSuccess} />
          )}
          {tab === "rx" && (
            <DispenseRX tenantId={tenantId} pharmacistId={pharmacistId} prescriptions={prescriptions} onSuccess={handleSuccess} />
          )}
          {tab === "permanent" && (
            <DispensePermanent tenantId={tenantId} pharmacistId={pharmacistId} meds={permMeds} onSuccess={handleSuccess} />
          )}
        </div>

        <div className="col-span-2 space-y-3">
          <h2 className="text-[13px] font-medium text-pure-white">Últimos despachos</h2>
          <DispensationHistory dispensations={dispensations} />
        </div>
      </div>
    </div>
  );
}
