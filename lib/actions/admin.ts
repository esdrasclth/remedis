"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getSuperAdminStats() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [total, active, suspended, newThisMonth, totalUsers, totalEmployees] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.tenant.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { tenantId: { not: null } } }),
    prisma.employee.count(),
  ]);

  return { total, active, suspended, newThisMonth, totalUsers, totalEmployees };
}

// ─── Tenants list ─────────────────────────────────────────────────────────────

export async function getAllTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, employees: true, products: true },
      },
    },
  });
  return tenants;
}

// ─── Tenant detail ────────────────────────────────────────────────────────────

export async function getTenantDetail(tenantId: string) {
  const [tenant, counts] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        warehouses: {
          where: { isActive: true },
          select: { id: true, name: true, source: true },
        },
      },
    }),
    Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.appointment.count({ where: { tenantId } }),
      prisma.prescription.count({ where: { tenantId } }),
      prisma.dispensation.count({ where: { tenantId } }),
      prisma.medicalRecord.count({ where: { tenantId } }),
    ]),
  ]);

  if (!tenant) return null;

  const [employees, products, appointments, prescriptions, dispensations, medicalRecords] = counts;

  return {
    ...tenant,
    stats: { employees, products, appointments, prescriptions, dispensations, medicalRecords },
  };
}

// ─── Tenant mutations ─────────────────────────────────────────────────────────

export async function updateTenantPlan(tenantId: string, plan: string): Promise<ActionResult> {
  const validPlans = ["BASIC", "PROFESSIONAL", "ENTERPRISE"];
  if (!validPlans.includes(plan)) return { success: false, error: "Plan inválido" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.tenant.update({ where: { id: tenantId }, data: { plan: plan as any } });
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { success: true };
}

export async function updateTenantStatus(tenantId: string, status: string): Promise<ActionResult> {
  const validStatuses = ["ACTIVE", "SUSPENDED"];
  if (!validStatuses.includes(status)) return { success: false, error: "Estado inválido" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.tenant.update({ where: { id: tenantId }, data: { status: status as any } });
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { success: true };
}

export async function deleteTenant(tenantId: string): Promise<ActionResult> {
  await prisma.tenant.delete({ where: { id: tenantId } });
  revalidatePath("/admin/tenants");
  return { success: true };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAllUsers(search?: string) {
  return prisma.user.findMany({
    where: search
      ? {
          tenantId: { not: null },
          OR: [
            { name:  { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : { tenantId: { not: null } },
    select: {
      id: true, name: true, email: true, role: true,
      isActive: true, createdAt: true,
      tenant: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
