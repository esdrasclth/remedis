import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantFromHeaders } from "@/lib/tenant";
import { generateMedicalRecordsExcel } from "@/lib/excel/generators";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return new Response("Not found", { status: 404 });

  const [records, tenant] = await Promise.all([
    prisma.medicalRecord.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        doctor:    { select: { name: true } },
        employee:  { select: { firstName: true, lastName: true, employeeNumber: true } },
        dependent: { select: { firstName: true, lastName: true } },
        vitalSigns: true,
        diagnoses:  true,
        prescriptions: { select: { status: true } },
      },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  ]);

  const buffer = generateMedicalRecordsExcel(tenant?.name ?? "Clínica", records);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="consultas.xlsx"`,
    },
  });
}
