"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createPurchaseOrder, searchProductsForOrder } from "@/lib/actions/suppliers";
import type { getSuppliers } from "@/lib/actions/suppliers";

type Supplier = Awaited<ReturnType<typeof getSuppliers>>[number];
type ProductResult = { id: string; genericName: string; commercialName: string | null; unit: string | null };

interface OrderItem {
  productId:    string;
  productName:  string;
  requestedQty: number;
  unitCost:     string;
}

interface Props { tenantId: string; suppliers: Supplier[] }

export function OrderForm({ tenantId, suppliers }: Props) {
  const router = useRouter();
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems]     = useState<OrderItem[]>([]);

  // Product search
  const [prodQuery, setProdQuery]     = useState("");
  const [prodResults, setProdResults] = useState<ProductResult[]>([]);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);
    if (!prodQuery) { setProdResults([]); return; }
    ref.current = setTimeout(async () => {
      const r = await searchProductsForOrder(tenantId, prodQuery);
      setProdResults(r);
    }, 250);
  }, [prodQuery, tenantId]);

  function addItem(p: ProductResult) {
    if (items.find(i => i.productId === p.id)) return;
    setItems(prev => [...prev, { productId: p.id, productName: p.genericName, requestedQty: 1, unitCost: "" }]);
    setProdQuery("");
    setProdResults([]);
  }

  function updateItem(id: string, field: keyof OrderItem, value: string | number) {
    setItems(prev => prev.map(i => i.productId === id ? { ...i, [field]: value } : i));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.productId !== id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) { setError("Agrega al menos un producto."); return; }

    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError("");

    const result = await createPurchaseOrder(tenantId, {
      supplierId: (fd.get("supplierId") as string) || undefined,
      source:     fd.get("source") as "EMPRESA" | "IHSS",
      notes:      (fd.get("notes") as string) || undefined,
      items: items.map(i => ({
        productId:    i.productId,
        requestedQty: i.requestedQty,
        unitCost:     i.unitCost ? parseFloat(i.unitCost) : undefined,
      })),
    });

    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    router.push(`/suppliers/orders/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Datos generales</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select name="supplierId" label="Proveedor" defaultValue="">
            <option value="">Sin proveedor (IHSS u otro)</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select name="source" label="Fuente de abastecimiento" defaultValue="EMPRESA">
            <option value="EMPRESA">Empresa</option>
            <option value="IHSS">IHSS</option>
          </Select>
        </div>
        <Textarea name="notes" label="Notas (opcional)" rows={2} />
      </section>

      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Productos solicitados</h3>

        {/* Product search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            value={prodQuery}
            onChange={e => setProdQuery(e.target.value)}
            placeholder="Buscar producto para agregar..."
            className="w-full bg-[#2a2825] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
          />
          {prodResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2825] rounded-[8px] overflow-hidden z-10">
              {prodResults.map(p => (
                <button key={p.id} type="button" onClick={() => addItem(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors flex items-center justify-between">
                  <span className="text-[13px] text-pure-white">{p.genericName}</span>
                  {p.commercialName && <span className="text-[11px] text-slate-gray">{p.commercialName}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-medium text-slate-gray uppercase tracking-wide">
              <div className="col-span-5">Producto</div>
              <div className="col-span-3 text-right">Cantidad</div>
              <div className="col-span-3">Costo unit. (L)</div>
              <div className="col-span-1" />
            </div>
            {items.map(item => (
              <div key={item.productId} className="grid grid-cols-12 gap-2 items-center bg-[#2a2825] rounded-[8px] px-3 py-2.5">
                <div className="col-span-5">
                  <p className="text-[13px] text-pure-white font-medium">{item.productName}</p>
                </div>
                <div className="col-span-3">
                  <input
                    type="number" min={1} value={item.requestedQty}
                    onChange={e => updateItem(item.productId, "requestedQty", Number(e.target.value))}
                    className="w-full bg-[#1a1919] rounded-[4px] px-2 py-1 text-[13px] text-pure-white text-right focus:outline-none tabular-nums"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number" step="0.01" min={0} value={item.unitCost} placeholder="0.00"
                    onChange={e => updateItem(item.productId, "unitCost", e.target.value)}
                    className="w-full bg-[#1a1919] rounded-[4px] px-2 py-1 text-[13px] text-pure-white focus:outline-none tabular-nums"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => removeItem(item.productId)}
                    className="text-iron-gray hover:text-blaze-orange transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={loading}>
          {loading ? "Guardando..." : "Crear orden de compra"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
