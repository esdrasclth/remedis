import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Stethoscope, Calendar, Pencil, UserPlus } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getEmployee } from "@/lib/actions/patients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const GENDER_LABEL: Record<string, string> = { MASCULINO: "Masculino", FEMENINO: "Femenino", OTRO: "Otro" };
const REL_LABEL: Record<string, string> = {
  CONYUGUE: "Cónyuge", HIJO: "Hijo", HIJA: "Hija", PADRE: "Padre", MADRE: "Madre", OTRO: "Otro",
};

const APPT_STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "muted" | "danger"> = {
  PROGRAMADA: "info", CONFIRMADA: "success", EN_CONSULTA: "warning",
  COMPLETADA: "muted", CANCELADA: "danger", NO_ASISTIO: "muted",
};
const APPT_STATUS_LABEL: Record<string, string> = {
  PROGRAMADA: "Programada", CONFIRMADA: "Confirmada", EN_CONSULTA: "En consulta",
  COMPLETADA: "Completada", CANCELADA: "Cancelada", NO_ASISTIO: "No asistió",
};

export default async function PatientDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const employee = await getEmployee(tenantId, employeeId);
  if (!employee) notFound();

  const age = employee.birthDate
    ? Math.floor((Date.now() - new Date(employee.birthDate).getTime()) / (365.25 * 86400000))
    : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patients" className="text-iron-gray hover:text-pure-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[20px] font-medium text-pure-white">
              {employee.lastName}, {employee.firstName}
            </h1>
            <p className="text-[13px] text-slate-gray mt-0.5 font-mono">{employee.employeeNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/appointments/new?employeeId=${employee.id}`}>
            <Button size="sm"><Calendar className="w-3.5 h-3.5" /> Agendar cita</Button>
          </Link>
          <Link href={`/medical-records/new?employeeId=${employee.id}`}>
            <Button size="sm"><Stethoscope className="w-3.5 h-3.5" /> Nueva consulta</Button>
          </Link>
          <Link href={`/patients/${employee.id}/edit`}>
            <Button variant="ghost" size="sm"><Pencil className="w-3.5 h-3.5" /> Editar</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 auto-rows-min">
        {/* Info card */}
        <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
          <h2 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Información personal</h2>
          <dl className="space-y-2.5">
            {[
              ["Género",       employee.gender ? GENDER_LABEL[employee.gender] : "—"],
              ["Edad",         age !== null ? `${age} años` : "—"],
              ["Fecha nac.",   employee.birthDate ? new Date(employee.birthDate).toLocaleDateString("es-HN") : "—"],
              ["Teléfono",     employee.phone ?? "—"],
              ["Correo",       employee.email ?? "—"],
              ["Departamento", employee.department ?? "—"],
              ["Cargo",        employee.position ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <dt className="text-[12px] text-slate-gray shrink-0">{label}</dt>
                <dd className="text-[12px] text-pure-white text-right truncate">{value}</dd>
              </div>
            ))}
          </dl>

          {employee.medicalHistory && (
            <>
              <div className="h-px bg-white/[0.06]" />
              <h2 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Antecedentes</h2>
              <dl className="space-y-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-[12px] text-slate-gray">Tipo sangre</dt>
                  <dd className="text-[12px] text-pure-white">{employee.medicalHistory.bloodType?.replace("_", " ") ?? "—"}</dd>
                </div>
                {employee.medicalHistory.allergies.length > 0 && (
                  <div>
                    <dt className="text-[12px] text-slate-gray mb-1">Alergias</dt>
                    <dd className="flex flex-wrap gap-1">
                      {employee.medicalHistory.allergies.map(a => (
                        <Badge key={a} variant="danger">{a}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {employee.medicalHistory.chronicConditions.length > 0 && (
                  <div>
                    <dt className="text-[12px] text-slate-gray mb-1">Enfermedades crónicas</dt>
                    <dd className="flex flex-wrap gap-1">
                      {employee.medicalHistory.chronicConditions.map(c => (
                        <Badge key={c} variant="warning">{c}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>

        {/* Dependents */}
        <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Dependientes</h2>
            <Link href={`/patients/${employee.id}/dependents/new`} className="text-iron-gray hover:text-sunbeam-yellow transition-colors" title="Nuevo dependiente">
              <UserPlus className="w-4 h-4" />
            </Link>
          </div>
          {employee.dependents.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-[12px] text-iron-gray">Sin dependientes registrados</p>
              <Link href={`/patients/${employee.id}/dependents/new`} className="text-[12px] text-sunbeam-yellow hover:underline mt-1 inline-block">
                Agregar dependiente
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {employee.dependents.map(d => {
                const age = d.birthDate
                  ? Math.floor((Date.now() - new Date(d.birthDate).getTime()) / (365.25 * 86400000))
                  : null;
                return (
                  <div key={d.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-[13px] text-pure-white font-medium">{d.lastName}, {d.firstName}</p>
                      <p className="text-[11px] text-slate-gray">
                        {REL_LABEL[d.relationship] ?? d.relationship}
                        {age !== null && ` · ${age} años`}
                      </p>
                    </div>
                    {d.gender && <span className="text-[11px] text-iron-gray">{GENDER_LABEL[d.gender]}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointments */}
        <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
          <h2 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Últimas citas</h2>
          {employee.appointments.length === 0 ? (
            <p className="text-[12px] text-iron-gray">Sin citas registradas</p>
          ) : (
            <div className="space-y-2">
              {employee.appointments.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div>
                    <p className="text-[12px] text-pure-white">
                      {new Date(a.scheduledAt).toLocaleDateString("es-HN")}
                    </p>
                    <p className="text-[11px] text-slate-gray">{a.doctor.name}</p>
                  </div>
                  <Badge variant={APPT_STATUS_VARIANT[a.status]}>{APPT_STATUS_LABEL[a.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical records */}
        <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
          <h2 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Últimas consultas</h2>
          {employee.medicalRecords.length === 0 ? (
            <p className="text-[12px] text-iron-gray">Sin consultas registradas</p>
          ) : (
            <div className="space-y-2">
              {employee.medicalRecords.map(r => (
                <Link
                  key={r.id}
                  href={`/medical-records/${r.id}`}
                  className="block py-1.5 hover:opacity-80 transition-opacity"
                >
                  <p className="text-[12px] text-pure-white">
                    {new Date(r.createdAt).toLocaleDateString("es-HN")}
                  </p>
                  <p className="text-[11px] text-slate-gray">{r.doctor.name}</p>
                  {r.diagnoses.slice(0, 1).map(d => (
                    <p key={d.id} className="text-[10px] text-iron-gray font-mono mt-0.5">
                      {d.cie10Code} — {d.description}
                    </p>
                  ))}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
