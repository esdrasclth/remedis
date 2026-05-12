import Link from "next/link";
import { Building2, Bell } from "lucide-react";
import { getAllTenants, getPlanRequests } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";

const PLAN_VARIANT: Record<string, "muted" | "info" | "success" | "warning"> = {
  TRIAL: "warning", BASIC: "muted", PROFESSIONAL: "info", ENTERPRISE: "success",
};
const STATUS_VARIANT: Record<string, "success" | "danger"> = {
  ACTIVE: "success", SUSPENDED: "danger",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Activo", SUSPENDED: "Suspendido" };
const PLAN_LABEL:   Record<string, string> = { TRIAL: "Trial", BASIC: "Básico", PROFESSIONAL: "Pro", ENTERPRISE: "Enterprise" };

const REQUEST_STATUS_COLOR: Record<string, string> = {
  PENDING:   "text-sunbeam-yellow bg-sunbeam-yellow/10",
  CONTACTED: "text-blue-400 bg-blue-400/10",
};
const REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", CONTACTED: "Contactado",
};

export default async function AdminTenantsPage() {
  const [tenants, allPending] = await Promise.all([
    getAllTenants(),
    getPlanRequests(),
  ]);

  const pendingRequests = allPending.filter(r => r.status === "PENDING");
  const tenantsWithRequests = tenants.filter(t => t.planRequests.length > 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-iron-gray" />
          <div>
            <h1 className="text-[20px] font-medium text-pure-white">Tenants</h1>
            <p className="text-[13px] text-slate-gray mt-0.5">{tenants.length} clínicas registradas</p>
          </div>
        </div>
        {pendingRequests.length > 0 && (
          <div className="flex items-center gap-2 bg-sunbeam-yellow/10 border border-sunbeam-yellow/20 rounded-[10px] px-4 py-2">
            <Bell className="w-3.5 h-3.5 text-sunbeam-yellow" />
            <span className="text-[13px] text-sunbeam-yellow font-medium">
              {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? "es" : ""} pendiente{pendingRequests.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Plan summary */}
      <div className="grid grid-cols-4 gap-3">
        {(["TRIAL","BASIC","PROFESSIONAL","ENTERPRISE"] as const).map(plan => {
          const count = tenants.filter(t => t.plan === plan).length;
          return (
            <div key={plan} className="bg-ash-gray rounded-[12px] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-gray uppercase tracking-wide">{PLAN_LABEL[plan]}</p>
                <p className="text-[24px] font-medium text-pure-white tabular-nums mt-1">{count}</p>
              </div>
              <Badge variant={PLAN_VARIANT[plan]}>{PLAN_LABEL[plan]}</Badge>
            </div>
          );
        })}
      </div>

      {/* Solicitudes activas */}
      {tenantsWithRequests.length > 0 && (
        <div className="bg-ash-gray rounded-[12px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-sunbeam-yellow" />
            <h2 className="text-[13px] font-medium text-pure-white">
              Solicitudes de plan activas
            </h2>
            <span className="text-[11px] text-iron-gray ml-1">
              ({tenantsWithRequests.length} empresa{tenantsWithRequests.length !== 1 ? "s" : ""})
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Empresa</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Plan actual</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Solicita</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Contacto</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
                <th className="w-36 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Fecha</th>
                <th className="w-16 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {tenantsWithRequests.map(t =>
                t.planRequests.map((r, i) => (
                  <tr key={r.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    {i === 0 ? (
                      <td className="px-4 py-3" rowSpan={t.planRequests.length}>
                        <p className="text-[13px] text-pure-white font-medium">{t.name}</p>
                        <p className="text-[11px] text-iron-gray font-mono">{t.slug}</p>
                      </td>
                    ) : null}
                    {i === 0 ? (
                      <td className="px-4 py-3" rowSpan={t.planRequests.length}>
                        <Badge variant={PLAN_VARIANT[t.plan]}>{PLAN_LABEL[t.plan]}</Badge>
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-pure-white font-medium">
                        {PLAN_LABEL[r.planKey] ?? r.planKey}
                      </p>
                      <p className="text-[11px] text-iron-gray">
                        {r.billing === "annual" ? "Anual" : "Mensual"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-gray">{r.contactName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${REQUEST_STATUS_COLOR[r.status] ?? "text-iron-gray bg-ash-gray"}`}>
                        {REQUEST_STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[11px] text-iron-gray">
                      {new Date(r.createdAt).toLocaleDateString("es-HN")}
                    </td>
                    {i === 0 ? (
                      <td className="px-4 py-3 text-right" rowSpan={t.planRequests.length}>
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="text-[12px] text-slate-gray hover:text-pure-white transition-colors"
                        >
                          Gestionar →
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* All tenants table */}
      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-[13px] font-medium text-pure-white">Todas las empresas</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-table-header">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Empresa</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Tipo</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Plan</th>
              <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
              <th className="w-20 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Usuarios</th>
              <th className="w-24 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Emp.</th>
              <th className="w-24 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Prods.</th>
              <th className="w-36 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Registro</th>
              <th className="w-16 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-[13px] text-pure-white font-medium">{t.name}</p>
                      <p className="text-[11px] text-iron-gray font-mono">{t.slug}.remedis.com</p>
                    </div>
                    {t.planRequests.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-sunbeam-yellow shrink-0" title="Tiene solicitud de plan pendiente" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    t.clinicType === "PRIVADA"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {t.clinicType === "PRIVADA" ? "Privada" : "Empresa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={PLAN_VARIANT[t.plan]}>{PLAN_LABEL[t.plan]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-gray tabular-nums">{t._count.users}</td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-gray tabular-nums">{t._count.employees}</td>
                <td className="px-4 py-3 text-right text-[13px] text-slate-gray tabular-nums">{t._count.products}</td>
                <td className="px-4 py-3 text-right text-[12px] text-iron-gray">
                  {new Date(t.createdAt).toLocaleDateString("es-HN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/tenants/${t.id}`}
                    className="text-[12px] text-slate-gray hover:text-pure-white transition-colors"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-slate-gray">Sin tenants registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
