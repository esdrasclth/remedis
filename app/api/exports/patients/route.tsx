import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { PatientsPDF } from "@/components/pdf/patients-pdf";
import { generatePatientsExcel } from "@/lib/excel/generators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return new Response("Not found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") ?? "pdf";

  const [employees, tenant] = await Promise.all([
    prisma.employee.findMany({
      where:   { tenantId, isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: { _count: { select: { appointments: true, medicalRecords: true } } },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  const tenantName = tenant?.name ?? "Clínica";

  if (format === "xlsx") {
    const buffer = generatePatientsExcel(tenantName, employees);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="pacientes.xlsx"`,
      },
    });
  }

  const buffer = await renderToBuffer(
    <PatientsPDF tenantName={tenantName} employees={employees} />
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pacientes.pdf"`,
    },
  });
}
