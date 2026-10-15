import Link from "next/link";
import {
  Calendar, AlertTriangle, Clock, FileText,
  Package, CheckCircle, Stethoscope, TrendingDown,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getDashboardData } from "@/lib/actions/reports";
import { Badge } from "@/components/ui/badge";
import type { SessionUser } from "@/types";

const APPT_STATUS_VARIANT: Record<string, "info" | "success" | "warning" | "muted" | "danger"> = {
  PROGRAMADA: "info", CONFIRMADA: "success", EN_CONSULTA: "warning",
  COMPLETADA: "muted", CANCELADA: "danger", NO_ASISTIO: "muted",
};
const APPT_STATUS_LABEL: Record<string, string> = {
  PROGRAMADA: "Programada", CONFIRMADA: "Confirmada", EN_CONSULTA: "En consulta",
  COMPLETADA: "Completada", CANCELADA: "Cancelada", NO_ASISTIO: "No asistió",
};

export default async function DashboardPage() {
  const session     = await auth();
  const { tenantId } = await getTenantFromHeaders();
  const user = session?.user as unknown as SessionUser;

  const data = tenantId ? await getDashboardData(tenantId) : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">
          {greeting}, {user?.name?.split(" ")[0] ?? "bienvenido"}
        </h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          {new Date().toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          icon={<Calendar className="w-4 h-4" />}
          label="Citas hoy"
          value={data?.todayAppts ?? 0}
          sub="Consultas programadas"
          href="/appointments"
        />
        <KpiCard
          icon={<TrendingDown className="w-4 h-4" />}
          label="Stock bajo"
          value={data?.lowStockCount ?? 0}
          sub="Productos bajo mínimo"
          alert={!!data?.lowStockCount}
          href="/inventory"
        />
        <KpiCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Por vencer"
          value={data?.expiring30Count ?? 0}
          sub="Lotes en 30 días"
          alert={!!data?.expiring30Count}
          href="/reports?tab=vencimientos"
        />
        <KpiCard
          icon={<FileText className="w-4 h-4" />}
          label="Recetas activas"
          value={data?.pendingRxCount ?? 0}
          sub="Pendientes de despacho"
          href="/prescriptions"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Today's appointments */}
        <div className="col-span-2 bg-ash-gray rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-[13px] font-medium text-pure-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-iron-gray" />
              Citas de hoy
            </h2>
            <Link href="/appointments" className="text-[12px] text-slate-gray hover:text-pure-white transition-colors">
              Ver todas →
            </Link>
          </div>

          {!data?.todayApptList.length ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-slate-gray">Sin citas programadas para hoy</p>
              <Link href="/appointments/new" className="text-[12px] text-sunbeam-yellow hover:underline mt-1 inline-block">
                Agendar cita
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {data.todayApptList.map(a => {
                const patient = a.employee
                  ? `${a.employee.lastName}, ${a.employee.firstName}`
                  : a.dependent
                  ? `${a.dependent.lastName}, ${a.dependent.firstName}`
                  : "—";
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-[13px] font-mono text-pure-white">
                        {new Date(a.scheduledAt).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-pure-white font-medium truncate">{patient}</p>
                      <p className="text-[11px] text-slate-gray">{a.doctor.name}</p>
                    </div>
                    <Badge variant={APPT_STATUS_VARIANT[a.status]}>
                      {APPT_STATUS_LABEL[a.status]}
                    </Badge>
                    {!a.medicalRecord && a.status !== "CANCELADA" && a.status !== "NO_ASISTIO" && a.status !== "COMPLETADA" && (
                      <Link href={`/medical-records/new?appointmentId=${a.id}`}
                        className="text-iron-gray hover:text-sunbeam-yellow transition-colors">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Critical stock */}
          <div className="bg-ash-gray rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-[13px] font-medium text-pure-white flex items-center gap-2">
                <Package className="w-4 h-4 text-iron-gray" />
                Stock crítico
              </h2>
              <Link href="/inventory" className="text-[12px] text-slate-gray hover:text-pure-white transition-colors">
                Inventario →
              </Link>
            </div>
            {!data?.criticalStock.length ? (
              <div className="px-5 py-5 flex items-center gap-2 text-emerald-green">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <p className="text-[12px]">Todo el stock sobre mínimos</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {data.criticalStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                    <p className="text-[12px] text-pure-white truncate max-w-[150px]">{p.genericName}</p>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-medium text-blaze-orange tabular-nums">{p.total}</p>
                      <p className="text-[10px] text-iron-gray">mín. {p.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent dispensations */}
          <div className="bg-ash-gray rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-[13px] font-medium text-pure-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-iron-gray" />
                Últimos despachos
              </h2>
              <Link href="/pharmacy" className="text-[12px] text-slate-gray hover:text-pure-white transition-colors">
                Farmacia →
              </Link>
            </div>
            {!data?.recentDispensations.length ? (
              <p className="px-5 py-5 text-[12px] text-iron-gray">Sin despachos recientes</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {data.recentDispensations.map(d => {
                  const patient = d.employee
                    ? `${d.employee.lastName}, ${d.employee.firstName}`
                    : d.dependent
                    ? `${d.dependent.lastName}, ${d.dependent.firstName}`
                    : "Ventanilla";
                  const products = [...new Set(d.items.map(i => i.product.genericName))];
                  return (
                    <div key={d.id} className="px-5 py-2.5">
                      <p className="text-[12px] text-pure-white truncate">{patient}</p>
                      <p className="text-[11px] text-slate-gray truncate">
                        {products.slice(0, 2).join(", ")}
                        {products.length > 2 && ` +${products.length - 2}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Nuevo paciente", href: "/patients/new",        emoji: "👤" },
          { label: "Agendar cita",   href: "/appointments/new",    emoji: "📅" },
          { label: "Nueva consulta", href: "/medical-records/new", emoji: "🩺" },
          { label: "Ver reportes",   href: "/reports",             emoji: "📊" },
        ].map(q => (
          <Link
            key={q.href}
            href={q.href}
            className="bg-ash-gray rounded-[12px] px-4 py-4 flex items-center gap-3 hover:bg-white/[0.06] transition-colors group"
          >
            <span className="text-[20px]">{q.emoji}</span>
            <span className="text-[13px] text-slate-gray group-hover:text-pure-white transition-colors">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, alert, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  alert?: boolean;
  href?: string;
}) {
  const inner = (
    <div className={`bg-ash-gray rounded-[12px] px-5 py-5 flex flex-col gap-2 ${href ? "hover:bg-white/[0.06] transition-colors" : ""}`}>
      <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-medium ${alert && value > 0 ? "text-blaze-orange" : "text-slate-gray"}`}>
        {icon} {label}
      </div>
      <span className={`text-[36px] font-medium leading-none tabular-nums ${alert && value > 0 ? "text-blaze-orange" : "text-pure-white"}`}>
        {value}
      </span>
      {sub && <span className="text-[12px] text-iron-gray">{sub}</span>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}
