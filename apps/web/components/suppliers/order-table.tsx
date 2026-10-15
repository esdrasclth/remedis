"use client";

import Link from "next/link";
import { Plus, ArrowRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { getPurchaseOrders } from "@/lib/actions/suppliers";

type Order = Awaited<ReturnType<typeof getPurchaseOrders>>[number];

const STATUS_VARIANT: Record<string, "muted" | "info" | "warning" | "success" | "danger"> = {
  BORRADOR: "muted",
  ENVIADA:  "info",
  PARCIAL:  "warning",
  RECIBIDA: "success",
  CANCELADA:"danger",
};
const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador", ENVIADA: "Enviada", PARCIAL: "Parcial",
  RECIBIDA: "Recibida", CANCELADA: "Cancelada",
};
const SOURCE_VARIANT: Record<string, "warning" | "muted"> = { IHSS: "warning", EMPRESA: "muted" };

const COL = {
  date:     "w-36  px-4 py-3",
  supplier: "w-auto px-4 py-3",
  source:   "w-24  px-4 py-3",
  items:    "w-auto px-4 py-3",
  status:   "w-32  px-4 py-3",
  action:   "w-20  px-4 py-3 text-right",
};

export function OrderTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
          <Package className="w-5 h-5 text-iron-gray" />
        </div>
        <p className="text-[13px] text-slate-gray">Sin órdenes de compra</p>
        <Link href="/suppliers/orders/new">
          <Button size="sm"><Plus className="w-3.5 h-3.5" /> Nueva orden</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-table-header">
            <th className={`${COL.date}     text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Fecha</th>
            <th className={`${COL.supplier} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Proveedor</th>
            <th className={`${COL.source}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Fuente</th>
            <th className={`${COL.items}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Productos</th>
            <th className={`${COL.status}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Estado</th>
            <th className={COL.action} />
          </tr>
        </thead>
        <tbody className="bg-ash-gray">
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-white/[0.04] transition-colors group">
              <td className={`${COL.date} text-[12px] text-slate-gray`}>
                {new Date(o.orderDate).toLocaleDateString("es-HN")}
              </td>
              <td className={COL.supplier}>
                <p className="text-[13px] text-pure-white font-medium">
                  {o.supplier?.name ?? "Sin proveedor"}
                </p>
                {o.notes && <p className="text-[11px] text-slate-gray mt-0.5 truncate max-w-xs">{o.notes}</p>}
              </td>
              <td className={COL.source}>
                <Badge variant={SOURCE_VARIANT[o.source]}>{o.source}</Badge>
              </td>
              <td className={COL.items}>
                <div className="flex flex-wrap gap-1">
                  {o.items.slice(0, 3).map(i => (
                    <span key={i.id} className="text-[11px] text-slate-gray bg-table-header rounded px-1.5 py-0.5 truncate max-w-[130px]">
                      {i.product.genericName}
                    </span>
                  ))}
                  {o.items.length > 3 && (
                    <span className="text-[11px] text-iron-gray">+{o.items.length - 3}</span>
                  )}
                </div>
              </td>
              <td className={COL.status}>
                <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
              </td>
              <td className={COL.action}>
                <Link
                  href={`/suppliers/orders/${o.id}`}
                  className="inline-flex items-center gap-1 text-[12px] text-iron-gray hover:text-pure-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
