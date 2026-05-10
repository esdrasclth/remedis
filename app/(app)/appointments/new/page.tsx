import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getClinics, getDoctors } from "@/lib/actions/appointments";
import { AppointmentForm } from "@/components/appointments/appointment-form";

export default async function NewAppointmentPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const [clinics, doctors] = await Promise.all([
    getClinics(tenantId),
    getDoctors(tenantId),
  ]);

  if (clinics.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-[20px] font-medium text-pure-white">Nueva cita</h1>
        <div className="bg-ash-gray rounded-[12px] p-6">
          <p className="text-[13px] text-slate-gray">
            No hay sedes configuradas. Configura una sede en{" "}
            <Link href="/settings" className="text-sunbeam-yellow hover:underline">Configuración</Link> primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/appointments" className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Nueva cita</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">Agenda una consulta médica</p>
        </div>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <AppointmentForm tenantId={tenantId} clinics={clinics} doctors={doctors} />
      </div>
    </div>
  );
}
