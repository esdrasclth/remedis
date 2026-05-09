import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getLowStockCount, getExpiringCount } from "@/lib/actions/inventory";
import type { SessionUser } from "@/types";

export default async function DashboardPage() {
  const session = await auth();
  const { tenantId } = await getTenantFromHeaders();
  const user = session?.user as unknown as SessionUser;

  const [lowStock, expiring30] = tenantId
    ? await Promise.all([getLowStockCount(tenantId), getExpiringCount(tenantId, 30)])
    : [0, 0];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-medium text-white">Dashboard</h2>
        <p className="text-[13px] text-slate-gray mt-0.5">
          Bienvenido, {user?.name ?? user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Citas hoy" value={0} sub="Sin citas programadas" />
        <StatCard
          label="Stock bajo"
          value={lowStock}
          sub="Productos bajo mínimo"
          alert={lowStock > 0}
          href="/inventory"
        />
        <StatCard
          label="Por vencer"
          value={expiring30}
          sub="Próximos 30 días"
          alert={expiring30 > 0}
          href="/inventory"
        />
        <StatCard label="Recetas activas" value={0} sub="Pendientes de despacho" />
      </div>

      {/* Módulos en desarrollo */}
      <div className="rounded-[10px] border border-[#2e2c29] bg-[#1c1b1a] px-5 py-4">
        <p className="text-[13px] text-slate-gray">
          Módulos en desarrollo — citas, consultas, farmacia y más próximamente.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, alert, href,
}: {
  label: string;
  value: number;
  sub?: string;
  alert?: boolean;
  href?: string;
}) {
  const inner = (
    <div
      className={[
        "bg-[#1c1b1a] border border-[#2e2c29] rounded-[10px] px-5 py-4 flex flex-col gap-1.5",
        href ? "hover:border-[#3d3b38] transition-colors cursor-pointer" : "",
      ].join(" ")}
    >
      <span className="text-[11px] text-slate-gray uppercase tracking-wide">{label}</span>
      <span
        className={`text-[30px] font-medium leading-none ${alert ? "text-blaze-orange" : "text-white"}`}
      >
        {value}
      </span>
      {sub && <span className="text-[12px] text-[#5a5854]">{sub}</span>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
