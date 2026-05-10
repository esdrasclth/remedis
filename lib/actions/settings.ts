"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  tenantInfoSchema,
  prescriptionSettingsSchema,
  inviteUserSchema,
  warehouseSchema,
} from "@/lib/validations/settings";

type ActionResult = { success: true } | { success: false; error: string };

// ─── Tenant info ──────────────────────────────────────────────────────────────

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, plan: true, logo: true, config: true },
  });
}

export async function updateTenantInfo(tenantId: string, raw: unknown): Promise<ActionResult> {
  const parsed = tenantInfoSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name: parsed.data.name, logo: parsed.data.logo || null },
  });
  revalidatePath("/settings");
  return { success: true };
}

// ─── Prescription settings ────────────────────────────────────────────────────

export async function updatePrescriptionSettings(tenantId: string, raw: unknown): Promise<ActionResult> {
  const parsed = prescriptionSettingsSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { config: true } });
  const currentConfig = (tenant?.config ?? {}) as Record<string, unknown>;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      config: {
        ...currentConfig,
        prescriptionValidDays: parsed.data.prescriptionValidDays,
        legalText: parsed.data.legalText ?? "",
      },
    },
  });
  revalidatePath("/settings");
  return { success: true };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function inviteUser(tenantId: string, raw: unknown): Promise<ActionResult> {
  const parsed = inviteUserSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { success: false, error: "Ya existe un usuario con ese email" };

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      tenantId,
      name:   parsed.data.name,
      email:  parsed.data.email,
      role:   parsed.data.role,
      hashedPassword,
    },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateUserRole(tenantId: string, userId: string, role: string): Promise<ActionResult> {
  const validRoles = [
    "ADMIN_CLINICA", "MEDICO", "ENFERMERA", "FARMACEUTICO",
    "RRHH", "AUDITOR", "RECEPCIONISTA",
  ];
  if (!validRoles.includes(role)) return { success: false, error: "Rol inválido" };

  await prisma.user.updateMany({
    where: { id: userId, tenantId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:  { role: role as any },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleUserActive(tenantId: string, userId: string): Promise<ActionResult> {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) return { success: false, error: "Usuario no encontrado" };

  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  revalidatePath("/settings");
  return { success: true };
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export async function createWarehouse(tenantId: string, raw: unknown): Promise<ActionResult> {
  const parsed = warehouseSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await prisma.warehouse.create({ data: { tenantId, ...parsed.data } });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateWarehouse(tenantId: string, warehouseId: string, raw: unknown): Promise<ActionResult> {
  const parsed = warehouseSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await prisma.warehouse.updateMany({ where: { id: warehouseId, tenantId }, data: parsed.data });
  revalidatePath("/settings");
  return { success: true };
}

export async function deactivateWarehouse(tenantId: string, warehouseId: string): Promise<ActionResult> {
  await prisma.warehouse.updateMany({ where: { id: warehouseId, tenantId }, data: { isActive: false } });
  revalidatePath("/settings");
  return { success: true };
}
