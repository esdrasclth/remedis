import Link from "next/link";
import { FileText } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getPrescriptions } from "@/lib/actions/medical-records";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "danger" | "info"> = {
  EMITIDA:    "success",
  DISPENSADA: "muted",
  PARCIAL:    "warning",
  VENCIDA:    "danger",
  CANCELADA:  "muted",
};
const STATUS_LABEL: Record<string, string> = {
  EMITIDA:    "Emitida",
  DISPENSADA: "Dispensada",
  PARCIAL:    "Parcial",
  VENCIDA:    "Vencida",
  CANCELADA:  "Cancelada",
};

const COL = {
  date:    "w-36  px-4 py-3",
  patient: "w-auto px-4 py-3",
  doctor:  "w-44  px-4 py-3",
  items:   "w-auto px-4 py-3",
  expires: "w-36  px-4 py-3",
  status:  "w-32  px-4 py-3",
  action:  "w-20  px-4 py-3 text-right",
};

export default async function PrescriptionsPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const prescriptions = await getPrescriptions(tenantId);
  const pending = prescriptions.filter(p => p.status === "EMITIDA").length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Recetas</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          {prescriptions.length} receta{prescriptions.length !== 1 ? "s" : ""}
          {pending > 0 && ` · ${pending} pendiente${pending !== 1 ? "s" : ""} de despacho`}
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="rounded-[12px] py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ash-gray flex items-center justify-center">
            <FileText className="w-5 h-5 text-iron-gray" />
          </div>
          <p className="text-[13px] text-slate-gray">Sin recetas emitidas</p>
          <p className="text-[12px] text-iron-gray">Las recetas se generan desde las consultas médicas</p>
        </div>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#222120]">
                <th className={`${COL.date}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Fecha</th>
                <th className={`${COL.patient} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Paciente</th>
                <th className={`${COL.doctor}  text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Médico</th>
                <th className={`${COL.items}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Medicamentos</th>
                <th className={`${COL.expires} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Vence</th>
                <th className={`${COL.status}  text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Estado</th>
                <th className={COL.action} />
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {prescriptions.map(rx => {
                const patient = rx.employee
                  ? `${rx.employee.lastName}, ${rx.employee.firstName}`
                  : rx.dependent
                  ? `${rx.dependent.lastName}, ${rx.dependent.firstName}`
                  : "—";
                const expired = new Date(rx.expiresAt) < new Date();

                return (
                  <tr key={rx.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className={`${COL.date} text-[12px] text-slate-gray`}>
                      {new Date(rx.createdAt).toLocaleDateString("es-HN")}
                    </td>
                    <td className={COL.patient}>
                      <p className="text-[13px] text-pure-white font-medium">{patient}</p>
                      {rx.employee?.employeeNumber && (
                        <p className="text-[11px] text-slate-gray font-mono mt-0.5">{rx.employee.employeeNumber}</p>
                      )}
                    </td>
                    <td className={`${COL.doctor} text-[12px] text-slate-gray`}>
                      {rx.doctor.name ?? "—"}
                    </td>
                    <td className={COL.items}>
                      <div className="flex flex-wrap gap-1">
                        {rx.items.slice(0, 3).map(item => (
                          <span key={item.id} className="text-[11px] text-slate-gray bg-[#222120] rounded px-1.5 py-0.5">
                            {item.product.genericName}
                          </span>
                        ))}
                        {rx.items.length > 3 && (
                          <span className="text-[11px] text-iron-gray">+{rx.items.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className={`${COL.expires} text-[12px] ${expired ? "text-blaze-orange" : "text-slate-gray"}`}>
                      {new Date(rx.expiresAt).toLocaleDateString("es-HN")}
                    </td>
                    <td className={COL.status}>
                      <Badge variant={STATUS_VARIANT[rx.status]}>{STATUS_LABEL[rx.status]}</Badge>
                    </td>
                    <td className={COL.action}>
                      {rx.medicalRecordId && (
                        <Link
                          href={`/medical-records/${rx.medicalRecordId}`}
                          className="text-[12px] text-iron-gray hover:text-pure-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Ver →
                        </Link>
                      )}
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
