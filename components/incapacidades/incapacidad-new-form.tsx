"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IncapacidadSection } from "./incapacidad-section";
import { createIncapacidad } from "@/lib/actions/incapacidades";
import type { IncapacidadInput } from "@/lib/validations/incapacidades";

interface Props {
  tenantId: string;
  doctorId: string;
  medicalRecordId: string;
  employeeId: string | null;
  dependentId: string | null;
  clinicType: "EMPRESA" | "PRIVADA";
  primaryDiagnostico?: string;
}

export function IncapacidadNewForm({
  tenantId,
  doctorId,
  medicalRecordId,
  employeeId,
  dependentId,
  clinicType,
  primaryDiagnostico,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<IncapacidadInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) { setError("Completa los datos de la incapacidad"); return; }
    setSaving(true);
    setError("");

    const result = await createIncapacidad(
      tenantId, doctorId, medicalRecordId, employeeId, dependentId, data
    );

    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    router.push(`/incapacidades/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <IncapacidadSection
        clinicType={clinicType}
        primaryDiagnostico={primaryDiagnostico}
        onChange={setData}
        forceEnabled
      />

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={saving || !data}>
          {saving ? "Emitiendo..." : "Emitir incapacidad"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
