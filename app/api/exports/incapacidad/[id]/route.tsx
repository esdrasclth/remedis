import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { IncapacidadPDF } from "@/components/pdf/incapacidad-pdf";

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

  const [incapacidad, tenant] = await Promise.all([
    prisma.incapacidad.findFirst({
      where: { id, tenantId },
      include: {
        doctor:   { select: { name: true, specialty: true, licenseNumber: true } },
        employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: true, position: true } },
        dependent:{ select: { firstName: true, lastName: true } },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  if (!incapacidad) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(
    <IncapacidadPDF
      tenantName={tenant?.name ?? "Clínica"}
      incapacidad={incapacidad}
    />
  );

  const filename = `incapacidad-${incapacidad.folio}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
