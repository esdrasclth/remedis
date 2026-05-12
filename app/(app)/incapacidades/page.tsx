import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getIncapacidades } from "@/lib/actions/incapacidades";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/ui/export-buttons";

const TIPO_LABEL: Record<string, string> = {
  REPOSO_MEDICO:      "Reposo Médico",
  INCAPACIDAD_IHSS:   "Incapacidad IHSS",
  CERTIFICADO_TRABAJO:"Cert. Trabajo",
};

const ESTADO_VARIANT: Record<string, "success" | "warning" | "info" | "muted" | "danger"> = {
  EMITIDA:            "success",
  ENTREGADA_PACIENTE: "info",
  PRESENTADA_RRHH:    "warning",
  CANCELADA:          "muted",
};

const ESTADO_LABEL: Record<string, string> = {
  EMITIDA:            "Emitida",
  ENTREGADA_PACIENTE: "Entregada",
  PRESENTADA_RRHH:    "En RRHH",
  CANCELADA:          "Cancelada",
};

export default async function IncapacidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; from?: string; to?: string }>;
}) {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const filters = await searchParams;
  const items = await getIncapacidades(tenantId, {
    estado: filters.estado,
    from:   filters.from,
    to:     filters.to,
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-pure-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sunbeam-yellow" />
            Incapacidades
          </h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            Certificados médicos emitidos · {items.length} registro{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {(["", "EMITIDA", "ENTREGADA_PACIENTE", "PRESENTADA_RRHH", "CANCELADA"] as const).map(e => (
          <Link
            key={e}
            href={e ? `/incapacidades?estado=${e}` : "/incapacidades"}
            className={`px-3 py-1.5 rounded-[6px] text-[12px] transition-colors ${
              (filters.estado ?? "") === e
                ? "bg-sunbeam-yellow text-charcoal-black font-medium"
                : "bg-ash-gray text-slate-gray hover:text-pure-white"
            }`}
          >
            {e === "" ? "Todas" : ESTADO_LABEL[e]}
          </Link>
        ))}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="bg-ash-gray rounded-[12px] p-10 text-center">
          <ClipboardList className="w-8 h-8 text-iron-gray mx-auto mb-3" />
          <p className="text-[14px] text-slate-gray">No hay incapacidades registradas</p>
          <p className="text-[12px] text-iron-gray mt-1">
            Las incapacidades se emiten desde una consulta médica
          </p>
        </div>
      ) : (
        <div className="bg-ash-gray rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Folio</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Paciente</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Período</th>
                <th className="text-right px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Días</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Médico</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((inc, i) => {
                const patient = inc.employee
                  ? `${inc.employee.lastName}, ${inc.employee.firstName}`
                  : inc.dependent
                  ? `${inc.dependent.lastName}, ${inc.dependent.firstName}`
                  : "—";

                return (
                  <tr
                    key={inc.id}
                    className={`border-t border-[var(--border-divider)] hover:bg-white/[0.02] transition-colors ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-sunbeam-yellow">{inc.folio}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-pure-white">{patient}</p>
                      {inc.employee?.employeeNumber && (
                        <p className="text-[11px] text-iron-gray">{inc.employee.employeeNumber}</p>
                      )}
                      {inc.employee?.department && (
                        <p className="text-[11px] text-iron-gray">{inc.employee.department}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-gray">{TIPO_LABEL[inc.tipo] ?? inc.tipo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-pure-white">
                        {new Date(inc.fechaInicio).toLocaleDateString("es-HN")}
                      </p>
                      <p className="text-[11px] text-iron-gray">
                        al {new Date(inc.fechaFin).toLocaleDateString("es-HN")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[14px] font-medium text-pure-white">{inc.dias}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-gray">{inc.doctor.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ESTADO_VARIANT[inc.estado] ?? "muted"}>
                        {ESTADO_LABEL[inc.estado] ?? inc.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <ExportButtons pdfUrl={`/api/exports/incapacidad/${inc.id}`} compact />
                        <Link
                          href={`/incapacidades/${inc.id}`}
                          className="text-[12px] text-iron-gray hover:text-pure-white transition-colors"
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
