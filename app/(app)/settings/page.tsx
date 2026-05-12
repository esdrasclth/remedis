import Link from "next/link";
import { Settings, Building2, Users, FileText, Package, Stethoscope, Bell } from "lucide-react";
import { getTenantFromHeaders, getClinicType } from "@/lib/tenant";
import { getTenantSettings, getTenantUsers, getDoctors, getAlertSettings } from "@/lib/actions/settings";
import { getWarehouses } from "@/lib/actions/inventory";
import { ClinicForm } from "@/components/settings/clinic-form";
import { UsersPanel } from "@/components/settings/users-panel";
import { PrescriptionForm } from "@/components/settings/prescription-form";
import { WarehousesPanel } from "@/components/settings/warehouses-panel";
import { DoctorsPanel } from "@/components/settings/doctors-panel";
import { AlertSettingsForm } from "@/components/settings/alert-settings-form";

const TABS = [
  { key: "clinica",   label: "Clínica",   icon: Building2 },
  { key: "usuarios",  label: "Usuarios",  icon: Users },
  { key: "medicos",   label: "Médicos",   icon: Stethoscope },
  { key: "recetas",   label: "Recetas",   icon: FileText },
  { key: "almacenes", label: "Almacenes", icon: Package },
  { key: "alertas",   label: "Alertas",   icon: Bell },
] as const;

type Tab = typeof TABS[number]["key"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const { tab: rawTab } = await searchParams;
  const tab: Tab = (TABS.some(t => t.key === rawTab) ? rawTab : "clinica") as Tab;

  const [tenant, users, warehouses, doctors, alertSettings, clinicType] = await Promise.all([
    getTenantSettings(tenantId),
    getTenantUsers(tenantId),
    getWarehouses(tenantId),
    getDoctors(tenantId),
    getAlertSettings(tenantId),
    getClinicType(tenantId),
  ]);
  if (!tenant) return null;

  const config = (tenant.config ?? {}) as Record<string, unknown>;
  const prescriptionValidDays = (config.prescriptionValidDays as number | undefined) ?? 30;
  const legalText = (config.legalText as string | undefined) ?? "";

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-iron-gray" />
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Configuración</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">Gestiona la configuración de tu clínica</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ash-gray p-1 rounded-[10px] w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/settings?tab=${t.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] transition-colors ${
                active
                  ? "bg-sunbeam-yellow text-charcoal-black font-medium"
                  : "text-slate-gray hover:text-pure-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-ash-gray rounded-[12px] p-6">
        {tab === "clinica" && (
          <div className="space-y-1 mb-6">
            <h2 className="text-[14px] font-medium text-pure-white">Información de la clínica</h2>
            <p className="text-[12px] text-slate-gray">Datos que aparecerán en recetas y documentos oficiales.</p>
          </div>
        )}
        {tab === "usuarios" && (
          <div className="space-y-1 mb-6">
            <h2 className="text-[14px] font-medium text-pure-white">Gestión de usuarios</h2>
            <p className="text-[12px] text-slate-gray">Administra los miembros del equipo y sus permisos.</p>
          </div>
        )}
        {tab === "recetas" && (
          <div className="space-y-1 mb-6">
            <h2 className="text-[14px] font-medium text-pure-white">Configuración de recetas</h2>
            <p className="text-[12px] text-slate-gray">Define la validez y el texto legal de las recetas médicas.</p>
          </div>
        )}
        {tab === "almacenes" && (
          <div className="space-y-1 mb-6">
            <h2 className="text-[14px] font-medium text-pure-white">Almacenes</h2>
            <p className="text-[12px] text-slate-gray">Configura los almacenes físicos donde se almacena el inventario.</p>
          </div>
        )}
        {tab === "medicos" && (
          <div className="space-y-1 mb-6">
            <h2 className="text-[14px] font-medium text-pure-white">Médicos</h2>
            <p className="text-[12px] text-slate-gray">Gestiona el catálogo de médicos tratantes de la clínica.</p>
          </div>
        )}
        {tab === "alertas" && (
          <div className="space-y-1 mb-6">
            <h2 className="text-[14px] font-medium text-pure-white">Alertas y umbrales</h2>
            <p className="text-[12px] text-slate-gray">Configura qué tipos de alertas se generan y cuándo.</p>
          </div>
        )}

        {tab === "clinica" && (
          <ClinicForm
            tenant={{
              id:   tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              plan: tenant.plan,
              logo: tenant.logo ?? null,
            }}
            tenantId={tenantId}
          />
        )}
        {tab === "usuarios" && (
          <UsersPanel tenantId={tenantId} users={users} />
        )}
        {tab === "recetas" && (
          <PrescriptionForm
            tenantId={tenantId}
            initialDays={prescriptionValidDays}
            initialLegalText={legalText}
          />
        )}
        {tab === "almacenes" && (
          <WarehousesPanel tenantId={tenantId} warehouses={warehouses} clinicType={clinicType} />
        )}
        {tab === "medicos" && (
          <DoctorsPanel tenantId={tenantId} doctors={doctors} />
        )}
        {tab === "alertas" && (
          <AlertSettingsForm tenantId={tenantId} initial={alertSettings} />
        )}
      </div>
    </div>
  );
}
