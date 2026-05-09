import { auth } from "@/lib/auth";
import { getTenantFromHeaders } from "@/lib/tenant";
import type { SessionUser } from "@/types";

export default async function DashboardPage() {
  const session = await auth();
  const { tenantSlug } = await getTenantFromHeaders();
  const user = session?.user as unknown as SessionUser;

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
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-ash-gray rounded-[12px] p-6 flex flex-col gap-2"
          >
            <span className="text-[12px] text-slate-gray uppercase tracking-wide">
              {stat.label}
            </span>
            <span
              className="text-[28px] font-medium text-pure-white"
              style={{ fontFeatureSettings: '"ss01"' }}
            >
              {stat.value}
            </span>
            {stat.sub && (
              <span className="text-[12px] text-slate-gray">{stat.sub}</span>
            )}
          </div>
        ))}
      </div>

      {/* Coming soon modules */}
      <div className="bg-ash-gray rounded-[12px] p-6">
        <p className="text-slate-gray text-[14px]">
          Módulos adicionales en desarrollo — inventario, citas, farmacia y más.
        </p>
      </div>
    </div>
  );
}

const STATS = [
  { label: "Citas hoy", value: "0", sub: "Sin citas programadas" },
  { label: "Stock bajo", value: "0", sub: "Productos bajo mínimo" },
  { label: "Por vencer", value: "0", sub: "Próximos 30 días" },
  { label: "Recetas activas", value: "0", sub: "Pendientes de despacho" },
];
