import Link from "next/link";
import { Building2, Users, UserCheck, CalendarPlus } from "lucide-react";
import { getSuperAdminStats, getAllTenants } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";

const PLAN_VARIANT: Record<string, "muted" | "info" | "warning" | "success"> = {
  BASIC: "muted", PROFESSIONAL: "info", ENTERPRISE: "success",
};
const STATUS_VARIANT: Record<string, "success" | "danger"> = {
  ACTIVE: "success", SUSPENDED: "danger",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Activo", SUSPENDED: "Suspendido" };
const PLAN_LABEL:   Record<string, string> = { BASIC: "Básico", PROFESSIONAL: "Profesional", ENTERPRISE: "Enterprise" };

export default async function AdminOverviewPage() {
  const [stats, tenants] = await Promise.all([
    getSuperAdminStats(),
    getAllTenants(),
  ]);

  const recent = tenants.slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Panel de administración</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          Vista global de todos los tenants en Remedis
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={<Building2 className="w-4 h-4" />} label="Tenants totales"   value={stats.total} />
        <StatCard icon={<UserCheck  className="w-4 h-4" />} label="Tenants activos"  value={stats.active}   accent="emerald" />
        <StatCard icon={<Users      className="w-4 h-4" />} label="Usuarios totales" value={stats.totalUsers} />
        <StatCard icon={<CalendarPlus className="w-4 h-4" />} label="Nuevos este mes" value={stats.newThisMonth} accent="yellow" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-ash-gray rounded-[12px] px-5 py-4 flex items-center justify-between">
          <span className="text-[13px] text-slate-gray">Suspendidos</span>
          <span className="text-[20px] font-medium text-blaze-orange tabular-nums">{stats.suspended}</span>
        </div>
        <div className="bg-ash-gray rounded-[12px] px-5 py-4 flex items-center justify-between">
          <span className="text-[13px] text-slate-gray">Empleados registrados</span>
          <span className="text-[20px] font-medium text-pure-white tabular-nums">{stats.totalEmployees}</span>
        </div>
        <div className="bg-ash-gray rounded-[12px] px-5 py-4 flex items-center justify-between">
          <span className="text-[13px] text-slate-gray">Usuarios/Tenant prom.</span>
          <span className="text-[20px] font-medium text-pure-white tabular-nums">
            {stats.total > 0 ? (stats.totalUsers / stats.total).toFixed(1) : "—"}
          </span>
        </div>
      </div>

      {/* Recent tenants */}
      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-[13px] font-medium text-pure-white">Registros recientes</h2>
          <Link href="/admin/tenants" className="text-[12px] text-slate-gray hover:text-pure-white transition-colors">
            Ver todos →
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#222120]">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Empresa</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Plan</th>
              <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
              <th className="w-20 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Usuarios</th>
              <th className="w-36 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Registro</th>
              <th className="w-16 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {recent.map(t => (
              <tr key={t.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-[13px] text-pure-white font-medium">{t.name}</p>
                  <p className="text-[11px] text-iron-gray font-mono">{t.slug}.remedis.com</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={PLAN_VARIANT[t.plan]}>{PLAN_LABEL[t.plan]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-gray tabular-nums">
                  {t._count.users}
                </td>
                <td className="px-4 py-3 text-right text-[12px] text-iron-gray">
                  {new Date(t.createdAt).toLocaleDateString("es-HN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/tenants/${t.id}`} className="text-[12px] text-slate-gray hover:text-pure-white transition-colors">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode; label: string; value: number; accent?: "emerald" | "yellow";
}) {
  const color = accent === "emerald" ? "text-emerald-green" : accent === "yellow" ? "text-sunbeam-yellow" : "text-pure-white";
  return (
    <div className="bg-ash-gray rounded-[12px] px-5 py-5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-medium text-slate-gray">
        {icon} {label}
      </div>
      <span className={`text-[36px] font-medium leading-none tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
