import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantFromHeaders, getTenantBySlug, getTenantById } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getTenantPlanStatus } from "@/lib/actions/plan";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TrialBanner } from "@/components/plan/trial-banner";
import { PlanGate } from "@/components/plan/plan-gate";
import type { SessionUser } from "@/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantSlug, tenantId } = await getTenantFromHeaders();
  const [tenant, dbUser] = await Promise.all([
    tenantSlug
      ? getTenantBySlug(tenantSlug)
      : tenantId
        ? getTenantById(tenantId)
        : Promise.resolve(null),
    session.user.id
      ? prisma.user.findUnique({ where: { id: session.user.id }, select: { avatar: true, onboardingDone: true } })
      : Promise.resolve(null),
  ]);
  const user = session.user as unknown as SessionUser;

  // Redirect to onboarding on first login (skip for SUPER_ADMIN)
  if (dbUser && !dbUser.onboardingDone && user.role !== "SUPER_ADMIN") {
    redirect("/onboarding");
  }

  const planStatus = tenant?.id
    ? await getTenantPlanStatus(tenant.id)
    : null;

  const isBlocked = planStatus
    ? ["trial_expired", "plan_expired", "suspended"].includes(planStatus.type)
    : false;

  const showBanner = planStatus
    ? ["trial_active", "plan_expiring"].includes(planStatus.type)
    : false;

  return (
    <div className="flex h-screen overflow-hidden bg-deep-space-black">
      <Sidebar tenantName={tenant?.name ?? "Remedis"} tenantLogo={tenant?.logo} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={user} tenantId={tenant?.id ?? ""} avatar={dbUser?.avatar ?? null} />

        {showBanner && planStatus && (planStatus.type === "trial_active" || planStatus.type === "plan_expiring") && (
          <TrialBanner
            type={planStatus.type}
            daysLeft={planStatus.daysLeft}
            tenantId={tenant!.id}
            tenantName={tenant!.name}
            userName={user.name ?? ""}
            userEmail={user.email ?? ""}
          />
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {isBlocked && planStatus && (
          <PlanGate
            status={planStatus}
            tenantId={tenant?.id ?? ""}
            tenantName={tenant?.name ?? ""}
            userName={user.name ?? ""}
            userEmail={user.email ?? ""}
          />
        )}
      </div>
    </div>
  );
}
