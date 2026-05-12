"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail, planWelcomeEmail, accountSuspendedEmail } from "@/lib/email";

const SUPPORT_EMAIL = "esdrasclth@brandsofts.com";

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
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { users: true, employees: true, products: true },
      },
      planRequests: {
        where:   { status: { in: ["PENDING", "CONTACTED"] } },
        select:  { id: true, planKey: true, billing: true, contactName: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take:    3,
      },
    },
  });
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

export async function updateTenantPlan(
  tenantId: string,
  plan: string,
  planExpiresAt?: string | null,
  planNotes?: string | null
): Promise<ActionResult> {
  const validPlans = ["TRIAL", "BASIC", "PROFESSIONAL", "ENTERPRISE"];
  if (!validPlans.includes(plan)) return { success: false, error: "Plan inválido" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { plan };
  if (planExpiresAt) data.planExpiresAt = new Date(planExpiresAt);
  else if (planExpiresAt === null) data.planExpiresAt = null;
  if (planNotes !== undefined) data.planNotes = planNotes || null;

  if (plan === "TRIAL") {
    const current = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { trialEndsAt: true } });
    if (!current?.trialEndsAt) {
      data.trialEndsAt = new Date(Date.now() + 14 * 86400000);
    }
    data.planExpiresAt = null;
  }

  const previousTenant = await prisma.tenant.findUnique({
    where:  { id: tenantId },
    select: { plan: true, name: true, slug: true, users: { select: { email: true }, where: { isActive: true } } },
  });

  await prisma.tenant.update({ where: { id: tenantId }, data });

  // Send welcome email when upgrading to a paid plan
  const upgradingToPaid = ["BASIC", "PROFESSIONAL", "ENTERPRISE"].includes(plan) && previousTenant?.plan === "TRIAL";
  const changingPlan    = ["BASIC", "PROFESSIONAL", "ENTERPRISE"].includes(plan) && previousTenant?.plan !== plan && previousTenant?.plan !== "TRIAL";

  if ((upgradingToPaid || changingPlan) && previousTenant) {
    const recipients = previousTenant.users.map(u => u.email);
    if (recipients.length > 0) {
      const expiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
      sendEmail({
        to:      recipients,
        subject: `¡Tu plan ${plan === "BASIC" ? "Básico" : plan === "PROFESSIONAL" ? "Profesional" : "Enterprise"} está activo — ${previousTenant.name}!`,
        html:    planWelcomeEmail({ companyName: previousTenant.name, slug: previousTenant.slug, plan, expiresAt }),
      }).catch(err => console.error("[updateTenantPlan] Email failed:", err));
    }
  }

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { success: true };
}

// ─── Plan requests ────────────────────────────────────────────────────────────

export async function getPlanRequests(tenantId?: string) {
  return prisma.planRequest.findMany({
    where:   tenantId ? { tenantId } : undefined,
    include: { tenant: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take:    100,
  });
}

export async function updatePlanRequestStatus(
  requestId: string,
  status: string
): Promise<ActionResult> {
  const valid = ["PENDING", "CONTACTED", "CONVERTED", "DISMISSED"];
  if (!valid.includes(status)) return { success: false, error: "Estado inválido" };

  await prisma.planRequest.update({ where: { id: requestId }, data: { status } });
  revalidatePath("/admin/tenants");
  return { success: true };
}

export async function updateTenantStatus(tenantId: string, status: string): Promise<ActionResult> {
  const validStatuses = ["ACTIVE", "SUSPENDED"];
  if (!validStatuses.includes(status)) return { success: false, error: "Estado inválido" };

  const tenant = await prisma.tenant.findUnique({
    where:  { id: tenantId },
    select: { name: true, users: { select: { email: true }, where: { isActive: true } } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.tenant.update({ where: { id: tenantId }, data: { status: status as any } });

  if (status === "SUSPENDED" && tenant) {
    const recipients = tenant.users.map(u => u.email);
    if (recipients.length > 0) {
      sendEmail({
        to:      recipients,
        subject: `Acceso suspendido — ${tenant.name}`,
        html:    accountSuspendedEmail({ companyName: tenant.name, contactEmail: SUPPORT_EMAIL }),
      }).catch(err => console.error("[updateTenantStatus] Email failed:", err));
    }
  }

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { success: true };
}

export async function deleteTenant(tenantId: string): Promise<ActionResult> {
  try {
    await prisma.$transaction(async tx => {
      // 1. Leaf records (no children)
      await tx.permanentMedDelivery.deleteMany({ where: { permanentMed: { tenantId } } });
      await tx.dispensationItem.deleteMany({ where: { dispensation: { tenantId } } });
      await tx.diagnosis.deleteMany({ where: { medicalRecord: { tenantId } } });
      await tx.vitalSigns.deleteMany({ where: { medicalRecord: { tenantId } } });
      await tx.prescriptionItem.deleteMany({ where: { prescription: { tenantId } } });
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { tenantId } } });
      await tx.purchaseReceipt.deleteMany({ where: { purchaseOrder: { tenantId } } });

      // 2. Mid-level records
      await tx.incapacidad.deleteMany({ where: { tenantId } });
      await tx.dispensation.deleteMany({ where: { tenantId } });
      await tx.prescription.deleteMany({ where: { tenantId } });
      await tx.medicalRecord.deleteMany({ where: { tenantId } });
      await tx.appointment.deleteMany({ where: { tenantId } });
      await tx.permanentMedication.deleteMany({ where: { tenantId } });
      await tx.purchaseOrder.deleteMany({ where: { tenantId } });
      await tx.inventoryMovement.deleteMany({ where: { tenantId } });

      // 3. ProductBatch (blocks Product + Warehouse deletion without cascade)
      await tx.productBatch.deleteMany({ where: { warehouse: { tenantId } } });

      // 4. Patient records
      await tx.medicalHistory.deleteMany({ where: { employee: { tenantId } } });
      await tx.dependent.deleteMany({ where: { employee: { tenantId } } });
      await tx.employee.deleteMany({ where: { tenantId } });

      // 5. Inventory + suppliers
      await tx.product.deleteMany({ where: { tenantId } });
      await tx.warehouse.deleteMany({ where: { tenantId } });
      await tx.supplier.deleteMany({ where: { tenantId } });

      // 6. Remaining tenant data
      await tx.alert.deleteMany({ where: { tenantId } });
      await tx.planRequest.deleteMany({ where: { tenantId } });
      await tx.clinic.deleteMany({ where: { tenantId } });

      // 7. Delete users (accounts + sessions cascade automatically via User onDelete: Cascade)
      await tx.user.deleteMany({ where: { tenantId } });

      // 8. Delete tenant
      await tx.tenant.delete({ where: { id: tenantId } });
    }, { timeout: 30000 });

    revalidatePath("/admin/tenants");
    return { success: true };
  } catch (e) {
    console.error("deleteTenant error:", e);
    return { success: false, error: "Error al eliminar el tenant. Revisa los logs del servidor." };
  }
}

export async function updateTenantClinicType(
  tenantId: string,
  clinicType: "EMPRESA" | "PRIVADA"
): Promise<ActionResult> {
  await prisma.tenant.update({ where: { id: tenantId }, data: { clinicType } });
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
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
