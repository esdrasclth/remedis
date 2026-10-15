import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantFromHeaders } from "@/lib/tenant";
import { PharmacyClient } from "@/components/pharmacy/pharmacy-client";
import type { SessionUser } from "@/types";

export default async function PharmacyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const user = session.user as unknown as SessionUser;

  return <PharmacyClient tenantId={tenantId} pharmacistId={user.id} />;
}
