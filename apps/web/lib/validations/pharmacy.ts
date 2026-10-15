import { z } from "zod";

export const otcItemSchema = z.object({
  productId:   z.string().min(1),
  productName: z.string().optional(),
  quantity:    z.number().int().min(1, "Cantidad mínima: 1"),
});

export const otcDispensationSchema = z.object({
  employeeId:  z.string().optional(),
  dependentId: z.string().optional(),
  items:       z.array(otcItemSchema).min(1, "Agrega al menos un producto"),
  notes:       z.string().optional(),
});

export const rxDispensationSchema = z.object({
  prescriptionId: z.string().min(1, "Receta requerida"),
  items: z.array(z.object({
    prescriptionItemId: z.string().min(1),
    productId:          z.string().min(1),
    quantity:           z.number().int().min(1),
  })).min(1, "Selecciona al menos un medicamento"),
  notes: z.string().optional(),
});

export type OTCDispensationInput = z.infer<typeof otcDispensationSchema>;
export type RXDispensationInput  = z.infer<typeof rxDispensationSchema>;
