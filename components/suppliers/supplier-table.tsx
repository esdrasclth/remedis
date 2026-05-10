"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { getSuppliers } from "@/lib/actions/suppliers";

type Supplier = Awaited<ReturnType<typeof getSuppliers>>[number];

const COL = {
  name:    "w-auto px-4 py-3",
  rtn:     "w-36   px-4 py-3",
  contact: "w-44   px-4 py-3",
  phone:   "w-36   px-4 py-3",
  orders:  "w-24   px-4 py-3 text-right",
  action:  "w-20   px-4 py-3 text-right",
};

export function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState("");

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.rtn ?? "").includes(search) ||
    (s.contact ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proveedor..."
            className="w-full bg-ash-gray rounded-[4px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
          />
        </div>
        <Link href="/suppliers/new">
          <Button size="md"><Plus className="w-3.5 h-3.5" /> Nuevo proveedor</Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
            <Truck className="w-5 h-5 text-iron-gray" />
          </div>
          <p className="text-[13px] text-slate-gray">
            {search ? "Sin resultados" : "No hay proveedores registrados"}
          </p>
          {!search && (
            <Link href="/suppliers/new">
              <Button size="sm"><Plus className="w-3.5 h-3.5" /> Agregar proveedor</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#222120]">
                <th className={`${COL.name}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Proveedor</th>
                <th className={`${COL.rtn}     text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>RTN</th>
                <th className={`${COL.contact} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Contacto</th>
                <th className={`${COL.phone}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Teléfono</th>
                <th className={`${COL.orders}  text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Órdenes</th>
                <th className={COL.action} />
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className={COL.name}>
                    <p className="text-[13px] text-pure-white font-medium">{s.name}</p>
                    {s.email && <p className="text-[11px] text-slate-gray mt-0.5">{s.email}</p>}
                  </td>
                  <td className={`${COL.rtn} font-mono text-[12px] text-slate-gray`}>{s.rtn ?? "—"}</td>
                  <td className={`${COL.contact} text-[12px] text-slate-gray`}>{s.contact ?? "—"}</td>
                  <td className={`${COL.phone} text-[12px] text-slate-gray`}>{s.phone ?? "—"}</td>
                  <td className={`${COL.orders} text-[13px] text-slate-gray tabular-nums`}>
                    {s._count.purchaseOrders}
                  </td>
                  <td className={COL.action}>
                    <Link
                      href={`/suppliers/${s.id}/edit`}
                      className="text-[12px] text-iron-gray hover:text-pure-white opacity-0 group-hover:opacity-100 transition-all inline-flex items-center gap-1"
                    >
                      Editar <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
