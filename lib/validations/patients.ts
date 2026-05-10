import { z } from "zod";

export const employeeSchema = z.object({
  employeeNumber: z.string().min(1, "Número de empleado requerido"),
  firstName:      z.string().min(1, "Nombre requerido"),
  lastName:       z.string().min(1, "Apellido requerido"),
  gender:         z.enum(["MASCULINO", "FEMENINO", "OTRO"]).optional(),
  birthDate:      z.string().optional(),
  phone:          z.string().optional(),
  email:          z.string().optional(),
  department:     z.string().optional(),
  position:       z.string().optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
