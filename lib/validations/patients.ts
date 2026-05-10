import { z } from "zod";

export const employeeSchema = z.object({
  employeeNumber:    z.string().min(1, "Número de empleado requerido"),
  firstName:         z.string().min(1, "Nombre requerido"),
  lastName:          z.string().min(1, "Apellido requerido"),
  gender:            z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional(),
  birthDate:         z.string().optional(),
  phone:             z.string().optional(),
  email:             z.string().optional(),
  department:        z.string().optional(),
  position:          z.string().optional(),
  // Medical history (optional — saved to MedicalHistory table)
  bloodType: z.enum(["A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE","AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE"]).optional(),
  allergies:         z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const dependentSchema = z.object({
  firstName:    z.string().min(1, "Nombre requerido"),
  lastName:     z.string().min(1, "Apellido requerido"),
  relationship: z.enum(["CONYUGUE", "HIJO", "HIJA", "PADRE", "MADRE", "OTRO"]),
  gender:       z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional(),
  birthDate:    z.string().optional(),
});

export type DependentInput = z.infer<typeof dependentSchema>;
