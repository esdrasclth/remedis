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

function daysUntilExpiry(date: Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / MS_PER_DAY);
}

function expiryVariant(days: number): "danger" | "warning" | "success" | "muted" {
  if (days <= 0) return "danger";
  if (days <= 30) return "danger";
  if (days <= 90) return "warning";
  return "success";
}

export function BatchList({
  batches,
  tenantId,
  productId,
}: {
  batches: Batch[];
  tenantId: string;
  productId: string;
}) {
  const [adjustTarget, setAdjustTarget] = useState<Batch | null>(null);

  if (batches.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3">
        <p className="text-slate-gray text-[14px]">Sin lotes registrados para este producto.</p>
        <Link href={`/inventory/${productId}/batches/new`}>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Registrar primer lote
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Link href={`/inventory/${productId}/batches/new`}>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Registrar ingreso
          </Button>
        </Link>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-iron-gray/40">
            <Th>N° Lote</Th>
            <Th>Almacén</Th>
            <Th>Fuente</Th>
            <Th align="right">Cantidad inicial</Th>
            <Th align="right">Disponible</Th>
            <Th>Vencimiento</Th>
            <Th>Estado</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => {
            const days = daysUntilExpiry(b.expiryDate);
            const variant = expiryVariant(days);
            return (
              <tr key={b.id} className="border-b border-iron-gray/20 hover:bg-ocean-abyss/40 transition-colors">
                <td className="px-4 py-3 text-[13px] text-pure-white font-mono">
                  {b.batchNumber}
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-gray">
                  {b.warehouse.name}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={b.source === "IHSS" ? "warning" : "muted"}>
                    {b.source}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-gray" style={{ fontFeatureSettings: '"ss01"' }}>
                  {b.initialQty}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-[13px] font-medium ${b.currentQty === 0 ? "text-slate-gray" : "text-pure-white"}`}
                    style={{ fontFeatureSettings: '"ss01"' }}
                  >
                    {b.currentQty}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {variant === "danger" && <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange" />}
                    <span className={`text-[12px] ${variant === "danger" ? "text-blaze-orange" : variant === "warning" ? "text-sunbeam-yellow" : "text-slate-gray"}`}>
                      {new Date(b.expiryDate).toLocaleDateString("es-HN")}
                    </span>
                  </div>
                  <p className="text-[11px] text-iron-gray mt-0.5">
                    {days <= 0 ? "Vencido" : `${days} días`}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {b.currentQty === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-iron-gray" />
                      <span className="text-[12px] text-iron-gray">Agotado</span>
                    </div>
                  ) : days <= 0 ? (
                    <Badge variant="danger">Vencido</Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-green" />
                      <span className="text-[12px] text-emerald-green">Activo</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAdjustTarget(b)}
                  >
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

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-3 text-[11px] text-slate-gray uppercase tracking-wide font-medium text-${align}`}>
      {children}
    </th>
  );
}
