"use client";

import { useState, useEffect, useMemo } from "react";
import { ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IncapacidadInput } from "@/lib/validations/incapacidades";

const TIPOS_EMPRESA = [
  { value: "REPOSO_MEDICO",       label: "Reposo médico" },
  { value: "INCAPACIDAD_IHSS",    label: "Incapacidad IHSS" },
  { value: "CERTIFICADO_TRABAJO", label: "Certificado para el empleador" },
];

const TIPOS_PRIVADA = [
  { value: "REPOSO_MEDICO",       label: "Reposo médico" },
  { value: "CERTIFICADO_TRABAJO", label: "Certificado médico" },
];

interface Props {
  clinicType: "EMPRESA" | "PRIVADA";
  primaryDiagnostico?: string;
  onChange: (data: IncapacidadInput | null) => void;
  forceEnabled?: boolean;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export function IncapacidadSection({ clinicType, primaryDiagnostico, onChange, forceEnabled }: Props) {
  const [enabled, setEnabled] = useState(forceEnabled ?? false);
  const [form, setForm] = useState<{
    tipo: "REPOSO_MEDICO" | "INCAPACIDAD_IHSS" | "CERTIFICADO_TRABAJO";
    fechaInicio: string;
    fechaFin: string;
    diagnostico: string;
    motivo: string;
    restricciones: string;
    recomendaciones: string;
    fechaRetorno: string;
    esIHSS: boolean;
    numeroIHSS: string;
  }>({
    tipo: "REPOSO_MEDICO",
    fechaInicio: today(),
    fechaFin: today(),
    diagnostico: primaryDiagnostico ?? "",
    motivo: "",
    restricciones: "",
    recomendaciones: "",
    fechaRetorno: "",
    esIHSS: false,
    numeroIHSS: "",
  });

  // Sync primaryDiagnostico when user hasn't typed yet
  useEffect(() => {
    if (primaryDiagnostico && !enabled) {
      setForm(f => ({ ...f, diagnostico: primaryDiagnostico }));
    }
  }, [primaryDiagnostico, enabled]);

  const dias = useMemo(() => {
    if (!form.fechaInicio || !form.fechaFin) return 0;
    const a = new Date(form.fechaInicio + "T00:00:00");
    const b = new Date(form.fechaFin    + "T00:00:00");
    return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1);
  }, [form.fechaInicio, form.fechaFin]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    const next = { ...form, [key]: value };
    // Auto-set esIHSS based on tipo
    if (key === "tipo") {
      next.esIHSS = value === "INCAPACIDAD_IHSS";
    }
    setForm(next);
    if (enabled) {
      onChange({
        tipo: next.tipo,
        fechaInicio: next.fechaInicio,
        fechaFin: next.fechaFin,
        diagnostico: next.diagnostico,
        motivo: next.motivo,
        restricciones: next.restricciones || undefined,
        recomendaciones: next.recomendaciones || undefined,
        fechaRetorno: next.fechaRetorno || undefined,
        esIHSS: next.esIHSS,
        numeroIHSS: next.numeroIHSS || undefined,
      });
    }
  }

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      onChange(null);
    } else {
      onChange({
        tipo: form.tipo,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        diagnostico: form.diagnostico,
        motivo: form.motivo,
        restricciones: form.restricciones || undefined,
        recomendaciones: form.recomendaciones || undefined,
        fechaRetorno: form.fechaRetorno || undefined,
        esIHSS: form.esIHSS,
        numeroIHSS: form.numeroIHSS || undefined,
      });
    }
  }

  const tipos = clinicType === "EMPRESA" ? TIPOS_EMPRESA : TIPOS_PRIVADA;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          Incapacidad médica{" "}
          <span className="normal-case font-normal text-iron-gray">(opcional)</span>
        </h3>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={toggle}
            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-sunbeam-yellow" : "bg-[#3a3836]"}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-pure-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
          <span className="text-[12px] text-slate-gray">Emitir certificado</span>
        </label>
      </div>

      {enabled && (
        <div className="bg-input-bg rounded-[10px] p-4 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[11px] text-slate-gray mb-1.5 font-medium">
              Tipo de incapacidad
            </label>
            <div className="flex gap-2 flex-wrap">
              {tipos.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("tipo", t.value as typeof form.tipo)}
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] transition-colors ${
                    form.tipo === t.value
                      ? "bg-sunbeam-yellow text-charcoal-black font-medium"
                      : "bg-ash-gray text-slate-gray hover:text-pure-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-3 gap-3 items-end">
            <Input
              label="Fecha inicio"
              type="date"
              value={form.fechaInicio}
              onChange={e => set("fechaInicio", e.target.value)}
            />
            <Input
              label="Fecha fin"
              type="date"
              min={form.fechaInicio}
              value={form.fechaFin}
              onChange={e => set("fechaFin", e.target.value)}
            />
            <div className="bg-ash-gray rounded-[8px] px-3 py-2.5 text-center">
              <p className="text-[22px] font-bold text-pure-white leading-none">{dias}</p>
              <p className="text-[11px] text-iron-gray mt-0.5">{dias === 1 ? "día" : "días"}</p>
            </div>
          </div>

          {/* Diagnosis */}
          <Input
            label="Diagnóstico (para el certificado)"
            placeholder="Ej: J06.9 - Infección aguda de vías respiratorias superiores"
            value={form.diagnostico}
            onChange={e => set("diagnostico", e.target.value)}
          />

          {/* Motivo */}
          <Textarea
            label="Justificación médica"
            rows={3}
            placeholder="Descripción clínica que justifica la incapacidad..."
            value={form.motivo}
            onChange={e => set("motivo", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Restricciones laborales (opcional)"
              placeholder="No realizar esfuerzo físico..."
              value={form.restricciones}
              onChange={e => set("restricciones", e.target.value)}
            />
            <Input
              label="Fecha de retorno (opcional)"
              type="date"
              min={form.fechaFin}
              value={form.fechaRetorno}
              onChange={e => set("fechaRetorno", e.target.value)}
            />
          </div>

          <Textarea
            label="Recomendaciones (opcional)"
            rows={2}
            placeholder="Reposo absoluto, hidratación, medicación indicada..."
            value={form.recomendaciones}
            onChange={e => set("recomendaciones", e.target.value)}
          />

          {/* IHSS (EMPRESA only, only shown when tipo is INCAPACIDAD_IHSS) */}
          {clinicType === "EMPRESA" && form.tipo === "INCAPACIDAD_IHSS" && (
            <div className="bg-sunbeam-yellow/10 border border-sunbeam-yellow/30 rounded-[8px] p-3 space-y-2">
              <p className="text-[11px] text-sunbeam-yellow font-medium">Trámite IHSS</p>
              <p className="text-[11px] text-slate-gray">
                Este certificado se emitirá para presentación ante el IHSS. Ingresa el número de caso si ya existe.
              </p>
              <Input
                label="Número de caso IHSS (opcional)"
                placeholder="Nº caso..."
                value={form.numeroIHSS}
                onChange={e => set("numeroIHSS", e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
