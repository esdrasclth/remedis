import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Pencil, ClipboardList } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getMedicalRecord } from "@/lib/actions/medical-records";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/ui/export-buttons";

const RX_VARIANT: Record<string, "success" | "warning" | "muted" | "danger"> = {
  EMITIDA: "success", DISPENSADA: "muted", PARCIAL: "warning", VENCIDA: "danger", CANCELADA: "muted",
};
const RX_LABEL: Record<string, string> = {
  EMITIDA: "Emitida", DISPENSADA: "Dispensada", PARCIAL: "Parcial", VENCIDA: "Vencida", CANCELADA: "Cancelada",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export default async function MedicalRecordDetailPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const record = await getMedicalRecord(tenantId, recordId);
  if (!record) notFound();

  const patient = record.employee
    ? `${record.employee.lastName}, ${record.employee.firstName}`
    : record.dependent
    ? `${record.dependent.lastName}, ${record.dependent.firstName}`
    : "Paciente no especificado";

  const v = record.vitalSigns;

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/medical-records" className="text-iron-gray hover:text-pure-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[20px] font-medium text-pure-white">{patient}</h1>
            <p className="text-[13px] text-slate-gray mt-0.5">
              {new Date(record.createdAt).toLocaleDateString("es-HN", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
              {" · "}{record.doctor.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons pdfUrl={`/api/exports/medical-records/${recordId}`} compact />
          <Link
            href={`/medical-records/${recordId}/edit`}
            className="flex items-center gap-1.5 text-[12px] text-iron-gray hover:text-pure-white transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Link>
          {record.employee && (
            <Link
              href={`/patients/${record.employeeId}`}
              className="text-[12px] text-iron-gray hover:text-pure-white transition-colors"
            >
              Ver expediente →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* SOAP + Dx */}
        <div className="col-span-2 space-y-4">
          {/* Vital signs */}
          {v && (
            <div className="bg-ash-gray rounded-[12px] p-5">
              <Section title="Signos vitales">
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    ["Peso", v.weight != null ? `${v.weight} kg` : null],
                    ["Talla", v.height != null ? `${v.height} cm` : null],
                    ["IMC", v.bmi != null ? v.bmi.toFixed(1) : null],
                    ["Presión", v.systolicBp != null ? `${v.systolicBp}/${v.diastolicBp} mmHg` : null],
                    ["FC", v.heartRate != null ? `${v.heartRate} lpm` : null],
                    ["Temp.", v.temperature != null ? `${v.temperature} °C` : null],
                    ["Glucosa", v.glucose != null ? `${v.glucose} mg/dL` : null],
                    ["SpO₂", v.spo2 != null ? `${v.spo2}%` : null],
                    ["FR", v.respiratoryRate != null ? `${v.respiratoryRate} rpm` : null],
                  ].filter(([, val]) => val !== null).map(([label, val]) => (
                    <div key={label as string} className="bg-table-header rounded-[6px] px-3 py-2">
                      <p className="text-[10px] text-slate-gray uppercase tracking-wide">{label}</p>
                      <p className="text-[14px] text-pure-white font-medium mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* SOAP */}
          <div className="bg-ash-gray rounded-[12px] p-5 space-y-5">
            {[
              ["Subjetivo", record.subjective],
              ["Objetivo", record.objective],
              ["Evaluación", record.assessment],
              ["Plan", record.plan],
              ["Notas", record.notes],
              ["Referido a", record.referral],
            ].filter(([, val]) => val).map(([label, val]) => (
              <Section key={label as string} title={label as string}>
                <p className="text-[13px] text-pure-white leading-relaxed whitespace-pre-wrap">{val}</p>
              </Section>
            ))}
          </div>

          {/* Diagnoses */}
          {record.diagnoses.length > 0 && (
            <div className="bg-ash-gray rounded-[12px] p-5">
              <Section title="Diagnósticos CIE-10">
                <div className="space-y-2 mt-2">
                  {record.diagnoses.map(d => (
                    <div key={d.id} className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-sunbeam-yellow w-16 shrink-0">{d.cie10Code}</span>
                      <span className="text-[13px] text-pure-white">{d.description}</span>
                      {d.isPrimary && <Badge variant="info">Principal</Badge>}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Prescriptions sidebar */}
        <div className="space-y-4">
          {record.prescriptions.map(rx => (
            <div key={rx.id} className="bg-ash-gray rounded-[12px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Receta
                </h3>
                <Badge variant={RX_VARIANT[rx.status]}>{RX_LABEL[rx.status]}</Badge>
              </div>
              <p className="text-[11px] text-iron-gray">
                Vence: {new Date(rx.expiresAt).toLocaleDateString("es-HN")}
              </p>
              <div className="space-y-3">
                {rx.items.map(item => (
                  <div key={item.id} className="bg-table-header rounded-[6px] px-3 py-2.5">
                    <p className="text-[12px] text-pure-white font-medium">{item.product.genericName}</p>
                    <p className="text-[11px] text-slate-gray mt-0.5">
                      {item.dose} · {item.frequency} · {item.duration}
                    </p>
                    {item.instructions && (
                      <p className="text-[11px] text-iron-gray mt-0.5">{item.instructions}</p>
                    )}
                    <p className="text-[10px] text-iron-gray mt-1">
                      Cant: {item.quantity}
                      {item.product.unit && ` ${item.product.unit}`}
                      {" · "}Dispensado: {item.dispensedQty}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {record.prescriptions.length === 0 && (
            <div className="bg-ash-gray rounded-[12px] p-5">
              <p className="text-[12px] text-iron-gray">Sin receta en esta consulta</p>
            </div>
          )}

          {/* Incapacidad */}
          {record.incapacidad ? (
            <IncapacidadCard incapacidad={record.incapacidad} recordId={recordId} />
          ) : (
            <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" /> Incapacidad
                </h3>
              </div>
              <p className="text-[12px] text-iron-gray">Sin incapacidad en esta consulta</p>
              <Link
                href={`/incapacidades/new?recordId=${recordId}`}
                className="inline-block text-[12px] text-sunbeam-yellow hover:text-sunbeam-yellow/80 transition-colors"
              >
                + Emitir incapacidad
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TIPO_LABEL: Record<string, string> = {
  REPOSO_MEDICO:      "Reposo Médico",
  INCAPACIDAD_IHSS:   "Incapacidad IHSS",
  CERTIFICADO_TRABAJO:"Certificado Trabajo",
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

type RecordData = NonNullable<Awaited<ReturnType<typeof getMedicalRecord>>>;

function IncapacidadCard({
  incapacidad: inc,
  recordId,
}: {
  incapacidad: NonNullable<RecordData["incapacidad"]>;
  recordId: string;
}) {
  return (
    <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" /> Incapacidad
        </h3>
        <Badge variant={ESTADO_VARIANT[inc.estado] ?? "muted"}>
          {ESTADO_LABEL[inc.estado] ?? inc.estado}
        </Badge>
      </div>

      <div className="bg-table-header rounded-[6px] px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono text-sunbeam-yellow">{inc.folio}</p>
          <p className="text-[11px] text-iron-gray">{TIPO_LABEL[inc.tipo] ?? inc.tipo}</p>
        </div>
        <p className="text-[13px] text-pure-white font-medium">{inc.dias} día{inc.dias !== 1 ? "s" : ""} de reposo</p>
        <p className="text-[11px] text-slate-gray">
          {new Date(inc.fechaInicio).toLocaleDateString("es-HN")}
          {" → "}
          {new Date(inc.fechaFin).toLocaleDateString("es-HN")}
        </p>
        {inc.fechaRetorno && (
          <p className="text-[11px] text-iron-gray">
            Retorno: {new Date(inc.fechaRetorno).toLocaleDateString("es-HN")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ExportButtons pdfUrl={`/api/exports/incapacidad/${inc.id}`} compact />
        <Link
          href={`/incapacidades/${inc.id}`}
          className="text-[12px] text-iron-gray hover:text-pure-white transition-colors"
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  );
}
