"use client";

import { useState, useEffect, useTransition } from "react";
import { ShoppingBag, FileText, CheckCircle } from "lucide-react";
import { DispenseOTC } from "@/components/pharmacy/dispense-otc";
import { DispenseRX } from "@/components/pharmacy/dispense-rx";
import { DispensationHistory } from "@/components/pharmacy/dispensation-history";
import { getActivePrescriptions, getDispensations } from "@/lib/actions/pharmacy";
import { useSession } from "next-auth/react";

// This page is intentionally client-side to enable real-time refresh after dispensation.
// Data is fetched via server actions on mount and after each successful dispense.

type Prescriptions = Awaited<ReturnType<typeof getActivePrescriptions>>;
type Dispensations = Awaited<ReturnType<typeof getDispensations>>;

export default function PharmacyPage() {
  const { data: session } = useSession();
  const [tab, setTab]               = useState<"otc" | "rx">("otc");
  const [prescriptions, setPrescriptions] = useState<Prescriptions>([]);
  const [dispensations, setDispensations] = useState<Dispensations>([]);
  const [success, setSuccess]             = useState(false);
  const [, startTransition]               = useTransition();

  // tenantId comes from the session (set by NextAuth callbacks)
  const tenantId    = (session?.user as { tenantId?: string } | undefined)?.tenantId ?? "";
  const pharmacistId = session?.user?.id ?? "";

  async function loadData() {
    if (!tenantId) return;
    const [rxs, disps] = await Promise.all([
      getActivePrescriptions(tenantId),
      getDispensations(tenantId),
    ]);
    setPrescriptions(rxs);
    setDispensations(disps);
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

  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Farmacia / Dispensario</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          {prescriptions.length} receta{prescriptions.length !== 1 ? "s" : ""} activa{prescriptions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-green/10 rounded-[8px] px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-green shrink-0" />
          <p className="text-[13px] text-emerald-green">Dispensación registrada correctamente</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left panel — dispensation form */}
        <div className="col-span-1 bg-ash-gray rounded-[12px] p-5 space-y-5">
          {/* Tabs */}
          <div className="flex gap-0.5 bg-[#222120] rounded-[6px] p-0.5">
            {([
              { key: "otc", label: "Ventanilla", Icon: ShoppingBag },
              { key: "rx",  label: "Con receta", Icon: FileText },
            ] as const).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-[12px] font-medium transition-colors ${
                  tab === key
                    ? "bg-sunbeam-yellow text-deep-space-black"
                    : "text-slate-gray hover:text-pure-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "otc" && tenantId && (
            <DispenseOTC
              tenantId={tenantId}
              pharmacistId={pharmacistId}
              onSuccess={handleSuccess}
            />
          )}
          {tab === "rx" && tenantId && (
            <DispenseRX
              tenantId={tenantId}
              pharmacistId={pharmacistId}
              prescriptions={prescriptions}
              onSuccess={handleSuccess}
            />
          )}
        </div>

        {/* Right panel — history */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-[13px] font-medium text-pure-white">Últimos despachos</h2>
          <DispensationHistory dispensations={dispensations} />
        </div>
      </div>
    </div>
  );
}
