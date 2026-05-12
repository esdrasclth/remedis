"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTenantInfo } from "@/lib/actions/settings";

interface Props {
  tenant: {
    id:   string;
    name: string;
    slug: string;
    plan: string;
    logo: string | null;
  };
  tenantId: string;
}

const PLAN_LABEL: Record<string, string> = {
  BASIC: "Básico", PROFESSIONAL: "Profesional", ENTERPRISE: "Enterprise",
};

export function ClinicForm({ tenant, tenantId }: Props) {
  const router  = useRouter();
  const [name,  setName]  = useState(tenant.name);
  const [logo,  setLogo]  = useState(tenant.logo ?? "");
  const [error, setError] = useState("");
  const [ok,    setOk]    = useState(false);
  const [busy,  setBusy]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setOk(false);
    const result = await updateTenantInfo(tenantId, { name, logo });
    if (result.success) { setOk(true); router.refresh(); }
    else setError(result.error);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre de la clínica / empresa"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <div>
          <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">
            Subdominio
          </label>
          <div className="bg-table-header border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-iron-gray font-mono select-none">
            {tenant.slug}.remedis.com
          </div>
        </div>
      </div>

      <Input
        label="URL del logo (opcional)"
        placeholder="https://cdn.ejemplo.com/logo.png"
        value={logo}
        onChange={e => setLogo(e.target.value)}
      />

      {logo && (
        <div className="flex items-center gap-3 p-3 bg-table-header rounded-[10px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Logo preview" className="h-10 w-auto object-contain rounded" onError={e => (e.currentTarget.style.display = "none")} />
          <p className="text-[12px] text-slate-gray">Vista previa del logo</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-table-header rounded-[8px]">
          <Building2 className="w-3.5 h-3.5 text-iron-gray" />
          <span className="text-[12px] text-slate-gray">Plan: </span>
          <span className="text-[12px] text-pure-white font-medium">{PLAN_LABEL[tenant.plan] ?? tenant.plan}</span>
        </div>
        <div className="flex-1" />
        {ok    && <p className="text-[12px] text-emerald-green">Guardado correctamente</p>}
        {error && <p className="text-[12px] text-blaze-orange">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          <Save className="w-3.5 h-3.5" /> {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
