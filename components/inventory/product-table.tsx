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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a5854]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-[#191817] border border-[#3d3b38] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#5a5854] focus:outline-none focus:border-[#6b6966] h-9"
          />
        </div>
        <Link href="/inventory/new">
          <Button size="md">
            <Plus className="w-3.5 h-3.5" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="rounded-[10px] border border-[#2e2c29] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #2e2c29", background: "#161514" }}>
                <Th>Producto</Th>
                <Th>Categoría</Th>
                <Th>Presentación</Th>
                <Th align="right">Stock</Th>
                <Th>Fuente</Th>
                <Th>Receta</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <ProductRow key={p.id} product={p} last={i === filtered.length - 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p, last }: { product: Product; last: boolean }) {
  const totalStock = p.batches.reduce((s, b) => s + b.currentQty, 0);
  const isLow = totalStock <= p.minStock;

  return (
    <tr
      className="hover:bg-[#1f1e1c] transition-colors group"
      style={!last ? { borderBottom: "1px solid #252320" } : undefined}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[6px] bg-[#252320] border border-[#2e2c29] flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 text-[#5a5854]" />
          </div>
          <div>
            <p className="text-[13px] text-white font-medium leading-tight">{p.genericName}</p>
            {p.commercialName && (
              <p className="text-[11px] text-[#5a5854] mt-0.5">{p.commercialName}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={CATEGORY_VARIANT[p.category]}>
          {CATEGORY_LABEL[p.category]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-[12px] text-slate-gray">
        {[p.form, p.concentration].filter(Boolean).join(" · ") || "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange" />}
          <span
            className={`text-[14px] font-medium ${isLow ? "text-blaze-orange" : "text-white"}`}
          >
            {totalStock}
          </span>
          {p.unit && <span className="text-[11px] text-[#5a5854]">{p.unit}</span>}
        </div>
        {isLow && (
          <p className="text-[10px] text-[#5a5854] text-right mt-0.5">
            mín. {p.minStock}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={p.defaultSource === "IHSS" ? "warning" : "muted"}>
          {p.defaultSource}
        </Badge>
      </td>
      <td className="px-4 py-3 text-[12px]">
        {p.requiresPrescription ? (
          <span className="text-sunbeam-yellow">Sí</span>
        ) : (
          <span className="text-[#5a5854]">No</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/inventory/${p.id}`}
          className="flex items-center justify-end gap-1 text-[12px] text-[#5a5854] hover:text-white opacity-0 group-hover:opacity-100 transition-all"
        >
          Ver <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-2.5 text-[11px] text-[#5a5854] font-medium text-${align}`}>
      {children}
    </th>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="rounded-[10px] border border-[#2e2c29] py-16 flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#1c1b1a] border border-[#2e2c29] flex items-center justify-center">
        <Package className="w-5 h-5 text-[#3d3b38]" />
      </div>
      <p className="text-[13px] text-slate-gray">
        {hasSearch ? "Sin resultados para esa búsqueda" : "No hay productos en el catálogo"}
      </p>
      {!hasSearch && (
        <Link href="/inventory/new">
          <Button size="sm">
            <Plus className="w-3.5 h-3.5" />
            Agregar primer producto
          </Button>
        </Link>
      )}
    </div>
  );
}
