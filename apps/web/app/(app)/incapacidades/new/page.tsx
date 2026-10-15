import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders, getClinicType } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getMedicalRecord } from "@/lib/actions/medical-records";
import { prisma } from "@/lib/prisma";
import { IncapacidadNewForm } from "@/components/incapacidades/incapacidad-new-form";

export default async function IncapacidadNewPage({
  searchParams,
}: {
  searchParams: Promise<{ recordId?: string }>;
}) {
  const { tenantId } = await getTenantFromHeaders();
  const session = await auth();
  if (!tenantId || !session?.user?.id) return null;

  const { recordId } = await searchParams;
  if (!recordId) notFound();

  const [record, clinicType] = await Promise.all([
    getMedicalRecord(tenantId, recordId),
    getClinicType(tenantId),
  ]);

  if (!record) notFound();

  if (record.incapacidad) {
    return (
      <div className="p-6 max-w-2xl">
        <p className="text-[14px] text-slate-gray">
          Esta consulta ya tiene una incapacidad emitida:{" "}
          <Link href={`/incapacidades/${record.incapacidad.id}`} className="text-sunbeam-yellow">
            {record.incapacidad.folio}
          </Link>
        </p>
      </div>
    );
  }

  const patient = record.employee
    ? `${record.employee.lastName}, ${record.employee.firstName}`
    : record.dependent
    ? `${record.dependent.lastName}, ${record.dependent.firstName}`
    : "Paciente no especificado";

  const primaryDx = record.diagnoses.find(d => d.isPrimary) ?? record.diagnoses[0];
  const tenantName = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }))?.name ?? "";

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/medical-records/${recordId}`} className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Emitir incapacidad</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {patient}
            {" · "}
            {new Date(record.createdAt).toLocaleDateString("es-HN")}
          </p>
        </div>
      </div>

      <div className="bg-ash-gray rounded-[12px] p-6">
        <IncapacidadNewForm
          tenantId={tenantId}
          doctorId={record.doctorId}
          medicalRecordId={recordId}
          employeeId={record.employeeId}
          dependentId={record.dependentId}
          clinicType={clinicType}
          primaryDiagnostico={primaryDx ? `${primaryDx.cie10Code} - ${primaryDx.description}` : undefined}
        />
      </div>
    </div>
  );
}
