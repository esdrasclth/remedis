import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { MedicalRecordPDF } from "@/components/pdf/medical-record-pdf";

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

  const [record, tenant] = await Promise.all([
    prisma.medicalRecord.findFirst({
      where: { id, tenantId },
      include: {
        doctor:    { select: { name: true } },
        employee:  { select: { firstName: true, lastName: true, employeeNumber: true, department: true, position: true } },
        dependent: { select: { firstName: true, lastName: true } },
        vitalSigns: true,
        diagnoses:  true,
        prescriptions: {
          include: {
            items: {
              include: {
                product: { select: { genericName: true, commercialName: true, unit: true } },
              },
            },
          },
        },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  if (!record) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(
    <MedicalRecordPDF tenantName={tenant?.name ?? "Clínica"} record={record} />
  );

  const patient = record.employee
    ? `${record.employee.lastName}-${record.employee.firstName}`
    : "consulta";
  const filename = `consulta-${patient}-${id.slice(-8).toUpperCase()}.pdf`.replace(/\s/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
