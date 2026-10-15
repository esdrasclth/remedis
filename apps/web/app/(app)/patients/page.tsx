import { getTenantFromHeaders } from "@/lib/tenant";
import { getClinicType } from "@/lib/tenant";
import { getEmployees } from "@/lib/actions/patients";
import { EmployeeTable } from "@/components/patients/employee-table";
import { ExportButtons } from "@/components/ui/export-buttons";

export default async function PatientsPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const [employees, clinicType] = await Promise.all([
    getEmployees(tenantId),
    getClinicType(tenantId),
  ]);

  const isPrivada = clinicType === "PRIVADA";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Pacientes</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {employees.length} {isPrivada ? "pacientes" : "empleados"} registrados
          </p>
        </div>
        <ExportButtons
          pdfUrl="/api/exports/patients?format=pdf"
          xlsxUrl="/api/exports/patients?format=xlsx"
        />
      </div>
      <EmployeeTable employees={employees} clinicType={clinicType} />
    </div>
  );
}
