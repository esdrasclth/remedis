import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import type { SessionUser } from "@/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser;

  if (!user || user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-deep-space-black overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
