import { z } from "zod";

export const tenantInfoSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  logo: z.string().optional(),
});

export const prescriptionSettingsSchema = z.object({
  prescriptionValidDays: z.coerce.number().int().min(1).max(365),
  legalText: z.string().max(500).optional(),
});

export const inviteUserSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum([
    "ADMIN_CLINICA", "MEDICO", "ENFERMERA", "FARMACEUTICO",
    "RRHH", "AUDITOR", "RECEPCIONISTA",
  ]),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const warehouseSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  source: z.enum(["EMPRESA", "IHSS"]),
});

export const doctorSchema = z.object({
  name:          z.string().min(2, "Nombre requerido"),
  email:         z.string().email("Email inválido"),
  specialty:     z.string().max(100).optional(),
  licenseNumber: z.string().max(50).optional(),
  password:      z.string().min(8, "Mínimo 8 caracteres").optional(),
});

export const alertSettingsSchema = z.object({
  expiryAlertDays:          z.coerce.number().int().min(1).max(365),
  stockAlertEnabled:        z.boolean(),
  expiryAlertEnabled:       z.boolean(),
  expiredAlertEnabled:      z.boolean(),
  prescriptionAlertEnabled: z.boolean(),
});
