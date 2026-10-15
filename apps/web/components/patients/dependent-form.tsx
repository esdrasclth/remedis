"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createDependent } from "@/lib/actions/patients";

interface Props { tenantId: string; employeeId: string }

const RELATIONSHIPS = [
  { value: "CONYUGUE", label: "Cónyuge" },
  { value: "HIJO",     label: "Hijo" },
  { value: "HIJA",     label: "Hija" },
  { value: "PADRE",    label: "Padre" },
  { value: "MADRE",    label: "Madre" },
  { value: "OTRO",     label: "Otro" },
] as const;

export function DependentForm({ tenantId, employeeId }: Props) {
  const router  = useRouter();
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      firstName:    fd.get("firstName")    as string,
      lastName:     fd.get("lastName")     as string,
      relationship: fd.get("relationship") as string,
      gender:       (fd.get("gender") as string) || undefined,
      birthDate:    (fd.get("birthDate") as string) || undefined,
    };

    setLoading(true);
    setError("");
    const result = await createDependent(tenantId, employeeId, data);
    setLoading(false);

    if (!result.success) { setError(result.error); return; }
    router.push(`/patients/${employeeId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Datos del dependiente</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input name="firstName" label="Nombre *" required />
          <Input name="lastName"  label="Apellido *" required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">
              Parentesco *
            </label>
            <select
              name="relationship"
              required
              className="w-full bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white focus:outline-none focus:border-iron-gray"
            >
              <option value="">— Seleccionar —</option>
              {RELATIONSHIPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">
              Género
            </label>
            <select
              name="gender"
              className="w-full bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white focus:outline-none focus:border-iron-gray"
            >
              <option value="">Sin especificar</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <Input name="birthDate" label="Fecha de nacimiento" type="date" />
        </div>
      </section>

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={loading}>
          {loading ? "Guardando..." : "Registrar dependiente"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
