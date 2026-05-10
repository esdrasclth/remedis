"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations/patients";

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

  const existing = await prisma.employee.findUnique({
    where: { tenantId_employeeNumber: { tenantId, employeeNumber: parsed.data.employeeNumber } },
  });
  if (existing) return { success: false, error: "El número de empleado ya está en uso." };

  const employee = await prisma.employee.create({
    data: {
      tenantId,
      ...parsed.data,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      email: parsed.data.email || null,
      gender: parsed.data.gender ?? null,
    },
  });

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

  await prisma.employee.updateMany({
    where: { id: employeeId, tenantId },
    data: {
      ...parsed.data,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      email: parsed.data.email || null,
      gender: parsed.data.gender ?? null,
    },
  });

  revalidatePath("/patients");
  revalidatePath(`/patients/${employeeId}`);
  return { success: true, data: undefined };
}
