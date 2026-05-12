import { z } from "zod";

export const step1Schema = z.object({
  companyName: z.string().min(2, "Nombre requerido"),
  slug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(30, "Máximo 30 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  rtn:        z.string().optional(),
  clinicType: z.enum(["EMPRESA", "PRIVADA"]),
});

export const step2Schema = z.object({
  adminName:  z.string().min(2, "Nombre requerido"),
  adminEmail: z.string().email("Email inválido"),
  password:   z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const registerSchema = z.object({
  companyName: z.string().min(2),
  slug:        z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  rtn:         z.string().optional(),
  clinicType:  z.enum(["EMPRESA", "PRIVADA"]),
  adminName:   z.string().min(2),
  adminEmail:  z.string().email(),
  password:    z.string().min(8),
});
