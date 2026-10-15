import { getTenantFromHeaders } from "@/lib/tenant";
import { getClinicType } from "@/lib/tenant";
import { EmployeeForm } from "@/components/patients/employee-form";

export default async function NewPatientPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const clinicType = await getClinicType(tenantId);
  const isPrivada  = clinicType === "PRIVADA";

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Nuevo paciente</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          {isPrivada ? "Registra un paciente en el sistema" : "Registra un empleado en el sistema"}
        </p>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <EmployeeForm tenantId={tenantId} clinicType={clinicType} />
      </div>
    </div>
  );
}
