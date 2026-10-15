import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getPermanentMeds } from "@/lib/actions/permanent-meds";
import { PermanentMedsClient } from "@/components/permanent-meds/permanent-meds-client";
import type { SessionUser } from "@/types";

export default async function PermanentMedsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const user = session.user as unknown as SessionUser;
  const meds = await getPermanentMeds(tenantId);

  return (
    <PermanentMedsClient
      tenantId={tenantId}
      pharmacistId={user.id}
      initialMeds={meds}
    />
  );
}
