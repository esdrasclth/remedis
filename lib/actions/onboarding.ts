"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data:  { onboardingDone: true },
  });
  revalidatePath("/dashboard");
}

export async function getOnboardingStatus(tenantId: string) {
  const [doctorCount, employeeCount, warehouseCount, clinicData] = await Promise.all([
    prisma.user.count({ where: { tenantId, role: "MEDICO", isActive: true } }),
    prisma.employee.count({ where: { tenantId } }),
    prisma.warehouse.count({ where: { tenantId, isActive: true } }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, clinicType: true, clinics: { select: { phone: true, address: true }, take: 1 } },
    }),
  ]);

  const clinic = clinicData?.clinics[0];
  const clinicConfigured = !!(clinic?.phone || clinic?.address);

  return {
    clinicType:        clinicData?.clinicType ?? "EMPRESA",
    clinicName:        clinicData?.name ?? "",
    steps: {
      clinicConfigured,
      doctorAdded:     doctorCount > 0,
      patientAdded:    employeeCount > 0,
      warehouseReady:  warehouseCount > 0,
    },
  };
}
