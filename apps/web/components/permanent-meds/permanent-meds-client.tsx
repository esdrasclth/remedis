"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Plus, Search, X, Pill, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getPermanentMeds, createPermanentMed, recordDelivery, deactivatePermanentMed,
  searchMedPatients, searchMedProducts,
} from "@/lib/actions/permanent-meds";

type PermanentMed = Awaited<ReturnType<typeof getPermanentMeds>>[number];
type Patient = { id: string; firstName: string; lastName: string; employeeNumber: string; department: string | null };
type Product = { id: string; genericName: string; commercialName: string | null; unit: string | null; totalStock: number };

const MS_PER_DAY = 86_400_000;

function getNextDeliveryDate(med: PermanentMed): Date {
  const base = med.deliveries[0]?.deliveredAt ?? med.startDate;
  const next = new Date(base);
  next.setDate(next.getDate() + 30);
  return next;
}

function DeliveryStatus({ med }: { med: PermanentMed }) {
  const next      = getNextDeliveryDate(med);
  const daysUntil = Math.ceil((next.getTime() - Date.now()) / MS_PER_DAY);
  const overdue   = daysUntil <= 0;
  const soon      = daysUntil > 0 && daysUntil <= 5;
  const last      = med.deliveries[0];

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        {overdue
          ? <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange" />
          : soon
          ? <Clock className="w-3.5 h-3.5 text-sunbeam-yellow" />
          : <CheckCircle className="w-3.5 h-3.5 text-emerald-green" />}
        <span className={`text-[12px] ${overdue ? "text-blaze-orange" : soon ? "text-sunbeam-yellow" : "text-emerald-green"}`}>
          {overdue
            ? `Atrasada ${Math.abs(daysUntil)} día${Math.abs(daysUntil) !== 1 ? "s" : ""}`
            : `Próxima entrega en ${daysUntil} día${daysUntil !== 1 ? "s" : ""}`}
        </span>
      </div>
      <p className="text-[11px] text-iron-gray pl-5">
        {overdue ? "Debió entregarse el" : "Fecha:"} {next.toLocaleDateString("es-HN")}
        {last && (
          <span className="ml-2">· Última: {new Date(last.deliveredAt).toLocaleDateString("es-HN")} ({last.quantity} u.)</span>
        )}
        {!last && <span className="ml-2">· Sin entregas previas</span>}
      </p>
    </div>
  );
}

interface Props {
  tenantId: string;
  pharmacistId: string;
  initialMeds: PermanentMed[];
}

export function PermanentMedsClient({ tenantId, pharmacistId, initialMeds }: Props) {
  const [meds, setMeds]           = useState(initialMeds);
  const [showNew, setShowNew]     = useState(false);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [, startTransition]       = useTransition();
  const [filter, setFilter]       = useState<"all" | "overdue" | "ok">("all");

  async function reload() {
    const fresh = await getPermanentMeds(tenantId);
    setMeds(fresh);
  }

  function isOverdue(m: PermanentMed) {
    return getNextDeliveryDate(m).getTime() <= Date.now();
  }

  const filtered     = meds.filter(m => filter === "all" ? true : filter === "overdue" ? isOverdue(m) : !isOverdue(m));
  const overdueCount = meds.filter(isOverdue).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Medicamentos Permanentes</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {meds.length} paciente{meds.length !== 1 ? "s" : ""} registrado{meds.length !== 1 ? "s" : ""}
            {overdueCount > 0 && (
              <span className="ml-2 text-blaze-orange">{overdueCount} con entrega pendiente</span>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5" /> Asignar medicamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-[#1a1919] rounded-[6px] p-0.5 w-fit">
        {([
          { key: "all",     label: "Todos" },
          { key: "overdue", label: `Pendientes (${overdueCount})` },
          { key: "ok",      label: "Al día" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-[4px] text-[12px] font-medium transition-colors ${filter === key ? "bg-sunbeam-yellow text-charcoal-black" : "text-slate-gray hover:text-pure-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Pill className="w-8 h-8 text-iron-gray mx-auto mb-3" />
          <p className="text-[13px] text-slate-gray">
            {filter === "all" ? "No hay medicamentos permanentes registrados." : "No hay registros en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(med => (
            <div key={med.id} className="bg-ash-gray rounded-[12px] p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[14px] text-pure-white font-medium">
                    {med.employee.lastName}, {med.employee.firstName}
                  </p>
                  <span className="font-mono text-[11px] text-slate-gray">{med.employee.employeeNumber}</span>
                  {med.employee.department && (
                    <Badge variant="muted">{med.employee.department}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-[13px] text-pure-white">{med.product.genericName}</span>
                  <span className="text-[12px] text-iron-gray">{med.dose} · {med.frequency}</span>
                  {med.notes && <span className="text-[11px] text-iron-gray italic">{med.notes}</span>}
                </div>
                <div className="mt-2">
                  <DeliveryStatus med={med} />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" onClick={() => setDelivering(med.id)}>
                  <Clock className="w-3.5 h-3.5" /> Registrar entrega
                </Button>
                <Button variant="ghost" size="sm" onClick={async () => {
                  if (!confirm("¿Desactivar este medicamento permanente?")) return;
                  await deactivatePermanentMed(tenantId, med.id);
                  startTransition(() => { reload(); });
                }}>
                  Desactivar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New assignment modal */}
      {showNew && (
        <AssignModal
          tenantId={tenantId}
          onClose={() => setShowNew(false)}
          onSuccess={() => { setShowNew(false); startTransition(() => { reload(); }); }}
        />
      )}

      {/* Delivery modal */}
      {delivering && (
        <DeliveryModal
          tenantId={tenantId}
          pharmacistId={pharmacistId}
          med={meds.find(m => m.id === delivering)!}
          onClose={() => setDelivering(null)}
          onSuccess={() => { setDelivering(null); startTransition(() => { reload(); }); }}
        />
      )}
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({ tenantId, onClose, onSuccess }: { tenantId: string; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [patient, setPatient]             = useState<Patient | null>(null);
  const [ptQuery, setPtQuery]             = useState("");
  const [ptResults, setPtResults]         = useState<Patient[]>([]);
  const [product, setProduct]             = useState<Product | null>(null);
  const [prodQuery, setProdQuery]         = useState("");
  const [prodResults, setProdResults]     = useState<Product[]>([]);
  const [dose, setDose]                   = useState("");
  const [frequency, setFrequency]         = useState("");
  const [notes, setNotes]                 = useState("");
  const ptRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prodRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (patient) return;
    if (ptRef.current) clearTimeout(ptRef.current);
    if (!ptQuery) { setPtResults([]); return; }
    ptRef.current = setTimeout(async () => { setPtResults(await searchMedPatients(tenantId, ptQuery)); }, 250);
  }, [ptQuery, tenantId, patient]);

  useEffect(() => {
    if (product) return;
    if (prodRef.current) clearTimeout(prodRef.current);
    if (!prodQuery) { setProdResults([]); return; }
    prodRef.current = setTimeout(async () => { setProdResults(await searchMedProducts(tenantId, prodQuery)); }, 250);
  }, [prodQuery, tenantId, product]);

  async function handleSave() {
    if (!patient || !product) { setError("Selecciona paciente y medicamento."); return; }
    setSaving(true);
    setError("");
    const result = await createPermanentMed(tenantId, { employeeId: patient.id, productId: product.id, dose, frequency, notes });
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1c1b] rounded-[12px] w-full max-w-lg space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-pure-white">Asignar medicamento permanente</h2>
          <button onClick={onClose} className="text-iron-gray hover:text-pure-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Patient */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Paciente</p>
          {patient ? (
            <div className="flex items-center justify-between bg-input-bg rounded-[8px] px-4 py-2.5">
              <div>
                <p className="text-[13px] text-pure-white">{patient.lastName}, {patient.firstName}</p>
                <p className="text-[11px] font-mono text-slate-gray">{patient.employeeNumber}</p>
              </div>
              <button onClick={() => { setPatient(null); setPtQuery(""); }} className="text-iron-gray hover:text-pure-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
              <input value={ptQuery} onChange={e => setPtQuery(e.target.value)} placeholder="Buscar empleado..."
                className="w-full bg-input-bg rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9" />
              {ptResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-input-bg rounded-[8px] overflow-hidden z-10">
                  {ptResults.map(p => (
                    <button key={p.id} type="button" onClick={() => { setPatient(p); setPtResults([]); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors">
                      <p className="text-[13px] text-pure-white">{p.lastName}, {p.firstName}</p>
                      <p className="text-[11px] text-slate-gray font-mono">{p.employeeNumber}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Medicamento</p>
          {product ? (
            <div className="flex items-center justify-between bg-input-bg rounded-[8px] px-4 py-2.5">
              <div>
                <p className="text-[13px] text-pure-white">{product.genericName}</p>
                {product.commercialName && <p className="text-[11px] text-slate-gray">{product.commercialName}</p>}
              </div>
              <button onClick={() => { setProduct(null); setProdQuery(""); }} className="text-iron-gray hover:text-pure-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
              <input value={prodQuery} onChange={e => setProdQuery(e.target.value)} placeholder="Buscar medicamento..."
                className="w-full bg-input-bg rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9" />
              {prodResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-input-bg rounded-[8px] overflow-hidden z-10">
                  {prodResults.map(p => (
                    <button key={p.id} type="button" onClick={() => { setProduct(p); setProdResults([]); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] text-pure-white">{p.genericName}</p>
                        {p.commercialName && <p className="text-[11px] text-slate-gray">{p.commercialName}</p>}
                      </div>
                      <span className={`text-[11px] font-mono shrink-0 ${p.totalStock === 0 ? "text-blaze-orange" : "text-iron-gray"}`}>
                        {p.totalStock} {p.unit ?? "u."}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dose + Frequency */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dosis" placeholder="850 mg" value={dose} onChange={e => setDose(e.target.value)} />
          <Input label="Frecuencia" placeholder="Una vez al día" value={frequency} onChange={e => setFrequency(e.target.value)} />
        </div>
        <Input label="Notas (opcional)" placeholder="Indicaciones adicionales..." value={notes} onChange={e => setNotes(e.target.value)} />

        {error && <p className="text-[12px] text-blaze-orange">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button size="md" onClick={handleSave} disabled={saving || !patient || !product || !dose || !frequency}>
            {saving ? "Guardando..." : "Asignar"}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Modal ───────────────────────────────────────────────────────────

function DeliveryModal({ tenantId, pharmacistId, med, onClose, onSuccess }: {
  tenantId: string; pharmacistId: string; med: PermanentMed;
  onClose: () => void; onSuccess: () => void;
}) {
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
      <div className="bg-[#1e1c1b] rounded-[12px] w-full max-w-sm space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-pure-white">Registrar entrega mensual</h2>
          <button onClick={onClose} className="text-iron-gray hover:text-pure-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="bg-input-bg rounded-[8px] px-4 py-3 space-y-1">
          <p className="text-[13px] text-pure-white font-medium">
            {med.employee.lastName}, {med.employee.firstName}
          </p>
          <p className="text-[12px] text-slate-gray">{med.product.genericName} · {med.dose} · {med.frequency}</p>
        </div>

        <Input
          label="Cantidad a entregar"
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />
        <Input label="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} />

        {error && <p className="text-[12px] text-blaze-orange">{error}</p>}

        <div className="flex gap-3">
          <Button size="md" onClick={handleSave} disabled={saving || !quantity}>
            {saving ? "Registrando..." : "Confirmar entrega"}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
