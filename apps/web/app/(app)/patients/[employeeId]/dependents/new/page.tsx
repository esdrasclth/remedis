import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getEmployee } from "@/lib/actions/patients";
import { DependentForm } from "@/components/patients/dependent-form";

export default async function NewDependentPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const employee = await getEmployee(tenantId, employeeId);
  if (!employee) notFound();

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/patients/${employeeId}`} className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Nuevo dependiente</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            Paciente: {employee.lastName}, {employee.firstName}
          </p>
        </div>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <DependentForm tenantId={tenantId} employeeId={employeeId} />
      </div>
    </div>
  );
}
