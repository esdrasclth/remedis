import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantFromHeaders, getTenantBySlug, getTenantById } from "@/lib/tenant";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { SessionUser } from "@/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { tenantSlug, tenantId } = await getTenantFromHeaders();
  const tenant = tenantSlug
    ? await getTenantBySlug(tenantSlug)
    : tenantId
      ? await getTenantById(tenantId)
      : null;
  const user = session.user as unknown as SessionUser;

  return (
    <div className="flex h-screen overflow-hidden bg-deep-space-black">
      <Sidebar tenantName={tenant?.name ?? "Remedis"} tenantLogo={tenant?.logo} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
