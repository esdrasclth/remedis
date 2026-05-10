import { z } from "zod";

export const appointmentSchema = z.object({
  clinicId:    z.string().min(1, "Sede requerida"),
  doctorId:    z.string().min(1, "Médico requerido"),
  employeeId:  z.string().optional(),
  dependentId: z.string().optional(),
  type:        z.enum(["PRIMERA_VEZ", "CONTROL", "URGENCIA", "SEGUIMIENTO"]),
  scheduledAt: z.string().min(1, "Fecha y hora requeridas"),
  duration:    z.coerce.number().min(15).max(240).default(30),
  notes:       z.string().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
