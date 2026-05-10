import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Package, Calendar, FileText, Pill, Stethoscope, Warehouse } from "lucide-react";
import { getTenantDetail } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { TenantActions } from "@/components/admin/tenant-actions";

const PLAN_VARIANT: Record<string, "muted" | "info" | "success"> = {
  BASIC: "muted", PROFESSIONAL: "info", ENTERPRISE: "success",
};
const STATUS_VARIANT: Record<string, "success" | "danger"> = {
  ACTIVE: "success", SUSPENDED: "danger",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Activo", SUSPENDED: "Suspendido" };
const PLAN_LABEL:   Record<string, string> = { BASIC: "Básico", PROFESSIONAL: "Profesional", ENTERPRISE: "Enterprise" };
const ROLE_LABEL:   Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN_CLINICA: "Admin", MEDICO: "Médico",
  ENFERMERA: "Enfermera", FARMACEUTICO: "Farmacéutico", RRHH: "RRHH",
  AUDITOR: "Auditor", RECEPCIONISTA: "Recepcionista",
};

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const tenant = await getTenantDetail(tenantId);
  if (!tenant) notFound();

  const config = (tenant.config ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/tenants" className="text-iron-gray hover:text-pure-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] font-medium text-pure-white">{tenant.name}</h1>
              <Badge variant={PLAN_VARIANT[tenant.plan]}>{PLAN_LABEL[tenant.plan]}</Badge>
              <Badge variant={STATUS_VARIANT[tenant.status]}>{STATUS_LABEL[tenant.status]}</Badge>
            </div>
            <p className="text-[13px] text-iron-gray font-mono mt-0.5">
              {tenant.slug}.remedis.com · Registro: {new Date(tenant.createdAt).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left — main content */}
        <div className="col-span-2 space-y-4">
          {/* Usage stats */}
          <div className="grid grid-cols-3 gap-3">
            <UsageStat icon={<Users      className="w-4 h-4" />} label="Empleados"   value={tenant.stats.employees} />
            <UsageStat icon={<Package    className="w-4 h-4" />} label="Productos"   value={tenant.stats.products} />
            <UsageStat icon={<Calendar   className="w-4 h-4" />} label="Citas"       value={tenant.stats.appointments} />
            <UsageStat icon={<Stethoscope className="w-4 h-4" />} label="Consultas"  value={tenant.stats.medicalRecords} />
            <UsageStat icon={<FileText   className="w-4 h-4" />} label="Recetas"     value={tenant.stats.prescriptions} />
            <UsageStat icon={<Pill       className="w-4 h-4" />} label="Despachos"   value={tenant.stats.dispensations} />
          </div>

          {/* Users table */}
          <div className="bg-ash-gray rounded-[12px] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-[13px] font-medium text-pure-white flex items-center gap-2">
                <Users className="w-4 h-4 text-iron-gray" />
                Usuarios ({tenant.users.length})
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#222120]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Usuario</th>
                  <th className="w-32 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Rol</th>
                  <th className="w-24 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
                  <th className="w-32 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Creado</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map(u => (
                  <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-pure-white font-medium">{u.name ?? "—"}</p>
                      <p className="text-[11px] text-slate-gray">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-slate-gray">{ROLE_LABEL[u.role] ?? u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? "success" : "muted"}>
                        {u.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-iron-gray">
                      {new Date(u.createdAt).toLocaleDateString("es-HN")}
                    </td>
                  </tr>
                ))}
                {tenant.users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[13px] text-iron-gray">
                      Sin usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Warehouses */}
          {tenant.warehouses.length > 0 && (
            <div className="bg-ash-gray rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-[13px] font-medium text-pure-white flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-iron-gray" />
                  Almacenes ({tenant.warehouses.length})
                </h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {tenant.warehouses.map(w => (
                  <div key={w.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[13px] text-pure-white">{w.name}</span>
                    <Badge variant={w.source === "IHSS" ? "info" : "muted"}>{w.source}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config snapshot */}
          {Object.keys(config).length > 0 && (
            <div className="bg-ash-gray rounded-[12px] p-5">
              <h2 className="text-[13px] font-medium text-pure-white mb-3">Configuración</h2>
              <div className="space-y-2">
                {config.prescriptionValidDays !== undefined && (
                  <ConfigRow label="Validez de recetas" value={`${config.prescriptionValidDays} días`} />
                )}
                {!!config.rtn && (
                  <ConfigRow label="RTN" value={String(config.rtn)} />
                )}
                {!!config.legalText && (
                  <ConfigRow label="Texto legal" value={String(config.legalText)} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — actions */}
        <div className="col-span-1">
          <div className="bg-ash-gray rounded-[12px] p-5">
            <h2 className="text-[13px] font-medium text-pure-white mb-4">Acciones</h2>
            <TenantActions
              tenantId={tenant.id}
              currentPlan={tenant.plan}
              currentStatus={tenant.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-ash-gray rounded-[12px] px-4 py-4 flex items-center gap-3">
      <div className="text-iron-gray">{icon}</div>
      <div>
        <p className="text-[11px] text-slate-gray">{label}</p>
        <p className="text-[20px] font-medium text-pure-white tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[12px] text-slate-gray shrink-0">{label}</span>
      <span className="text-[12px] text-pure-white text-right">{value}</span>
    </div>
  );
}
