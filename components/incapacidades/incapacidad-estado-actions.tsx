"use client";

import { useState, useTransition } from "react";
import { updateIncapacidadEstado } from "@/lib/actions/incapacidades";

const TRANSITIONS: Record<string, { label: string; next: "EMITIDA" | "ENTREGADA_PACIENTE" | "PRESENTADA_RRHH" | "CANCELADA" }[]> = {
  EMITIDA: [
    { label: "Marcar como entregada", next: "ENTREGADA_PACIENTE" },
    { label: "Cancelar", next: "CANCELADA" },
  ],
  ENTREGADA_PACIENTE: [
    { label: "Presentada a RRHH", next: "PRESENTADA_RRHH" },
    { label: "Cancelar", next: "CANCELADA" },
  ],
  PRESENTADA_RRHH: [
    { label: "Cancelar", next: "CANCELADA" },
  ],
  CANCELADA: [],
};

interface Props {
  tenantId: string;
  id: string;
  estadoActual: string;
}

export function IncapacidadEstadoActions({ tenantId, id, estadoActual }: Props) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const transitions = TRANSITIONS[estadoActual] ?? [];
  if (transitions.length === 0) return null;

  function handle(next: Parameters<typeof updateIncapacidadEstado>[2]) {
    setError("");
    startTransition(async () => {
      const result = await updateIncapacidadEstado(tenantId, id, next);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="bg-ash-gray rounded-[12px] p-4 space-y-2">
      <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Cambiar estado</h3>
      <div className="space-y-1.5">
        {transitions.map(t => (
          <button
            key={t.next}
            type="button"
            disabled={pending}
            onClick={() => handle(t.next)}
            className={`w-full text-left px-3 py-2 rounded-[6px] text-[12px] transition-colors disabled:opacity-50 ${
              t.next === "CANCELADA"
                ? "bg-blaze-orange/10 text-blaze-orange hover:bg-blaze-orange/20"
                : "bg-ocean-abyss text-pure-white hover:bg-ocean-abyss/80"
            }`}
          >
            {pending ? "Actualizando..." : t.label}
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] text-blaze-orange">{error}</p>}
    </div>
  );
}
