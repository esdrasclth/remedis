"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { incapacidadInputSchema } from "@/lib/validations/incapacidades";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function calcDias(inicio: Date, fin: Date) {
  return Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

async function nextFolio(tenantId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.incapacidad.count({
    where: { tenantId, folio: { startsWith: `INC-${year}-` } },
  });
  return `INC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function getIncapacidades(
  tenantId: string,
  filters?: { employeeId?: string; estado?: string; from?: string; to?: string }
) {
  return prisma.incapacidad.findMany({
    where: {
      tenantId,
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.estado ? { estado: filters.estado as never } : {}),
      ...(filters?.from ? { fechaInicio: { gte: new Date(filters.from) } } : {}),
      ...(filters?.to ? { fechaFin: { lte: new Date(filters.to) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      doctor:   { select: { name: true, specialty: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      medicalRecord: { select: { id: true } },
    },
  });
}

export async function getIncapacidad(tenantId: string, id: string) {
  return prisma.incapacidad.findFirst({
    where: { id, tenantId },
    include: {
      doctor:   { select: { name: true, specialty: true, licenseNumber: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: true, position: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      medicalRecord: { select: { id: true, createdAt: true } },
      tenant: { select: { name: true } },
    },
  });
}

export async function createIncapacidad(
  tenantId: string,
  doctorId: string,
  medicalRecordId: string,
  employeeId: string | null,
  dependentId: string | null,
  data: unknown
): Promise<ActionResult<{ id: string; folio: string }>> {
  const parsed = incapacidadInputSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const existing = await prisma.incapacidad.findUnique({ where: { medicalRecordId } });
  if (existing) return { success: false, error: "Esta consulta ya tiene una incapacidad emitida" };

  const folio = await nextFolio(tenantId);
  const fechaInicio = new Date(parsed.data.fechaInicio + "T00:00:00");
  const fechaFin    = new Date(parsed.data.fechaFin    + "T00:00:00");

  const record = await prisma.incapacidad.create({
    data: {
      folio, tenantId, medicalRecordId, doctorId,
      employeeId:  employeeId  ?? null,
      dependentId: dependentId ?? null,
      tipo:        parsed.data.tipo,
      fechaInicio, fechaFin,
      dias:           calcDias(fechaInicio, fechaFin),
      diagnostico:    parsed.data.diagnostico,
      motivo:         parsed.data.motivo,
      restricciones:  parsed.data.restricciones  || null,
      recomendaciones:parsed.data.recomendaciones || null,
      fechaRetorno:   parsed.data.fechaRetorno ? new Date(parsed.data.fechaRetorno + "T00:00:00") : null,
      esIHSS:         parsed.data.esIHSS,
      numeroIHSS:     parsed.data.numeroIHSS || null,
    },
  });

  revalidatePath("/incapacidades");
  revalidatePath(`/medical-records/${medicalRecordId}`);
  return { success: true, data: { id: record.id, folio } };
}

export async function updateIncapacidadEstado(
  tenantId: string,
  id: string,
  estado: "EMITIDA" | "ENTREGADA_PACIENTE" | "PRESENTADA_RRHH" | "CANCELADA"
): Promise<ActionResult<void>> {
  const existing = await prisma.incapacidad.findFirst({ where: { id, tenantId } });
  if (!existing) return { success: false, error: "Incapacidad no encontrada" };

  await prisma.incapacidad.update({ where: { id }, data: { estado } });

  revalidatePath("/incapacidades");
  revalidatePath(`/incapacidades/${id}`);
  return { success: true, data: undefined };
}
