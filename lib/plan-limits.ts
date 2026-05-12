import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import type { PlanKey } from "@/lib/plans";

type LimitKey = "users" | "doctors" | "employees" | "warehouses";

export async function checkPlanLimit(
  tenantId: string,
  limitKey: LimitKey
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const tenant = await prisma.tenant.findUnique({
    where:  { id: tenantId },
    select: { plan: true },
  });

  const planKey = (tenant?.plan ?? "BASIC") as PlanKey;
  const plan = PLANS[planKey];
  if (!plan) return { allowed: true };

  const limit = plan.limits[limitKey];
  if (!isFinite(limit)) return { allowed: true };

  let current = 0;

  switch (limitKey) {
    case "users":
      current = await prisma.user.count({ where: { tenantId } });
      break;
    case "doctors":
      current = await prisma.user.count({ where: { tenantId, role: "MEDICO" } });
      break;
    case "employees":
      current = await prisma.employee.count({ where: { tenantId } });
      break;
    case "warehouses":
      current = await prisma.warehouse.count({ where: { tenantId, isActive: true } });
      break;
  }

  if (current >= limit) {
    const label: Record<LimitKey, string> = {
      users:      `usuarios (máx. ${limit})`,
      doctors:    `médicos (máx. ${limit})`,
      employees:  `empleados/pacientes (máx. ${limit})`,
      warehouses: `almacenes (máx. ${limit})`,
    };
    return {
      allowed: false,
      error: `Tu plan ${plan.name} permite máximo ${label[limitKey]}. Actualiza tu plan para continuar.`,
    };
  }

  return { allowed: true };
}
