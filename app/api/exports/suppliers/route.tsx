import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { SuppliersPDF } from "@/components/pdf/suppliers-pdf";
import { generateSuppliersExcel } from "@/lib/excel/generators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return new Response("Not found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") ?? "pdf";

  const [suppliers, tenant] = await Promise.all([
    prisma.supplier.findMany({
      where:   { tenantId, isActive: true },
      orderBy: { name: "asc" },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: { product: { select: { genericName: true } } },
            },
          },
        },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  const tenantName = tenant?.name ?? "Clínica";

  if (format === "xlsx") {
    const buffer = generateSuppliersExcel(tenantName, suppliers);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="proveedores.xlsx"`,
      },
    });
  }

  const buffer = await renderToBuffer(
    <SuppliersPDF tenantName={tenantName} suppliers={suppliers} />
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="proveedores.pdf"`,
    },
  });
}
