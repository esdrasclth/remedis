"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { employeeSchema, dependentSchema } from "@/lib/validations/patients";
import { checkPlanLimit } from "@/lib/plan-limits";

export type { EmployeeInput } from "@/lib/validations/patients";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function getEmployees(tenantId: string) {
  return prisma.employee.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      _count: { select: { appointments: true, medicalRecords: true } },
    },
  });
}

export async function getEmployee(tenantId: string, employeeId: string) {
  return prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    include: {
      medicalHistory: true,
      dependents: { where: { isActive: true } },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
        include: { doctor: { select: { name: true } } },
      },
      medicalRecords: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          doctor: { select: { name: true } },
          diagnoses: true,
        },
      },
    },
  });
}

export async function searchEmployees(tenantId: string, query: string) {
  if (!query || query.length < 1) return [];
  return prisma.employee.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { firstName:      { contains: query, mode: "insensitive" } },
        { lastName:       { contains: query, mode: "insensitive" } },
        { employeeNumber: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: {
      id: true, firstName: true, lastName: true,
      employeeNumber: true, department: true,
    },
  });
}

export async function createEmployee(
  tenantId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = employeeSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const limit = await checkPlanLimit(tenantId, "employees");
  if (!limit.allowed) return { success: false, error: limit.error };

  const existing = await prisma.employee.findUnique({
    where: { tenantId_employeeNumber: { tenantId, employeeNumber: parsed.data.employeeNumber } },
  });
  if (existing) return { success: false, error: "El número de empleado ya está en uso." };

  const { bloodType, allergies, chronicConditions, ...employeeData } = parsed.data;

  const employee = await prisma.employee.create({
    data: {
      tenantId,
      ...employeeData,
      birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
      email:     employeeData.email || null,
      gender:    employeeData.gender ?? null,
    },
  });

  if (bloodType || (allergies?.length ?? 0) > 0 || (chronicConditions?.length ?? 0) > 0) {
    await prisma.medicalHistory.create({
      data: {
        employeeId:        employee.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bloodType:         (bloodType as any) ?? null,
        allergies:         allergies ?? [],
        chronicConditions: chronicConditions ?? [],
      },
    });
  }

  revalidatePath("/patients");
  return { success: true, data: { id: employee.id } };
}

export async function updateEmployee(
  tenantId: string,
  employeeId: string,
  data: unknown
): Promise<ActionResult<void>> {
  const parsed = employeeSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { bloodType, allergies, chronicConditions, ...employeeData } = parsed.data;

  await prisma.employee.updateMany({
    where: { id: employeeId, tenantId },
    data: {
      ...employeeData,
      birthDate: employeeData.birthDate ? new Date(employeeData.birthDate) : null,
      email:     employeeData.email || null,
      gender:    employeeData.gender ?? null,
    },
  });

  await prisma.medicalHistory.upsert({
    where:  { employeeId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { employeeId, bloodType: (bloodType as any) ?? null, allergies: allergies ?? [], chronicConditions: chronicConditions ?? [] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { bloodType: (bloodType as any) ?? null, allergies: allergies ?? [], chronicConditions: chronicConditions ?? [] },
  });

  revalidatePath("/patients");
  revalidatePath(`/patients/${employeeId}`);
  return { success: true, data: undefined };
}

// ─── Dependents ───────────────────────────────────────────────────────────────

export async function createDependent(
  tenantId: string,
  employeeId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!emp) return { success: false, error: "Paciente no encontrado." };

  const parsed = dependentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const dependent = await prisma.dependent.create({
    data: {
      employeeId,
      ...parsed.data,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      gender:    parsed.data.gender ?? null,
    },
  });

  revalidatePath(`/patients/${employeeId}`);
  return { success: true, data: { id: dependent.id } };
}

export async function deactivateDependent(
  tenantId: string,
  employeeId: string,
  dependentId: string
): Promise<ActionResult<void>> {
  const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
  if (!emp) return { success: false, error: "Paciente no encontrado." };

  await prisma.dependent.update({ where: { id: dependentId }, data: { isActive: false } });
  revalidatePath(`/patients/${employeeId}`);
  return { success: true, data: undefined };
}
