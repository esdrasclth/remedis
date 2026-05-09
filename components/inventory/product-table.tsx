"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Search, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { getProducts } from "@/lib/actions/inventory";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

const CATEGORY_LABEL: Record<string, string> = {
  MEDICAMENTO: "Medicamento",
  INSUMO_DESCARTABLE: "Insumo",
  EQUIPO_MEDICO: "Equipo",
};

const CATEGORY_VARIANT: Record<string, "info" | "success" | "muted"> = {
  MEDICAMENTO: "info",
  INSUMO_DESCARTABLE: "success",
  EQUIPO_MEDICO: "muted",
};

/* Shared cell padding — same on <th> and <td> so columns align */
const COL = {
  product:   "w-auto   px-4 py-3",
  category:  "w-32     px-4 py-3",
  form:      "w-40     px-4 py-3",
  stock:     "w-28     px-4 py-3 text-right",
  source:    "w-24     px-4 py-3",
  rx:        "w-20     px-4 py-3",
  action:    "w-20     px-4 py-3 text-right",
};

export function ProductTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.genericName.toLowerCase().includes(search.toLowerCase()) ||
      (p.commercialName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-ash-gray  rounded-[4px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none focus:border-slate-gray transition-colors h-9"
          />
        </div>
        <Link href="/inventory/new">
          <Button size="md">
            <Plus className="w-3.5 h-3.5" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-ash-gray ">
                <th className={`${COL.product}  text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Producto</th>
                <th className={`${COL.category} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Categoría</th>
                <th className={`${COL.form}     text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Presentación</th>
                <th className={`${COL.stock}    text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Stock</th>
                <th className={`${COL.source}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Fuente</th>
                <th className={`${COL.rx}       text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Receta</th>
                <th className={COL.action} />
              </tr>
            </thead>
            <tbody className="bg-deep-space-black ">
              {filtered.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p }: { product: Product }) {
  const totalStock = p.batches.reduce((s, b) => s + b.currentQty, 0);
  const isLow = totalStock <= p.minStock;

  return (
    <tr className="hover:bg-ash-gray/50 transition-colors group">
      {/* Product */}
      <td className={COL.product}>
        <p className="text-[13px] text-pure-white font-medium leading-tight">{p.genericName}</p>
        {p.commercialName && (
          <p className="text-[11px] text-slate-gray mt-0.5">{p.commercialName}</p>
        )}
      </td>

      {/* Category */}
      <td className={COL.category}>
        <Badge variant={CATEGORY_VARIANT[p.category]}>
          {CATEGORY_LABEL[p.category]}
        </Badge>
      </td>

      {/* Form */}
      <td className={`${COL.form} text-[12px] text-slate-gray`}>
        {[p.form, p.concentration].filter(Boolean).join(" · ") || "—"}
      </td>

      {/* Stock */}
      <td className={COL.stock}>
        <div className="flex items-center justify-end gap-1.5">
          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange shrink-0" />}
          <span className={`text-[14px] font-medium tabular-nums ${isLow ? "text-blaze-orange" : "text-pure-white"}`}>
            {totalStock}
          </span>
          {p.unit && <span className="text-[11px] text-iron-gray">{p.unit}</span>}
        </div>
        {isLow && (
          <p className="text-[10px] text-iron-gray text-right mt-0.5">mín. {p.minStock}</p>
        )}
      </td>

      {/* Source */}
      <td className={COL.source}>
        <Badge variant={p.defaultSource === "IHSS" ? "warning" : "muted"}>
          {p.defaultSource}
        </Badge>
      </td>

      {/* Rx */}
      <td className={`${COL.rx} text-[12px]`}>
        {p.requiresPrescription
          ? <span className="text-sunbeam-yellow">Sí</span>
          : <span className="text-iron-gray">No</span>}
      </td>

      {/* Action */}
      <td className={COL.action}>
        <Link
          href={`/inventory/${p.id}`}
          className="inline-flex items-center gap-1 text-[12px] text-iron-gray hover:text-pure-white opacity-0 group-hover:opacity-100 transition-all"
        >
          Ver <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
        <Package className="w-5 h-5 text-iron-gray" />
      </div>
      <p className="text-[13px] text-slate-gray">
        {hasSearch ? "Sin resultados para esa búsqueda" : "No hay productos en el catálogo"}
      </p>
      {!hasSearch && (
        <Link href="/inventory/new">
          <Button size="sm"><Plus className="w-3.5 h-3.5" /> Agregar primer producto</Button>
        </Link>
      )}
    </div>
  );
}
