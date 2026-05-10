"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createMedicalRecord, getMedicationProducts } from "@/lib/actions/medical-records";
import { searchCie10 } from "@/lib/cie10";
import type { DiagnosisInput, PrescriptionItemInput } from "@/lib/validations/medical-records";
import type { getAppointments } from "@/lib/actions/appointments";

type AppointmentRow = Awaited<ReturnType<typeof getAppointments>>[number];

interface Props {
  tenantId: string;
  doctorId: string;
  appointment?: AppointmentRow | null;
}

interface RxItem extends PrescriptionItemInput {
  productName: string;
}

export function RecordForm({ tenantId, doctorId, appointment }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // SOAP
  const [subjective, setSubjective] = useState("");
  const [objective,  setObjective]  = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan,       setPlan]       = useState("");
  const [notes,      setNotes]      = useState("");
  const [referral,   setReferral]   = useState("");

  // Vital signs
  const [vitals, setVitals] = useState<Record<string, string>>({});
  function setVital(key: string, val: string) {
    setVitals(prev => ({ ...prev, [key]: val }));
  }

  // Diagnoses
  const [diagnoses, setDiagnoses] = useState<DiagnosisInput[]>([]);
  const [dxQuery, setDxQuery]     = useState("");
  const dxResults = searchCie10(dxQuery);

  function addDiagnosis(code: string, description: string) {
    if (diagnoses.find(d => d.cie10Code === code)) return;
    setDiagnoses(prev => [
      ...prev,
      { cie10Code: code, description, isPrimary: prev.length === 0 },
    ]);
    setDxQuery("");
  }
  function removeDiagnosis(code: string) {
    setDiagnoses(prev => {
      const next = prev.filter(d => d.cie10Code !== code);
      if (next.length > 0 && !next.some(d => d.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  }
  function setPrimary(code: string) {
    setDiagnoses(prev => prev.map(d => ({ ...d, isPrimary: d.cie10Code === code })));
  }

  // Prescription
  const [rxItems, setRxItems]     = useState<RxItem[]>([]);
  const [rxQuery, setRxQuery]     = useState("");
  const [rxResults, setRxResults] = useState<{ id: string; genericName: string; commercialName: string | null; unit: string | null }[]>([]);
  const rxRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rxForm, setRxForm]       = useState<{ productId: string; productName: string; dose: string; frequency: string; duration: string; instructions: string; quantity: string } | null>(null);

  useEffect(() => {
    if (rxRef.current) clearTimeout(rxRef.current);
    if (!rxQuery) { setRxResults([]); return; }
    rxRef.current = setTimeout(async () => {
      const r = await getMedicationProducts(tenantId, rxQuery);
      setRxResults(r);
    }, 250);
  }, [rxQuery, tenantId]);

  function selectRxProduct(p: { id: string; genericName: string; commercialName: string | null }) {
    setRxForm({ productId: p.id, productName: p.genericName, dose: "", frequency: "", duration: "", instructions: "", quantity: "1" });
    setRxQuery("");
    setRxResults([]);
  }

  function addRxItem() {
    if (!rxForm) return;
    setRxItems(prev => [...prev, {
      productId:    rxForm.productId,
      productName:  rxForm.productName,
      dose:         rxForm.dose,
      frequency:    rxForm.frequency,
      duration:     rxForm.duration,
      instructions: rxForm.instructions || undefined,
      quantity:     Number(rxForm.quantity) || 1,
    }]);
    setRxForm(null);
  }
  function removeRxItem(idx: number) {
    setRxItems(prev => prev.filter((_, i) => i !== idx));
  }

  const patientName = appointment?.employee
    ? `${appointment.employee.lastName}, ${appointment.employee.firstName}`
    : appointment?.dependent
    ? `${appointment.dependent.lastName}, ${appointment.dependent.firstName}`
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const parsedVitals: Record<string, number> = {};
    for (const [k, v] of Object.entries(vitals)) {
      const n = parseFloat(v);
      if (!isNaN(n)) parsedVitals[k] = n;
    }

    const result = await createMedicalRecord(tenantId, doctorId, {
      appointmentId: appointment?.id,
      employeeId:    appointment?.employeeId  ?? undefined,
      dependentId:   appointment?.dependentId ?? undefined,
      subjective,  objective, assessment, plan, notes, referral,
      vitalSigns: Object.keys(parsedVitals).length > 0 ? parsedVitals : undefined,
      diagnoses,
      prescriptionItems: rxItems,
      prescriptionExpireDays: 30,
    });

    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    router.push(`/medical-records/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Patient banner */}
      {appointment && (
        <div className="bg-[#2a2825] rounded-[8px] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] text-pure-white font-medium">{patientName}</p>
            <p className="text-[11px] text-slate-gray mt-0.5">
              {appointment.employee?.employeeNumber && `${appointment.employee.employeeNumber} · `}
              {new Date(appointment.scheduledAt).toLocaleDateString("es-HN")}
            </p>
          </div>
          <Badge variant="info">{appointment.type.replace("_", " ")}</Badge>
        </div>
      )}

      {/* Vital Signs */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Signos vitales</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "weight",          label: "Peso (kg)",       placeholder: "70.5" },
            { key: "height",          label: "Talla (cm)",      placeholder: "170" },
            { key: "systolicBp",      label: "Sistólica (mmHg)",placeholder: "120" },
            { key: "diastolicBp",     label: "Diastólica (mmHg)",placeholder: "80" },
            { key: "heartRate",       label: "FC (lpm)",        placeholder: "72" },
            { key: "temperature",     label: "Temperatura (°C)",placeholder: "36.5" },
            { key: "glucose",         label: "Glucosa (mg/dL)", placeholder: "90" },
            { key: "spo2",            label: "SpO₂ (%)",        placeholder: "98" },
            { key: "respiratoryRate", label: "FR (rpm)",        placeholder: "16" },
          ].map(f => (
            <Input
              key={f.key}
              label={f.label}
              type="number"
              step="any"
              placeholder={f.placeholder}
              value={vitals[f.key] ?? ""}
              onChange={e => setVital(f.key, e.target.value)}
            />
          ))}
        </div>
      </section>

      {/* SOAP */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Notas SOAP</h3>
        <div className="grid grid-cols-2 gap-4">
          <Textarea label="Subjetivo" rows={4} placeholder="Motivo de consulta, síntomas referidos..." value={subjective} onChange={e => setSubjective(e.target.value)} />
          <Textarea label="Objetivo" rows={4} placeholder="Hallazgos físicos, resultados de laboratorio..." value={objective} onChange={e => setObjective(e.target.value)} />
          <Textarea label="Evaluación / Diagnóstico" rows={4} placeholder="Impresión diagnóstica, diferencial..." value={assessment} onChange={e => setAssessment(e.target.value)} />
          <Textarea label="Plan" rows={4} placeholder="Tratamiento, indicaciones, seguimiento..." value={plan} onChange={e => setPlan(e.target.value)} />
        </div>
        <Textarea label="Notas adicionales" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        <Input label="Referido a" placeholder="Especialista o institución..." value={referral} onChange={e => setReferral(e.target.value)} />
      </section>

      {/* Diagnoses */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Diagnósticos CIE-10</h3>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            value={dxQuery}
            onChange={e => setDxQuery(e.target.value)}
            placeholder="Buscar por código o descripción..."
            className="w-full bg-[#2a2825] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
          />
          {dxResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2825] rounded-[8px] overflow-hidden z-10">
              {dxResults.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => addDiagnosis(c.code, c.description)}
                  className="w-full text-left px-4 py-2 hover:bg-white/[0.06] transition-colors flex items-center gap-3"
                >
                  <span className="font-mono text-[11px] text-sunbeam-yellow w-16 shrink-0">{c.code}</span>
                  <span className="text-[12px] text-pure-white">{c.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {diagnoses.length > 0 && (
          <div className="space-y-1.5">
            {diagnoses.map(d => (
              <div key={d.cie10Code} className="flex items-center gap-3 bg-[#2a2825] rounded-[6px] px-3 py-2">
                <span className="font-mono text-[11px] text-sunbeam-yellow w-14 shrink-0">{d.cie10Code}</span>
                <span className="text-[12px] text-pure-white flex-1">{d.description}</span>
                <button
                  type="button"
                  onClick={() => setPrimary(d.cie10Code)}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors ${d.isPrimary ? "bg-sunbeam-yellow/20 text-sunbeam-yellow" : "text-iron-gray hover:text-slate-gray"}`}
                >
                  {d.isPrimary ? "Principal" : "Secundario"}
                </button>
                <button type="button" onClick={() => removeDiagnosis(d.cie10Code)} className="text-iron-gray hover:text-blaze-orange transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Prescription */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Receta médica <span className="normal-case font-normal text-iron-gray">(opcional)</span></h3>

        {rxItems.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {rxItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#2a2825] rounded-[6px] px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-pure-white font-medium truncate">{item.productName}</p>
                  <p className="text-[11px] text-slate-gray">
                    {item.dose} · {item.frequency} · {item.duration}
                    {item.quantity > 1 && ` · ×${item.quantity}`}
                  </p>
                </div>
                <button type="button" onClick={() => removeRxItem(i)} className="text-iron-gray hover:text-blaze-orange transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {rxForm ? (
          <div className="bg-[#2a2825] rounded-[8px] p-4 space-y-3">
            <p className="text-[12px] text-sunbeam-yellow font-medium">{rxForm.productName}</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Dosis" placeholder="500 mg" value={rxForm.dose} onChange={e => setRxForm(p => p && { ...p, dose: e.target.value })} />
              <Input label="Frecuencia" placeholder="Cada 8h" value={rxForm.frequency} onChange={e => setRxForm(p => p && { ...p, frequency: e.target.value })} />
              <Input label="Duración" placeholder="7 días" value={rxForm.duration} onChange={e => setRxForm(p => p && { ...p, duration: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Instrucciones (opcional)" placeholder="Tomar con alimentos..." value={rxForm.instructions} onChange={e => setRxForm(p => p && { ...p, instructions: e.target.value })} />
              <Input label="Cantidad" type="number" min={1} value={rxForm.quantity} onChange={e => setRxForm(p => p && { ...p, quantity: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={addRxItem} disabled={!rxForm.dose || !rxForm.frequency || !rxForm.duration}>
                <Plus className="w-3.5 h-3.5" /> Agregar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRxForm(null)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
            <input
              value={rxQuery}
              onChange={e => setRxQuery(e.target.value)}
              placeholder="Buscar medicamento para agregar..."
              className="w-full bg-[#2a2825] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none h-9"
            />
            {rxResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2825] rounded-[8px] overflow-hidden z-10">
                {rxResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectRxProduct(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors"
                  >
                    <p className="text-[13px] text-pure-white">{p.genericName}</p>
                    {p.commercialName && <p className="text-[11px] text-slate-gray">{p.commercialName}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={saving}>
          {saving ? "Guardando..." : "Guardar consulta"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
