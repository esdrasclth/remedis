"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail, planRequestEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";
import type { PlanKey } from "@/lib/plans";

const SUPPORT_EMAIL = "esdrasclth@brandsofts.com";

// ─── Status ───────────────────────────────────────────────────────────────────

export type PlanStatus =
  | { type: "trial_active";   daysLeft: number }
  | { type: "trial_expired" }
  | { type: "plan_active";    daysLeft: number | null; plan: string }
  | { type: "plan_expiring";  daysLeft: number;        plan: string }
  | { type: "plan_expired";   plan: string }
  | { type: "suspended" };

export async function getTenantPlanStatus(tenantId: string): Promise<PlanStatus> {
  const tenant = await prisma.tenant.findUnique({
    where:  { id: tenantId },
    select: { plan: true, status: true, trialEndsAt: true, planExpiresAt: true },
  });

  if (!tenant) return { type: "trial_expired" };
  if (tenant.status === "SUSPENDED") return { type: "suspended" };

  const now = new Date();

  if (tenant.plan === "TRIAL") {
    if (!tenant.trialEndsAt || tenant.trialEndsAt <= now) return { type: "trial_expired" };
    const daysLeft = Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / 86400000);
    return { type: "trial_active", daysLeft };
  }

  if (!tenant.planExpiresAt) return { type: "plan_active", daysLeft: null, plan: tenant.plan };

  const daysLeft = Math.ceil((tenant.planExpiresAt.getTime() - now.getTime()) / 86400000);
  if (daysLeft <= 0)  return { type: "plan_expired",  plan: tenant.plan };
  if (daysLeft <= 7)  return { type: "plan_expiring", daysLeft, plan: tenant.plan };
  return { type: "plan_active", daysLeft, plan: tenant.plan };
}

// ─── Plan request ─────────────────────────────────────────────────────────────

interface PlanRequestData {
  planKey:      PlanKey;
  billing:      "monthly" | "annual";
  contactName:  string;
  contactEmail: string;
  message?:     string;
}

type ActionResult = { success: true } | { success: false; error: string };

export async function submitPlanRequest(
  tenantId: string,
  data: PlanRequestData
): Promise<ActionResult> {
  const tenant = await prisma.tenant.findUnique({
    where:  { id: tenantId },
    select: { name: true, slug: true },
  });
  if (!tenant) return { success: false, error: "Tenant no encontrado" };

  const plan = PLANS[data.planKey];
  if (!plan) return { success: false, error: "Plan inválido" };

  await prisma.planRequest.create({
    data: {
      tenantId,
      planKey:      data.planKey,
      billing:      data.billing,
      contactName:  data.contactName,
      contactEmail: data.contactEmail,
      message:      data.message ?? null,
    },
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data:  { planNotes: `Solicitud de plan ${plan.name} (${data.billing}) recibida ${new Date().toLocaleDateString("es-HN")}` },
  });

  await sendEmail({
    to:      SUPPORT_EMAIL,
    subject: `[Remedis] Solicitud de plan ${plan.name} — ${tenant.name}`,
    html:    planRequestEmail({
      contactName:  data.contactName,
      contactEmail: data.contactEmail,
      companyName:  tenant.name,
      companySlug:  tenant.slug,
      planName:     plan.name,
      billing:      data.billing,
      message:      data.message,
    }),
  });

  return { success: true };
}
