import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getMedicalRecord } from "@/lib/actions/medical-records";
import { EditRecordForm } from "@/components/medical-records/edit-record-form";

export default async function EditMedicalRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  const session = await auth();
  if (!tenantId || !session?.user?.id) return null;

  const record = await getMedicalRecord(tenantId, recordId);
  if (!record) notFound();

  const patient = record.employee
    ? `${record.employee.lastName}, ${record.employee.firstName}`
    : record.dependent
    ? `${record.dependent.lastName}, ${record.dependent.firstName}`
    : "Paciente";

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/medical-records/${recordId}`}
          className="text-iron-gray hover:text-pure-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Editar consulta</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {patient} · {new Date(record.createdAt).toLocaleDateString("es-HN")}
          </p>
        </div>
      </div>

      <div className="bg-ash-gray rounded-[12px] p-6">
        <EditRecordForm tenantId={tenantId} record={record} />
      </div>
    </div>
  );
}
