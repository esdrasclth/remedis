import { z } from "zod";

export const supplierSchema = z.object({
  name:    z.string().min(1, "Nombre requerido"),
  rtn:     z.string().optional(),
  contact: z.string().optional(),
  phone:   z.string().optional(),
  email:   z.string().optional(),
  address: z.string().optional(),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().optional(),
  source:     z.enum(["EMPRESA", "IHSS"]).default("EMPRESA"),
  notes:      z.string().optional(),
  items: z.array(z.object({
    productId:    z.string().min(1),
    productName:  z.string().optional(),
    requestedQty: z.number().int().min(1, "Cantidad mínima: 1"),
    unitCost:     z.number().positive().optional(),
  })).min(1, "Agrega al menos un producto"),
});

export const receiveBatchSchema = z.object({
  orderItemId: z.string().min(1),
  productId:   z.string().min(1),
  warehouseId: z.string().min(1, "Almacén requerido"),
  batchNumber: z.string().min(1, "Número de lote requerido"),
  mfgDate:     z.string().optional(),
  expiryDate:  z.string().min(1, "Fecha de vencimiento requerida"),
  receivedQty: z.number().int().min(1, "Cantidad mínima: 1"),
  source:      z.enum(["EMPRESA", "IHSS"]).default("EMPRESA"),
});

export const receiveOrderSchema = z.object({
  orderId: z.string().min(1),
  notes:   z.string().optional(),
  batches: z.array(receiveBatchSchema).min(1, "Registra al menos un lote"),
});

export type SupplierInput      = z.infer<typeof supplierSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type ReceiveOrderInput  = z.infer<typeof receiveOrderSchema>;
