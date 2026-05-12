import { z } from "zod";

export const incapacidadInputSchema = z.object({
  tipo: z.enum(["REPOSO_MEDICO", "INCAPACIDAD_IHSS", "CERTIFICADO_TRABAJO"]),
  fechaInicio: z.string().min(1, "Fecha inicio requerida"),
  fechaFin: z.string().min(1, "Fecha fin requerida"),
  diagnostico: z.string().min(1, "Diagnóstico requerido"),
  motivo: z.string().min(5, "Motivo clínico requerido (mín. 5 caracteres)"),
  restricciones: z.string().optional(),
  recomendaciones: z.string().optional(),
  fechaRetorno: z.string().optional(),
  esIHSS: z.boolean().default(false),
  numeroIHSS: z.string().optional(),
});

export type IncapacidadInput = z.infer<typeof incapacidadInputSchema>;
