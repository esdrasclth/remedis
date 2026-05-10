import { getTenantFromHeaders } from "@/lib/tenant";
import { getTodayAppointments } from "@/lib/actions/appointments";
import { AppointmentList } from "@/components/appointments/appointment-list";

export default async function AppointmentsPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const appointments = await getTodayAppointments(tenantId);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Citas</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          {appointments.length} cita{appointments.length !== 1 ? "s" : ""} hoy
        </p>
      </div>
      <AppointmentList appointments={appointments} tenantId={tenantId} today={today} />
    </div>
  );
}
