import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getEmployee } from "@/lib/actions/patients";
import { EmployeeForm } from "@/components/patients/employee-form";

export default async function EditPatientPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const employee = await getEmployee(tenantId, employeeId);
  if (!employee) notFound();

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/patients/${employeeId}`} className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Editar paciente</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {employee.lastName}, {employee.firstName}
          </p>
        </div>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <EmployeeForm
          tenantId={tenantId}
          employeeId={employeeId}
          defaultValues={{
            employeeNumber: employee.employeeNumber,
            firstName:      employee.firstName,
            lastName:       employee.lastName,
            gender:         employee.gender ?? undefined,
            birthDate:      employee.birthDate
              ? new Date(employee.birthDate).toISOString().split("T")[0]
              : undefined,
            phone:      employee.phone      ?? undefined,
            email:      employee.email      ?? undefined,
            department: employee.department ?? undefined,
            position:   employee.position   ?? undefined,
            medicalHistory: employee.medicalHistory ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
