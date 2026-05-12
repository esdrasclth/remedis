import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders, getClinicType } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getAppointments } from "@/lib/actions/appointments";
import { RecordForm } from "@/components/medical-records/record-form";

export default async function NewMedicalRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string; employeeId?: string }>;
}) {
  const { tenantId } = await getTenantFromHeaders();
  const session = await auth();
  if (!tenantId || !session?.user?.id) return null;

  const { appointmentId, employeeId } = await searchParams;
  const clinicType = await getClinicType(tenantId);

  let appointment = null;
  if (appointmentId) {
    const today = new Date().toISOString().split("T")[0];
    const appts = await getAppointments(tenantId, { date: today });
    appointment = appts.find(a => a.id === appointmentId) ?? null;

    if (!appointment) {
      // Search without date filter for past appointments
      const all = await getAppointments(tenantId);
      appointment = all.find(a => a.id === appointmentId) ?? null;
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={appointmentId ? "/appointments" : "/medical-records"}
          className="text-iron-gray hover:text-pure-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Nueva consulta</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {appointment
              ? `Cita del ${new Date(appointment.scheduledAt).toLocaleDateString("es-HN")}`
              : "Registro de consulta médica"}
          </p>
        </div>
      </div>

      <div className="bg-ash-gray rounded-[12px] p-6">
        <RecordForm
          tenantId={tenantId}
          doctorId={session.user.id}
          clinicType={clinicType}
          appointment={appointment}
        />
      </div>
    </div>
  );
}
