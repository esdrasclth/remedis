"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updatePrescriptionSettings } from "@/lib/actions/settings";

interface Props {
  tenantId: string;
  initialDays: number;
  initialLegalText: string;
}

export function PrescriptionForm({ tenantId, initialDays, initialLegalText }: Props) {
  const router  = useRouter();
  const [days,      setDays]      = useState(String(initialDays));
  const [legalText, setLegalText] = useState(initialLegalText);
  const [error,     setError]     = useState("");
  const [ok,        setOk]        = useState(false);
  const [busy,      setBusy]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setOk(false);
    const result = await updatePrescriptionSettings(tenantId, {
      prescriptionValidDays: days,
      legalText,
    });
    if (result.success) { setOk(true); router.refresh(); }
    else setError(result.error);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="max-w-xs">
        <Input
          label="Validez de recetas (días)"
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={e => setDays(e.target.value)}
          required
        />
        <p className="text-[11px] text-iron-gray mt-1.5">
          Las recetas vencerán automáticamente después de este período.
        </p>
      </div>

      <Textarea
        label="Texto legal al pie de receta (opcional)"
        placeholder="Ej: Este medicamento es de uso exclusivo del paciente. No se permite su venta."
        value={legalText}
        onChange={e => setLegalText(e.target.value)}
        rows={4}
      />

      <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
        {ok    && <p className="text-[12px] text-emerald-green">Guardado correctamente</p>}
        {error && <p className="text-[12px] text-blaze-orange">{error}</p>}
        <div className="flex-1" />
        <Button type="submit" size="sm" disabled={busy}>
          <Save className="w-3.5 h-3.5" /> {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
