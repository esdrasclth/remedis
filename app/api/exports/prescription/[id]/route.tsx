import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { PrescriptionPDF } from "@/components/pdf/prescription-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return new Response("Not found", { status: 404 });

  const { id } = await params;

  const [prescription, tenant] = await Promise.all([
    prisma.prescription.findFirst({
      where: { id, tenantId },
      include: {
        doctor:   { select: { name: true } },
        employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
        dependent:{ select: { firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: { genericName: true, commercialName: true, form: true, concentration: true, unit: true },
            },
          },
        },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  if (!prescription) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(
    <PrescriptionPDF
      tenantName={tenant?.name ?? "Clínica"}
      prescription={prescription}
    />
  );

  const filename = `receta-${id.slice(-8).toUpperCase()}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
