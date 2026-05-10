"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAppointment } from "@/lib/actions/appointments";
import { searchEmployees } from "@/lib/actions/patients";
import type { getClinics, getDoctors } from "@/lib/actions/appointments";

type Clinic = Awaited<ReturnType<typeof getClinics>>[number];
type Doctor = Awaited<ReturnType<typeof getDoctors>>[number];

interface Props {
  tenantId: string;
  clinics: Clinic[];
  doctors: Doctor[];
}

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string | null;
}

export function AppointmentForm({ tenantId, clinics, doctors }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [patientQuery, setPatientQuery]   = useState("");
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedPatient) return;
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!patientQuery) { setPatientResults([]); return; }

    searchRef.current = setTimeout(async () => {
      const results = await searchEmployees(tenantId, patientQuery);
      setPatientResults(results);
    }, 250);
  }, [patientQuery, tenantId, selectedPatient]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPatient) { setError("Selecciona un paciente."); return; }

    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError("");

    const result = await createAppointment(tenantId, {
      clinicId:    fd.get("clinicId")    as string,
      doctorId:    fd.get("doctorId")    as string,
      employeeId:  selectedPatient.id,
      type:        fd.get("type")        as string,
      scheduledAt: fd.get("scheduledAt") as string,
      duration:    Number(fd.get("duration")),
      notes:       fd.get("notes")       as string,
    });

    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    router.push("/appointments");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient search */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Paciente</h3>

        {selectedPatient ? (
          <div className="flex items-center justify-between bg-[#2a2825] rounded-[8px] px-4 py-3">
            <div>
              <p className="text-[13px] text-pure-white font-medium">
                {selectedPatient.lastName}, {selectedPatient.firstName}
              </p>
              <p className="text-[11px] text-slate-gray font-mono mt-0.5">
                {selectedPatient.employeeNumber}
                {selectedPatient.department && ` · ${selectedPatient.department}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedPatient(null); setPatientQuery(""); }}
              className="text-iron-gray hover:text-pure-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
            <input
              value={patientQuery}
              onChange={e => setPatientQuery(e.target.value)}
              placeholder="Buscar empleado por nombre o número..."
              className="w-full bg-[#2a2825] rounded-[8px] pl-9 pr-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none transition-colors h-9"
            />
            {patientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2825] rounded-[8px] overflow-hidden z-10">
                {patientResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedPatient(p); setPatientResults([]); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] transition-colors"
                  >
                    <p className="text-[13px] text-pure-white">{p.lastName}, {p.firstName}</p>
                    <p className="text-[11px] text-slate-gray font-mono">
                      {p.employeeNumber}{p.department && ` · ${p.department}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Schedule */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Programación</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select name="clinicId" label="Sede" required defaultValue={clinics[0]?.id ?? ""}>
            {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select name="doctorId" label="Médico" required defaultValue={doctors[0]?.id ?? ""}>
            <option value="">Seleccionar médico</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              name="scheduledAt" label="Fecha y hora" type="datetime-local" required
            />
          </div>
          <Select name="duration" label="Duración" defaultValue="30">
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </Select>
        </div>
        <Select name="type" label="Tipo de cita" defaultValue="PRIMERA_VEZ">
          <option value="PRIMERA_VEZ">Primera vez</option>
          <option value="CONTROL">Control</option>
          <option value="URGENCIA">Urgencia</option>
          <option value="SEGUIMIENTO">Seguimiento</option>
        </Select>
        <Textarea name="notes" label="Notas (opcional)" rows={3} placeholder="Motivo de consulta..." />
      </section>

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={loading}>
          {loading ? "Guardando..." : "Agendar cita"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
