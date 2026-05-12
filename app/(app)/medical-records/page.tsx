import Link from "next/link";
import { Plus, Stethoscope } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getMedicalRecords } from "@/lib/actions/medical-records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButtons } from "@/components/ui/export-buttons";

const COL = {
  date:     "w-36  px-4 py-3",
  patient:  "w-auto px-4 py-3",
  doctor:   "w-44  px-4 py-3",
  dx:       "w-auto px-4 py-3",
  rx:       "w-24  px-4 py-3",
  action:   "w-20  px-4 py-3 text-right",
};

const RX_VARIANT: Record<string, "success" | "warning" | "muted" | "danger"> = {
  EMITIDA:    "success",
  DISPENSADA: "muted",
  PARCIAL:    "warning",
  VENCIDA:    "danger",
  CANCELADA:  "muted",
};

export default async function MedicalRecordsPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const records = await getMedicalRecords(tenantId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Consultas</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">{records.length} consultas registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons xlsxUrl="/api/exports/medical-records" />
          <Link href="/medical-records/new">
            <Button size="md"><Plus className="w-3.5 h-3.5" /> Nueva consulta</Button>
          </Link>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-iron-gray" />
          </div>
          <p className="text-[13px] text-slate-gray">Sin consultas registradas</p>
          <Link href="/medical-records/new">
            <Button size="sm"><Plus className="w-3.5 h-3.5" /> Registrar consulta</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className={`${COL.date}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Fecha</th>
                <th className={`${COL.patient} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Paciente</th>
                <th className={`${COL.doctor}  text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Médico</th>
                <th className={`${COL.dx}      text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Diagnóstico</th>
                <th className={`${COL.rx}      text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Receta</th>
                <th className={COL.action} />
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {records.map(r => {
                const patient = r.employee
                  ? `${r.employee.lastName}, ${r.employee.firstName}`
                  : r.dependent
                  ? `${r.dependent.lastName}, ${r.dependent.firstName}`
                  : "—";
                const primary = r.diagnoses.find(d => d.isPrimary) ?? r.diagnoses[0];
                const rx = r.prescriptions[0];

                return (
                  <tr key={r.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className={`${COL.date} text-[12px] text-slate-gray`}>
                      {new Date(r.createdAt).toLocaleDateString("es-HN")}
                    </td>
                    <td className={COL.patient}>
                      <p className="text-[13px] text-pure-white font-medium">{patient}</p>
                      {r.employee?.employeeNumber && (
                        <p className="text-[11px] text-slate-gray font-mono mt-0.5">{r.employee.employeeNumber}</p>
                      )}
                    </td>
                    <td className={`${COL.doctor} text-[12px] text-slate-gray`}>
                      {r.doctor.name ?? "—"}
                    </td>
                    <td className={COL.dx}>
                      {primary ? (
                        <div>
                          <span className="font-mono text-[11px] text-sunbeam-yellow">{primary.cie10Code}</span>
                          <p className="text-[11px] text-slate-gray mt-0.5 truncate max-w-xs">{primary.description}</p>
                        </div>
                      ) : <span className="text-[12px] text-iron-gray">—</span>}
                    </td>
                    <td className={COL.rx}>
                      {rx ? (
                        <Badge variant={RX_VARIANT[rx.status]}>{rx.status}</Badge>
                      ) : <span className="text-[12px] text-iron-gray">—</span>}
                    </td>
                    <td className={COL.action}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <ExportButtons
                          pdfUrl={`/api/exports/medical-records/${r.id}`}
                          compact
                        />
                        <Link
                          href={`/medical-records/${r.id}`}
                          className="text-[12px] text-iron-gray hover:text-pure-white"
                        >
                          Ver →
                        </Link>
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
