"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { receiveMerchandise } from "@/lib/actions/suppliers";
import type { getPurchaseOrder, getSuppliers } from "@/lib/actions/suppliers";

type Order   = NonNullable<Awaited<ReturnType<typeof getPurchaseOrder>>>;
type Warehouse = { id: string; name: string; source: string };

interface ReceiveBatch {
  orderItemId: string;
  productId:   string;
  productName: string;
  warehouseId: string;
  batchNumber: string;
  mfgDate:     string;
  expiryDate:  string;
  receivedQty: number;
  source:      "EMPRESA" | "IHSS";
  include:     boolean;
  remaining:   number;
}

interface Props {
  tenantId:   string;
  userId:     string;
  order:      Order;
  warehouses: Warehouse[];
}

export function ReceiveForm({ tenantId, userId, order, warehouses }: Props) {
  const router = useRouter();
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const [batches, setBatches] = useState<ReceiveBatch[]>(
    order.items
      .filter(i => i.requestedQty - i.receivedQty > 0)
      .map(i => ({
        orderItemId: i.id,
        productId:   i.productId,
        productName: i.product.genericName,
        warehouseId: warehouses[0]?.id ?? "",
        batchNumber: "",
        mfgDate:     "",
        expiryDate:  "",
        receivedQty: i.requestedQty - i.receivedQty,
        source:      order.source,
        include:     true,
        remaining:   i.requestedQty - i.receivedQty,
      }))
  );

  function update(idx: number, field: keyof ReceiveBatch, value: string | number | boolean) {
    setBatches(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected = batches.filter(b => b.include);
    if (selected.length === 0) { setError("Selecciona al menos un producto a recibir."); return; }

    const invalid = selected.find(b => !b.batchNumber || !b.expiryDate || !b.warehouseId);
    if (invalid) { setError(`Completa todos los campos del lote: ${invalid.productName}`); return; }

    setLoading(true);
    setError("");
    const result = await receiveMerchandise(tenantId, userId, {
      orderId: order.id,
      batches: selected.map(b => ({
        orderItemId: b.orderItemId,
        productId:   b.productId,
        warehouseId: b.warehouseId,
        batchNumber: b.batchNumber,
        mfgDate:     b.mfgDate || undefined,
        expiryDate:  b.expiryDate,
        receivedQty: b.receivedQty,
        source:      b.source,
      })),
    });

    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    router.push(`/suppliers/orders/${order.id}`);
    router.refresh();
  }

  if (batches.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-emerald-green">
        <CheckCircle className="w-4 h-4" />
        <p className="text-[13px]">Todos los productos han sido recibidos.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {batches.map((b, idx) => (
        <div
          key={b.orderItemId}
          className={`rounded-[8px] p-4 space-y-3 transition-colors ${b.include ? "bg-[#2a2825]" : "bg-[#1e1c1a]"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={b.include}
                onChange={ev => update(idx, "include", ev.target.checked)}
                className="accent-sunbeam-yellow w-3.5 h-3.5"
              />
              <div>
                <p className={`text-[13px] font-medium ${b.include ? "text-pure-white" : "text-iron-gray"}`}>
                  {b.productName}
                </p>
                <p className="text-[11px] text-slate-gray">Pendiente: {b.remaining} unidades</p>
              </div>
            </div>
          </div>

          {b.include && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Select
                label="Almacén" value={b.warehouseId}
                onChange={e => update(idx, "warehouseId", e.target.value)}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
              <Input
                label="N° Lote" value={b.batchNumber} placeholder="LOT-2024-001"
                onChange={e => update(idx, "batchNumber", e.target.value)}
              />
              <Input
                label="Fecha de fabricación" type="date" value={b.mfgDate}
                onChange={e => update(idx, "mfgDate", e.target.value)}
              />
              <Input
                label="Fecha de vencimiento" type="date" value={b.expiryDate} required
                onChange={e => update(idx, "expiryDate", e.target.value)}
              />
              <Input
                label="Cantidad recibida" type="number" min={1} max={b.remaining}
                value={b.receivedQty}
                onChange={e => update(idx, "receivedQty", Number(e.target.value))}
              />
              <Select
                label="Fuente" value={b.source}
                onChange={e => update(idx, "source", e.target.value as "EMPRESA" | "IHSS")}
              >
                <option value="EMPRESA">Empresa</option>
                <option value="IHSS">IHSS</option>
              </Select>
            </div>
          )}
        </div>
      ))}

      <Textarea label="Notas de recepción (opcional)" name="receiveNotes" rows={2} />

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <Button type="submit" size="md" disabled={loading}>
        {loading ? "Procesando..." : "Confirmar recepción"}
      </Button>
    </form>
  );
}
