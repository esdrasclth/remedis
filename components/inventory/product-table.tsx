"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Search, AlertTriangle, Plus } from "lucide-react";
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
    <div className="flex flex-col gap-4">
      {/* Search + actions bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-ocean-abyss border border-iron-gray rounded-[10px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none focus:border-slate-gray"
          />
        </div>
        <Link href="/inventory/new">
          <Button size="md">
            <Plus className="w-4 h-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState hasSearch={search.length > 0} />
      ) : (
        <div className="bg-ash-gray rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-iron-gray/40">
                <Th>Producto</Th>
                <Th>Categoría</Th>
                <Th>Forma / Concentración</Th>
                <Th align="right">Stock actual</Th>
                <Th align="right">Stock mínimo</Th>
                <Th>Fuente</Th>
                <Th>Receta</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
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
  const activeBatches = p.batches.length;

  return (
    <tr className="border-b border-iron-gray/20 hover:bg-ocean-abyss/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-ocean-abyss flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 text-slate-gray" />
          </div>
          <div>
            <p className="text-[13px] text-pure-white font-medium">
              {p.genericName}
            </p>
            {p.commercialName && (
              <p className="text-[11px] text-slate-gray">{p.commercialName}</p>
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
        <span
          className={`text-[13px] font-medium ${isLow ? "text-blaze-orange" : "text-pure-white"}`}
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          {totalStock}
        </span>
        {p.unit && (
          <span className="text-[11px] text-slate-gray ml-1">{p.unit}</span>
        )}
        {isLow && (
          <AlertTriangle className="inline w-3.5 h-3.5 text-blaze-orange ml-1.5" />
        )}
      </td>
      <td className="px-4 py-3 text-right text-[12px] text-slate-gray">
        {p.minStock}
      </td>
      <td className="px-4 py-3">
        <Badge variant={p.defaultSource === "IHSS" ? "warning" : "muted"}>
          {p.defaultSource}
        </Badge>
      </td>
      <td className="px-4 py-3 text-[12px] text-slate-gray">
        {p.requiresPrescription ? (
          <span className="text-sunbeam-yellow">Sí</span>
        ) : (
          "No"
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/inventory/${p.id}`}>
          <Button variant="ghost" size="sm">
            Ver detalle →
          </Button>
        </Link>
      </td>
    </tr>
  );
}

function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-[11px] text-slate-gray uppercase tracking-wide font-medium text-${align}`}
    >
      {children}
    </th>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="bg-ash-gray rounded-[12px] py-16 flex flex-col items-center gap-3">
      <Package className="w-10 h-10 text-iron-gray" />
      <p className="text-slate-gray text-[14px]">
        {hasSearch ? "Sin resultados para esa búsqueda" : "No hay productos registrados"}
      </p>
      {!hasSearch && (
        <Link href="/inventory/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Agregar primer producto
          </Button>
        </Link>
      )}
    </div>
  );
}
