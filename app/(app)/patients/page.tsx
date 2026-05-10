import { getTenantFromHeaders } from "@/lib/tenant";
import { getEmployees } from "@/lib/actions/patients";
import { EmployeeTable } from "@/components/patients/employee-table";

export default async function PatientsPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const employees = await getEmployees(tenantId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Pacientes</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">{employees.length} empleados registrados</p>
      </div>
      <EmployeeTable employees={employees} />
    </div>
  );
}
