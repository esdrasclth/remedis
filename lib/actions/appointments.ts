"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validations/appointments";

export type { AppointmentInput } from "@/lib/validations/appointments";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function getAppointments(tenantId: string, options?: {
  date?: string;
  status?: string;
}) {
  const where: Record<string, unknown> = { tenantId };

  if (options?.status) where.status = options.status;

  if (options?.date) {
    const d = new Date(options.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    where.scheduledAt = { gte: start, lte: end };
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      doctor:   { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      medicalRecord: { select: { id: true } },
    },
  });
}

export async function getTodayAppointments(tenantId: string) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return prisma.appointment.findMany({
    where: { tenantId, scheduledAt: { gte: start, lte: end } },
    orderBy: { scheduledAt: "asc" },
    include: {
      doctor:   { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      medicalRecord: { select: { id: true } },
    },
  });
}

export async function getClinics(tenantId: string) {
  return prisma.clinic.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true },
  });
}

export async function getDoctors(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId, isActive: true, role: { in: ["MEDICO", "ENFERMERA", "ADMIN_CLINICA"] } },
    select: { id: true, name: true, role: true },
  });
}

export async function createAppointment(
  tenantId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = appointmentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  if (!parsed.data.employeeId && !parsed.data.dependentId) {
    return { success: false, error: "Debe seleccionar un paciente." };
  }

  const appt = await prisma.appointment.create({
    data: {
      tenantId,
      clinicId:    parsed.data.clinicId,
      doctorId:    parsed.data.doctorId,
      employeeId:  parsed.data.employeeId  || null,
      dependentId: parsed.data.dependentId || null,
      type:        parsed.data.type,
      scheduledAt: new Date(parsed.data.scheduledAt),
      duration:    parsed.data.duration,
      notes:       parsed.data.notes || null,
    },
  });

  revalidatePath("/appointments");
  return { success: true, data: { id: appt.id } };
}

export async function updateAppointmentStatus(
  tenantId: string,
  appointmentId: string,
  status: "PROGRAMADA" | "CONFIRMADA" | "EN_CONSULTA" | "COMPLETADA" | "CANCELADA" | "NO_ASISTIO",
  cancelReason?: string
): Promise<ActionResult<void>> {
  await prisma.appointment.updateMany({
    where: { id: appointmentId, tenantId },
    data: { status, cancelReason: cancelReason ?? null },
  });
  revalidatePath("/appointments");
  return { success: true, data: undefined };
}

export async function getTodayAppointmentCount(tenantId: string) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return prisma.appointment.count({
    where: { tenantId, scheduledAt: { gte: start, lte: end } },
  });
}
