import Link from "next/link";
import { Building2 } from "lucide-react";
import { getAllTenants } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";

const PLAN_VARIANT: Record<string, "muted" | "info" | "success"> = {
  BASIC: "muted", PROFESSIONAL: "info", ENTERPRISE: "success",
};
const STATUS_VARIANT: Record<string, "success" | "danger"> = {
  ACTIVE: "success", SUSPENDED: "danger",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Activo", SUSPENDED: "Suspendido" };
const PLAN_LABEL:   Record<string, string> = { BASIC: "Básico", PROFESSIONAL: "Profesional", ENTERPRISE: "Enterprise" };

export default async function AdminTenantsPage() {
  const tenants = await getAllTenants();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-iron-gray" />
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Tenants</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">{tenants.length} clínicas registradas</p>
        </div>
      </div>

      {/* Plan summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["BASIC","PROFESSIONAL","ENTERPRISE"] as const).map(plan => {
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

      {/* Table */}
      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#222120]">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Empresa</th>
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
                  <p className="text-[13px] text-pure-white font-medium">{t.name}</p>
                  <p className="text-[11px] text-iron-gray font-mono">{t.slug}.remedis.com</p>
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
