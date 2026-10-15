"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Calendar, Clock, CheckCircle, XCircle, ArrowRight, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatus } from "@/lib/actions/appointments";
import type { getAppointments } from "@/lib/actions/appointments";

type Appointment = Awaited<ReturnType<typeof getAppointments>>[number];

const STATUS_LABEL: Record<string, string> = {
  PROGRAMADA:   "Programada",
  CONFIRMADA:   "Confirmada",
  EN_CONSULTA:  "En consulta",
  COMPLETADA:   "Completada",
  CANCELADA:    "Cancelada",
  NO_ASISTIO:   "No asistió",
};

const STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "danger" | "muted"> = {
  PROGRAMADA:  "info",
  CONFIRMADA:  "success",
  EN_CONSULTA: "warning",
  COMPLETADA:  "muted",
  CANCELADA:   "danger",
  NO_ASISTIO:  "muted",
};

const TYPE_LABEL: Record<string, string> = {
  PRIMERA_VEZ: "Primera vez",
  CONTROL:     "Control",
  URGENCIA:    "Urgencia",
  SEGUIMIENTO: "Seguimiento",
};

const COL = {
  time:    "w-32  px-4 py-3",
  patient: "w-auto px-4 py-3",
  type:    "w-36  px-4 py-3",
  doctor:  "w-44  px-4 py-3",
  status:  "w-36  px-4 py-3",
  action:  "w-32  px-4 py-3 text-right",
};

interface Props {
  appointments: Appointment[];
  tenantId: string;
  today: string;
}

export function AppointmentList({ appointments, tenantId, today }: Props) {
  const [, startTransition] = useTransition();
  const [dateFilter, setDateFilter] = useState(today);

  function advance(id: string, to: "CONFIRMADA" | "EN_CONSULTA") {
    startTransition(async () => {
      await updateAppointmentStatus(tenantId, id, to);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-ash-gray rounded-[4px] pl-9 pr-3 py-2 text-[13px] text-pure-white focus:outline-none h-9"
          />
        </div>
        <Link href="/appointments/new">
          <Button size="md"><Plus className="w-3.5 h-3.5" /> Nueva cita</Button>
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
            <Calendar className="w-5 h-5 text-iron-gray" />
          </div>
          <p className="text-[13px] text-slate-gray">Sin citas para esta fecha</p>
          <Link href="/appointments/new">
            <Button size="sm"><Plus className="w-3.5 h-3.5" /> Agendar cita</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className={`${COL.time}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Hora</th>
                <th className={`${COL.patient} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Paciente</th>
                <th className={`${COL.type}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Tipo</th>
                <th className={`${COL.doctor}  text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Médico</th>
                <th className={`${COL.status}  text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Estado</th>
                <th className={COL.action} />
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {appointments.map(a => {
                const patient = a.employee
                  ? `${a.employee.lastName}, ${a.employee.firstName}`
                  : a.dependent
                  ? `${a.dependent.lastName}, ${a.dependent.firstName}`
                  : "—";

                return (
                  <tr key={a.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className={`${COL.time} font-mono text-[13px] text-pure-white`}>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-iron-gray shrink-0" />
                        {new Date(a.scheduledAt).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <p className="text-[10px] text-iron-gray mt-0.5">{a.duration} min</p>
                    </td>
                    <td className={COL.patient}>
                      <p className="text-[13px] text-pure-white font-medium">{patient}</p>
                      {a.employee?.employeeNumber && (
                        <p className="text-[11px] text-slate-gray font-mono mt-0.5">{a.employee.employeeNumber}</p>
                      )}
                    </td>
                    <td className={`${COL.type} text-[12px] text-slate-gray`}>
                      {TYPE_LABEL[a.type]}
                    </td>
                    <td className={`${COL.doctor} text-[12px] text-slate-gray`}>
                      {a.doctor.name ?? "—"}
                    </td>
                    <td className={COL.status}>
                      <Badge variant={STATUS_VARIANT[a.status]}>
                        {STATUS_LABEL[a.status]}
                      </Badge>
                    </td>
                    <td className={COL.action}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {a.status === "PROGRAMADA" && (
                          <Button variant="ghost" size="sm" onClick={() => advance(a.id, "CONFIRMADA")}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(a.status === "PROGRAMADA" || a.status === "CONFIRMADA") && (
                          <Link href={`/medical-records/new?appointmentId=${a.id}`}>
                            <Button size="sm">
                              <Stethoscope className="w-3.5 h-3.5" /> Consultar
                            </Button>
                          </Link>
                        )}
                        {a.medicalRecord && (
                          <Link
                            href={`/medical-records/${a.medicalRecord.id}`}
                            className="inline-flex items-center gap-1 text-[12px] text-iron-gray hover:text-pure-white transition-colors"
                          >
                            Ver <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
