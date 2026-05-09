import { z } from "zod";

export const productSchema = z.object({
  genericName: z.string().min(2, "Mínimo 2 caracteres"),
  commercialName: z.string().optional(),
  category: z.enum(["MEDICAMENTO", "INSUMO_DESCARTABLE", "EQUIPO_MEDICO"]),
  form: z.string().optional(),
  concentration: z.string().optional(),
  unit: z.string().optional(),
  requiresPrescription: z.boolean().default(false),
  defaultSource: z.enum(["EMPRESA", "IHSS"]),
  minStock: z.coerce.number().min(0).default(0),
});

export const batchSchema = z.object({
  warehouseId: z.string().min(1, "Selecciona un almacén"),
  batchNumber: z.string().min(1, "Ingresa el número de lote"),
  mfgDate: z.string().optional(),
  expiryDate: z.string().min(1, "Ingresa la fecha de vencimiento"),
  initialQty: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  source: z.enum(["EMPRESA", "IHSS"]),
});

export const adjustmentSchema = z.object({
  batchId: z.string().min(1),
  newQty: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  reason: z.string().min(3, "Ingresa un motivo (mínimo 3 caracteres)"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
