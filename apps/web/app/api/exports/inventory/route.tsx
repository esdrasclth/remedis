import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { InventoryPDF } from "@/components/pdf/inventory-pdf";
import { generateInventoryExcel } from "@/lib/excel/generators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return new Response("Not found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") ?? "pdf";

  const [products, tenant] = await Promise.all([
    prisma.product.findMany({
      where:   { tenantId, isActive: true },
      orderBy: { genericName: "asc" },
      include: {
        batches: {
          where:   { isActive: true },
          include: { warehouse: { select: { name: true } } },
          orderBy: { expiryDate: "asc" },
        },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  const tenantName = tenant?.name ?? "Clínica";

  if (format === "xlsx") {
    const buffer = generateInventoryExcel(tenantName, products);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="inventario.xlsx"`,
      },
    });
  }

  const buffer = await renderToBuffer(
    <InventoryPDF tenantName={tenantName} products={products} />
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inventario.pdf"`,
    },
  });
}
