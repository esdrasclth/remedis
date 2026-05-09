"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdjustmentModal } from "./adjustment-modal";
import type { getBatches } from "@/lib/actions/inventory";

type Batch = Awaited<ReturnType<typeof getBatches>>[number];

const MS_PER_DAY = 86_400_000;
function daysUntil(date: Date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / MS_PER_DAY);
}

/* Shared column widths */
const COL = {
  batch:    "w-auto  px-4 py-3",
  warehouse:"w-40    px-4 py-3",
  source:   "w-24    px-4 py-3",
  initial:  "w-28    px-4 py-3 text-right",
  current:  "w-28    px-4 py-3 text-right",
  expiry:   "w-36    px-4 py-3",
  status:   "w-28    px-4 py-3",
  action:   "w-20    px-4 py-3 text-right",
};

const TH_CLASS = "text-[11px] font-medium text-slate-gray uppercase tracking-wide";

export function BatchList({
  batches, tenantId, productId,
}: {
  batches: Batch[];
  tenantId: string;
  productId: string;
}) {
  const [adjustTarget, setAdjustTarget] = useState<Batch | null>(null);

  if (batches.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3">
        <p className="text-[13px] text-slate-gray">Sin lotes registrados.</p>
        <Link href={`/inventory/${productId}/batches/new`}>
          <Button size="sm"><Plus className="w-3.5 h-3.5" /> Registrar primer lote</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end px-4 py-3 border-b border-iron-gray/20">
        <Link href={`/inventory/${productId}/batches/new`}>
          <Button size="sm"><Plus className="w-3.5 h-3.5" /> Registrar ingreso</Button>
        </Link>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-iron-gray/20 bg-ash-gray/40">
            <th className={`${COL.batch}    ${TH_CLASS} text-left`}>N° Lote</th>
            <th className={`${COL.warehouse}${TH_CLASS} text-left`}>Almacén</th>
            <th className={`${COL.source}   ${TH_CLASS} text-left`}>Fuente</th>
            <th className={`${COL.initial}  ${TH_CLASS}`}>Inicial</th>
            <th className={`${COL.current}  ${TH_CLASS}`}>Disponible</th>
            <th className={`${COL.expiry}   ${TH_CLASS} text-left`}>Vencimiento</th>
            <th className={`${COL.status}   ${TH_CLASS} text-left`}>Estado</th>
            <th className={COL.action} />
          </tr>
        </thead>
        <tbody className="divide-y divide-iron-gray/10">
          {batches.map((b) => {
            const days = daysUntil(b.expiryDate);
            const expired = days <= 0;
            const warn30 = days > 0 && days <= 30;
            const warn90 = days > 30 && days <= 90;

            return (
              <tr key={b.id} className="hover:bg-ash-gray/30 transition-colors">
                <td className={`${COL.batch} font-mono text-[12px] text-pure-white`}>
                  {b.batchNumber}
                </td>
                <td className={`${COL.warehouse} text-[12px] text-slate-gray`}>
                  {b.warehouse.name}
                </td>
                <td className={COL.source}>
                  <Badge variant={b.source === "IHSS" ? "warning" : "muted"}>{b.source}</Badge>
                </td>
                <td className={`${COL.initial} text-[13px] text-slate-gray tabular-nums`}>
                  {b.initialQty}
                </td>
                <td className={`${COL.current} text-[13px] font-medium tabular-nums ${b.currentQty === 0 ? "text-iron-gray" : "text-pure-white"}`}>
                  {b.currentQty}
                </td>
                <td className={COL.expiry}>
                  <div className="flex items-center gap-1.5">
                    {(expired || warn30) && <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange shrink-0" />}
                    <div>
                      <p className={`text-[12px] ${expired || warn30 ? "text-blaze-orange" : warn90 ? "text-sunbeam-yellow" : "text-slate-gray"}`}>
                        {new Date(b.expiryDate).toLocaleDateString("es-HN")}
                      </p>
                      <p className="text-[10px] text-iron-gray mt-0.5">
                        {expired ? "Vencido" : `${days} días`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={COL.status}>
                  {b.currentQty === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-iron-gray" />
                      <span className="text-[12px] text-iron-gray">Agotado</span>
                    </div>
                  ) : expired ? (
                    <Badge variant="danger">Vencido</Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-green" />
                      <span className="text-[12px] text-emerald-green">Activo</span>
                    </div>
                  )}
                </td>
                <td className={COL.action}>
                  <Button variant="ghost" size="sm" onClick={() => setAdjustTarget(b)}>
                    Ajustar
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {adjustTarget && (
        <AdjustmentModal
          batch={adjustTarget}
          tenantId={tenantId}
          productId={productId}
          onClose={() => setAdjustTarget(null)}
        />
      )}
    </>
  );
}
