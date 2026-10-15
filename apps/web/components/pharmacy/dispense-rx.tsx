"use client";

import { useState, useEffect } from "react";
import { Search, X, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dispenseWithPrescription, getProductBatchSuggestions } from "@/lib/actions/pharmacy";
import type { getActivePrescriptions } from "@/lib/actions/pharmacy";

type Prescription = Awaited<ReturnType<typeof getActivePrescriptions>>[number];
type BatchSuggestion = { number: string; expiryDate: Date } | null;

interface DispenseItem {
  prescriptionItemId: string;
  productId: string;
  productName: string;
  max: number;
  quantity: number;
  selected: boolean;
}

interface Props {
  tenantId: string;
  pharmacistId: string;
  prescriptions: Prescription[];
  onSuccess: () => void;
}

const STATUS_LABEL:   Record<string, string>              = { EMITIDA: "Emitida", PARCIAL: "Parcial" };
const STATUS_VARIANT: Record<string, "success" | "warning"> = { EMITIDA: "success", PARCIAL: "warning" };

export function DispenseRX({ tenantId, pharmacistId, prescriptions, onSuccess }: Props) {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [items, setItems]       = useState<DispenseItem[]>([]);
  const [batches, setBatches]   = useState<Record<string, BatchSuggestion>>({});
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);

  const filtered = query
    ? prescriptions.filter(rx => {
        const name = rx.employee
          ? `${rx.employee.firstName} ${rx.employee.lastName} ${rx.employee.employeeNumber}`
          : rx.dependent
          ? `${rx.dependent.firstName} ${rx.dependent.lastName}`
          : "";
        return name.toLowerCase().includes(query.toLowerCase());
      })
    : prescriptions;

  // Fetch FEFO batch suggestions whenever prescription changes
  useEffect(() => {
    if (!selected) { setBatches({}); return; }
    const ids = selected.items.map(i => i.productId);
    getProductBatchSuggestions(tenantId, ids).then(setBatches);
  }, [selected, tenantId]);

  function selectPrescription(rx: Prescription) {
    setSelected(rx);
    setQuery("");
    setItems(rx.items.map(i => ({
      prescriptionItemId: i.id,
      productId:          i.productId,
      productName:        i.product.genericName,
      max:                i.quantity - i.dispensedQty,
      quantity:           i.quantity - i.dispensedQty,
      selected:           i.quantity - i.dispensedQty > 0,
    })));
    setError("");
  }

  function toggleItem(id: string) {
    setItems(prev => prev.map(i => i.prescriptionItemId === id ? { ...i, selected: !i.selected } : i));
  }

  function setQty(id: string, qty: number) {
    setItems(prev => prev.map(i =>
      i.prescriptionItemId === id ? { ...i, quantity: Math.min(Math.max(1, qty), i.max) } : i
    ));
  }

  async function handleDispense() {
    if (!selected) return;
    const toDispense = items.filter(i => i.selected && i.quantity > 0);
    if (toDispense.length === 0) { setError("Selecciona al menos un medicamento."); return; }

    setSaving(true);
    setError("");
    const result = await dispenseWithPrescription(tenantId, pharmacistId, {
      prescriptionId: selected.id,
      items: toDispense.map(i => ({
        prescriptionItemId: i.prescriptionItemId,
        productId:          i.productId,
        quantity:           i.quantity,
      })),
    });
    setSaving(false);

    if (!result.success) { setError(result.error); return; }
    setSelected(null);
    setItems([]);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      {!selected ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Buscar receta activa</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre o número de empleado..."
              className="w-full bg-input-bg rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-iron-gray mx-auto mb-2" />
              <p className="text-[13px] text-slate-gray">
                {query ? "Sin recetas que coincidan" : "No hay recetas activas pendientes"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filtered.map(rx => {
                const patient = rx.employee
                  ? `${rx.employee.lastName}, ${rx.employee.firstName}`
                  : rx.dependent
                  ? `${rx.dependent.lastName}, ${rx.dependent.firstName}`
                  : "Sin paciente";
                const daysLeft = Math.ceil((new Date(rx.expiresAt).getTime() - Date.now()) / 86400000);

                return (
                  <button
                    key={rx.id}
                    onClick={() => selectPrescription(rx)}
                    className="w-full text-left bg-input-bg rounded-[8px] px-4 py-3 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] text-pure-white font-medium">{patient}</p>
                        {rx.employee && (
                          <p className="text-[11px] text-slate-gray font-mono mt-0.5">{rx.employee.employeeNumber}</p>
                        )}
                        <p className="text-[11px] text-slate-gray mt-1">
                          Dr. {rx.doctor.name} · {new Date(rx.createdAt).toLocaleDateString("es-HN")}
                        </p>
                        <p className="text-[11px] text-iron-gray">
                          {rx.items.length} medicamento{rx.items.length !== 1 ? "s" : ""}
                          {" · "}Vence en {daysLeft} día{daysLeft !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[rx.status]}>{STATUS_LABEL[rx.status]}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected prescription header */}
          <div className="flex items-center justify-between bg-input-bg rounded-[8px] px-4 py-3">
            <div>
              <p className="text-[13px] text-pure-white font-medium">
                {selected.employee
                  ? `${selected.employee.lastName}, ${selected.employee.firstName}`
                  : selected.dependent
                  ? `${selected.dependent.lastName}, ${selected.dependent.firstName}`
                  : "—"}
              </p>
              <p className="text-[11px] text-slate-gray mt-0.5">
                Dr. {selected.doctor.name} · Vence: {new Date(selected.expiresAt).toLocaleDateString("es-HN")}
              </p>
            </div>
            <button
              onClick={() => { setSelected(null); setItems([]); setError(""); }}
              className="text-iron-gray hover:text-pure-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map(item => {
              const batch = batches[item.productId];
              return (
                <div
                  key={item.prescriptionItemId}
                  className={`flex items-start gap-3 rounded-[8px] px-4 py-3 transition-colors ${
                    item.selected ? "bg-input-bg" : "bg-[#1e1c1a]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(item.prescriptionItemId)}
                    disabled={item.max === 0}
                    className="accent-sunbeam-yellow w-3.5 h-3.5 shrink-0 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium ${item.max === 0 ? "text-iron-gray" : "text-pure-white"}`}>
                      {item.productName}
                    </p>
                    {item.max === 0 ? (
                      <p className="text-[11px] text-iron-gray flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> Ya dispensado
                      </p>
                    ) : batch ? (
                      <p className="text-[11px] text-iron-gray mt-0.5">
                        Lote <span className="font-mono text-slate-gray">{batch.number}</span>
                        {" · "}Vence {new Date(batch.expiryDate).toLocaleDateString("es-HN")}
                      </p>
                    ) : (
                      <p className="text-[11px] text-blaze-orange mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Sin stock disponible
                      </p>
                    )}
                  </div>
                  {item.selected && item.max > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={item.max}
                        value={item.quantity}
                        onChange={e => setQty(item.prescriptionItemId, Number(e.target.value))}
                        className="w-16 bg-[#1a1919] rounded-[4px] px-2 py-1 text-[13px] text-pure-white text-center focus:outline-none tabular-nums"
                      />
                      <span className="text-[11px] text-iron-gray">/ {item.max}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
              <p className="text-[13px] text-blaze-orange">{error}</p>
            </div>
          )}

          <Button size="md" onClick={handleDispense} disabled={saving} className="w-full">
            {saving ? "Procesando..." : "Confirmar dispensación"}
          </Button>
        </div>
      )}
    </div>
  );
}
