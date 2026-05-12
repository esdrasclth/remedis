"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { recordDelivery } from "@/lib/actions/permanent-meds";
import { getProductBatchSuggestions } from "@/lib/actions/pharmacy";
import type { getPermanentMeds } from "@/lib/actions/permanent-meds";

type PermanentMed = Awaited<ReturnType<typeof getPermanentMeds>>[number];
type BatchSuggestion = { number: string; expiryDate: Date } | null;

const MS_PER_DAY = 86_400_000;

function getNextDeliveryDate(med: PermanentMed): Date {
  const base = med.deliveries[0]?.deliveredAt ?? med.startDate;
  const next = new Date(base);
  next.setDate(next.getDate() + 30);
  return next;
}

function DeliveryInfo({ med, batch }: { med: PermanentMed; batch: BatchSuggestion }) {
  const next      = getNextDeliveryDate(med);
  const daysUntil = Math.ceil((next.getTime() - Date.now()) / MS_PER_DAY);
  const overdue   = daysUntil <= 0;
  const soon      = daysUntil > 0 && daysUntil <= 5;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        {overdue ? (
          <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange shrink-0" />
        ) : soon ? (
          <Clock className="w-3.5 h-3.5 text-sunbeam-yellow shrink-0" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-green shrink-0" />
        )}
        <span className={`text-[12px] ${overdue ? "text-blaze-orange" : soon ? "text-sunbeam-yellow" : "text-emerald-green"}`}>
          {overdue
            ? `Atrasada ${Math.abs(daysUntil)} día${Math.abs(daysUntil) !== 1 ? "s" : ""}`
            : `Próxima entrega en ${daysUntil} día${daysUntil !== 1 ? "s" : ""}`}
        </span>
      </div>
      <p className="text-[11px] text-iron-gray pl-5">
        {overdue ? "Debió entregarse el" : "Fecha:"} {next.toLocaleDateString("es-HN")}
        {med.deliveries[0] && (
          <span className="ml-2">· Última: {new Date(med.deliveries[0].deliveredAt).toLocaleDateString("es-HN")} ({med.deliveries[0].quantity} u.)</span>
        )}
      </p>
      {batch ? (
        <p className="text-[11px] text-iron-gray pl-5">
          Entregar lote <span className="font-mono text-slate-gray">{batch.number}</span>
          {" · "}Vence {new Date(batch.expiryDate).toLocaleDateString("es-HN")}
        </p>
      ) : (
        <p className="text-[11px] text-blaze-orange pl-5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Sin stock disponible
        </p>
      )}
    </div>
  );
}

interface Props {
  tenantId: string;
  pharmacistId: string;
  meds: PermanentMed[];
  onSuccess: () => void;
}

export function DispensePermanent({ tenantId, pharmacistId, meds, onSuccess }: Props) {
  const [delivering, setDelivering] = useState<string | null>(null);
  const [batches, setBatches]       = useState<Record<string, BatchSuggestion>>({});

  useEffect(() => {
    if (meds.length === 0) return;
    const ids = [...new Set(meds.map(m => m.productId))];
    getProductBatchSuggestions(tenantId, ids).then(setBatches);
  }, [meds, tenantId]);

  const sorted = [...meds].sort((a, b) =>
    getNextDeliveryDate(a).getTime() - getNextDeliveryDate(b).getTime()
  );

  if (meds.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[13px] text-slate-gray">No hay medicamentos permanentes registrados.</p>
        <p className="text-[11px] text-iron-gray mt-1">Asigna pacientes desde Med. Permanentes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(med => {
        const next     = getNextDeliveryDate(med);
        const daysUntil = Math.ceil((next.getTime() - Date.now()) / MS_PER_DAY);
        const overdue  = daysUntil <= 0;
        const batch    = batches[med.productId] ?? null;

        return (
          <div
            key={med.id}
            className={`rounded-[8px] p-3 space-y-2 ${overdue ? "bg-blaze-orange/[0.08] border border-blaze-orange/20" : "bg-input-bg"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] text-pure-white font-medium truncate">
                  {med.employee.lastName}, {med.employee.firstName}
                </p>
                <p className="text-[11px] text-slate-gray">
                  {med.product.genericName} · {med.dose} · {med.frequency}
                </p>
              </div>
              {overdue && <Badge variant="danger">Atrasado</Badge>}
            </div>
            <DeliveryInfo med={med} batch={batch} />
            <Button
              size="sm"
              variant={overdue ? "primary" : "secondary"}
              onClick={() => setDelivering(med.id)}
              disabled={!batch}
              className="w-full mt-1"
            >
              <Clock className="w-3.5 h-3.5" />
              {batch ? "Entregar" : "Sin stock"}
            </Button>
          </div>
        );
      })}

      {delivering && (
        <DeliveryModal
          tenantId={tenantId}
          pharmacistId={pharmacistId}
          med={meds.find(m => m.id === delivering)!}
          batch={batches[meds.find(m => m.id === delivering)!.productId] ?? null}
          onClose={() => setDelivering(null)}
          onSuccess={() => { setDelivering(null); onSuccess(); }}
        />
      )}
    </div>
  );
}

// ─── Delivery Modal ───────────────────────────────────────────────────────────

function DeliveryModal({ tenantId, pharmacistId, med, batch, onClose, onSuccess }: {
  tenantId: string; pharmacistId: string;
  med: PermanentMed; batch: BatchSuggestion;
  onClose: () => void; onSuccess: () => void;
}) {
  const next = getNextDeliveryDate(med);
  const [quantity, setQuantity] = useState("30");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const result = await recordDelivery(tenantId, { permanentMedId: med.id, quantity, pharmacistId, notes });
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1c1b] rounded-[12px] w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-pure-white">Registrar entrega</h2>
          <button onClick={onClose} className="text-iron-gray hover:text-pure-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Patient + product */}
        <div className="bg-input-bg rounded-[8px] px-4 py-3 space-y-1">
          <p className="text-[13px] text-pure-white font-medium">
            {med.employee.lastName}, {med.employee.firstName}
          </p>
          <p className="text-[12px] text-slate-gray">
            {med.product.genericName} · {med.dose} · {med.frequency}
          </p>
          <p className="text-[11px] text-iron-gray">
            Próxima entrega programada: {next.toLocaleDateString("es-HN")}
          </p>
        </div>

        {/* FEFO batch suggestion */}
        {batch ? (
          <div className="bg-table-header rounded-[8px] px-4 py-2.5 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[11px] text-slate-gray uppercase tracking-wide">Lote a entregar (FEFO)</p>
              <p className="text-[13px] text-pure-white font-mono mt-0.5">{batch.number}</p>
              <p className="text-[11px] text-iron-gray">
                Vence: {new Date(batch.expiryDate).toLocaleDateString("es-HN")}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blaze-orange/10 rounded-[8px] px-4 py-2.5">
            <p className="text-[12px] text-blaze-orange">Sin stock disponible para este medicamento.</p>
          </div>
        )}

        <Input
          label="Cantidad a entregar"
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />
        <Input
          label="Notas (opcional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {error && <p className="text-[12px] text-blaze-orange">{error}</p>}

        <div className="flex gap-3">
          <Button size="md" onClick={handleSave} disabled={saving || !quantity || !batch} className="flex-1">
            {saving ? "Registrando..." : "Confirmar entrega"}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
