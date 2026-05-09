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
    ? await Promise.all([
        getLowStockCount(tenantId),
        getExpiringCount(tenantId, 30),
      ])
    : [0, 0];

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-[24px] font-medium text-pure-white"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          Dashboard
        </h2>
        <p className="text-slate-gray text-[13px] mt-1">
          Bienvenido de vuelta, {user?.name ?? user?.email}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* Modules */}
      <div className="bg-ash-gray rounded-[12px] p-6">
        <p className="text-slate-gray text-[14px]">
          Módulos en desarrollo — citas, consultas, farmacia y más próximamente.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  alert,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  alert?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`bg-ash-gray rounded-[12px] p-6 flex flex-col gap-2 ${href ? "hover:bg-ocean-abyss/60 transition-colors cursor-pointer" : ""}`}
    >
      <span className="text-[12px] text-slate-gray uppercase tracking-wide">{label}</span>
      <span
        className={`text-[28px] font-medium ${alert ? "text-blaze-orange" : "text-pure-white"}`}
        style={{ fontFeatureSettings: '"ss01"' }}
      >
        {value}
      </span>
      {sub && <span className="text-[12px] text-slate-gray">{sub}</span>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
