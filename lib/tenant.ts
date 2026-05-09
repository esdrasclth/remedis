import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getTenantFromHeaders = cache(async () => {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const tenantSlug = headersList.get("x-tenant-slug");
  return { tenantId, tenantSlug };
});

export const getTenantBySlug = cache(async (slug: string) => {
  return prisma.tenant.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      logo: true,
      primaryColor: true,
      config: true,
    },
  });
});

export { getTenantSlugFromHost } from "@/lib/tenant-edge";
