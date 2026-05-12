import { getTenantFromHeaders } from "@/lib/tenant";
import { getAppointmentsRange } from "@/lib/actions/appointments";
import { CalendarView } from "@/components/appointments/calendar-view";

function mondayOf(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

export default async function AppointmentsPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const weekStart = mondayOf(new Date());
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const appointments = await getAppointmentsRange(tenantId, weekStart, weekEnd);

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Agenda</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          Vista de calendario de la clínica
        </p>
      </div>

      <CalendarView
        tenantId={tenantId}
        initialAppointments={appointments}
        initialWeekStart={weekStart.toISOString()}
      />
    </div>
  );
}
