import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getIncapacidad } from "@/lib/actions/incapacidades";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/ui/export-buttons";
import { IncapacidadEstadoActions } from "@/components/incapacidades/incapacidad-estado-actions";

const TIPO_LABEL: Record<string, string> = {
  REPOSO_MEDICO:      "Reposo Médico",
  INCAPACIDAD_IHSS:   "Incapacidad IHSS",
  CERTIFICADO_TRABAJO:"Certificado para el Empleador",
};

const ESTADO_VARIANT: Record<string, "success" | "warning" | "info" | "muted" | "danger"> = {
  EMITIDA:            "success",
  ENTREGADA_PACIENTE: "info",
  PRESENTADA_RRHH:    "warning",
  CANCELADA:          "muted",
};

const ESTADO_LABEL: Record<string, string> = {
  EMITIDA:            "Emitida",
  ENTREGADA_PACIENTE: "Entregada al paciente",
  PRESENTADA_RRHH:    "Presentada a RRHH",
  CANCELADA:          "Cancelada",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-[12px] text-slate-gray w-36 shrink-0">{label}</span>
      <span className="text-[13px] text-pure-white">{value}</span>
    </div>
  );
}

export default async function IncapacidadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const inc = await getIncapacidad(tenantId, id);
  if (!inc) notFound();

  const patient = inc.employee
    ? `${inc.employee.lastName}, ${inc.employee.firstName}`
    : inc.dependent
    ? `${inc.dependent.lastName}, ${inc.dependent.firstName}`
    : "Paciente no especificado";

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString("es-HN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/incapacidades" className="text-iron-gray hover:text-pure-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-medium text-pure-white">{patient}</h1>
              <Badge variant={ESTADO_VARIANT[inc.estado] ?? "muted"}>
                {ESTADO_LABEL[inc.estado] ?? inc.estado}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-gray mt-0.5">
              <span className="font-mono text-sunbeam-yellow">{inc.folio}</span>
              {" · "}
              {TIPO_LABEL[inc.tipo] ?? inc.tipo}
              {" · "}
              {fmt(inc.createdAt)}
            </p>
          </div>
        </div>
        <ExportButtons pdfUrl={`/api/exports/incapacidad/${inc.id}`} compact />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Main details */}
        <div className="col-span-2 space-y-4">
          {/* Period highlight */}
          <div className="bg-ash-gray rounded-[12px] p-5">
            <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-4">
              Período de incapacidad
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-table-header rounded-[8px] p-3 text-center">
                <p className="text-[10px] text-iron-gray uppercase tracking-wide mb-1">Inicio</p>
                <p className="text-[15px] font-medium text-pure-white">
                  {new Date(inc.fechaInicio).toLocaleDateString("es-HN")}
                </p>
              </div>
              <div className="bg-ocean-abyss rounded-[8px] px-5 py-3 text-center">
                <p className="text-[28px] font-bold text-sunbeam-yellow leading-none">{inc.dias}</p>
                <p className="text-[10px] text-slate-gray uppercase tracking-wide mt-0.5">
                  {inc.dias === 1 ? "día" : "días"}
                </p>
              </div>
              <div className="flex-1 bg-table-header rounded-[8px] p-3 text-center">
                <p className="text-[10px] text-iron-gray uppercase tracking-wide mb-1">Fin</p>
                <p className="text-[15px] font-medium text-pure-white">
                  {new Date(inc.fechaFin).toLocaleDateString("es-HN")}
                </p>
              </div>
            </div>
            {inc.fechaRetorno && (
              <p className="text-[12px] text-slate-gray mt-3 text-center">
                Fecha de retorno: <span className="text-pure-white font-medium">{fmt(inc.fechaRetorno)}</span>
              </p>
            )}
          </div>

          {/* Clinical details */}
          <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
            <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">
              Detalle clínico
            </h3>
            <div className="space-y-3">
              <Row label="Diagnóstico" value={inc.diagnostico} />
              <Row label="Justificación médica" value={inc.motivo} />
              <Row label="Restricciones" value={inc.restricciones} />
              <Row label="Recomendaciones" value={inc.recomendaciones} />
            </div>
          </div>

          {/* IHSS */}
          {inc.esIHSS && (
            <div className="bg-sunbeam-yellow/10 border border-sunbeam-yellow/30 rounded-[12px] p-5">
              <h3 className="text-[11px] font-medium text-sunbeam-yellow uppercase tracking-wide mb-3">
                Trámite IHSS
              </h3>
              <p className="text-[13px] text-pure-white">
                Esta incapacidad está autorizada para presentación ante el IHSS.
              </p>
              {inc.numeroIHSS && (
                <p className="text-[12px] text-slate-gray mt-1">
                  Número de caso: <span className="text-pure-white font-mono">{inc.numeroIHSS}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Patient */}
          <div className="bg-ash-gray rounded-[12px] p-4 space-y-2">
            <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Paciente</h3>
            <p className="text-[14px] text-pure-white font-medium">{patient}</p>
            {inc.employee && (
              <>
                <p className="text-[12px] text-iron-gray">Nº {inc.employee.employeeNumber}</p>
                {inc.employee.department && (
                  <p className="text-[12px] text-iron-gray">{inc.employee.department}</p>
                )}
                {inc.employee.position && (
                  <p className="text-[12px] text-iron-gray">{inc.employee.position}</p>
                )}
              </>
            )}
          </div>

          {/* Doctor */}
          <div className="bg-ash-gray rounded-[12px] p-4 space-y-2">
            <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Médico</h3>
            <p className="text-[13px] text-pure-white">{inc.doctor.name ?? "—"}</p>
            {inc.doctor.specialty && <p className="text-[12px] text-iron-gray">{inc.doctor.specialty}</p>}
            {inc.doctor.licenseNumber && (
              <p className="text-[11px] text-iron-gray">Colegiación: {inc.doctor.licenseNumber}</p>
            )}
          </div>

          {/* Status actions */}
          <IncapacidadEstadoActions
            tenantId={tenantId}
            id={inc.id}
            estadoActual={inc.estado}
          />

          {/* Related record */}
          <div className="bg-ash-gray rounded-[12px] p-4">
            <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-2">
              Consulta origen
            </h3>
            <Link
              href={`/medical-records/${inc.medicalRecord.id}`}
              className="flex items-center gap-1.5 text-[12px] text-sunbeam-yellow hover:text-sunbeam-yellow/80 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Ver expediente médico →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
