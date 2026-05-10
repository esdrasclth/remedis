"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { medicalRecordSchema } from "@/lib/validations/medical-records";

export type { MedicalRecordInput, DiagnosisInput, PrescriptionItemInput } from "@/lib/validations/medical-records";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function getMedicalRecords(tenantId: string, employeeId?: string) {
  return prisma.medicalRecord.findMany({
    where: { tenantId, ...(employeeId ? { employeeId } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      doctor:   { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      diagnoses: true,
      prescriptions: { select: { id: true, status: true } },
    },
  });
}

export async function getMedicalRecord(tenantId: string, recordId: string) {
  return prisma.medicalRecord.findFirst({
    where: { id: recordId, tenantId },
    include: {
      doctor:   { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      vitalSigns: true,
      diagnoses: true,
      prescriptions: {
        include: {
          items: {
            include: { product: { select: { genericName: true, unit: true } } },
          },
        },
      },
    },
  });
}

export async function createMedicalRecord(
  tenantId: string,
  doctorId: string,
  data: unknown
): Promise<ActionResult<{ id: string; prescriptionId?: string }>> {
  const parsed = medicalRecordSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const {
    vitalSigns, diagnoses, prescriptionItems, prescriptionExpireDays,
    ...recordData
  } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.medicalRecord.create({
      data: {
        tenantId,
        doctorId,
        employeeId:    recordData.employeeId    || null,
        dependentId:   recordData.dependentId   || null,
        appointmentId: recordData.appointmentId || null,
        subjective:    recordData.subjective    || null,
        objective:     recordData.objective     || null,
        assessment:    recordData.assessment    || null,
        plan:          recordData.plan          || null,
        notes:         recordData.notes         || null,
        referral:      recordData.referral      || null,
      },
    });

    if (vitalSigns && Object.values(vitalSigns).some(v => v != null)) {
      const bmi =
        vitalSigns.weight && vitalSigns.height
          ? parseFloat((vitalSigns.weight / (vitalSigns.height / 100) ** 2).toFixed(1))
          : undefined;
      await tx.vitalSigns.create({
        data: { medicalRecordId: record.id, ...vitalSigns, bmi },
      });
    }

    if (diagnoses.length > 0) {
      await tx.diagnosis.createMany({
        data: diagnoses.map(d => ({ ...d, medicalRecordId: record.id })),
      });
    }

    let prescriptionId: string | undefined;
    if (prescriptionItems.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + prescriptionExpireDays);

      const rx = await tx.prescription.create({
        data: {
          tenantId,
          medicalRecordId: record.id,
          doctorId,
          employeeId:  recordData.employeeId  || null,
          dependentId: recordData.dependentId || null,
          expiresAt,
          items: {
            create: prescriptionItems.map(item => ({
              productId:    item.productId,
              dose:         item.dose,
              frequency:    item.frequency,
              duration:     item.duration,
              instructions: item.instructions || null,
              quantity:     item.quantity,
            })),
          },
        },
      });
      prescriptionId = rx.id;
    }

    if (recordData.appointmentId) {
      await tx.appointment.update({
        where: { id: recordData.appointmentId },
        data:  { status: "COMPLETADA" },
      });
    }

    return { id: record.id, prescriptionId };
  });

  revalidatePath("/medical-records");
  revalidatePath("/appointments");
  revalidatePath("/prescriptions");
  return { success: true, data: result };
}

export async function getPrescriptions(tenantId: string) {
  return prisma.prescription.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      doctor:   { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeNumber: true } },
      dependent:{ select: { firstName: true, lastName: true } },
      items: {
        include: { product: { select: { genericName: true, unit: true } } },
      },
    },
  });
}

export async function getPendingPrescriptionsCount(tenantId: string) {
  return prisma.prescription.count({
    where: { tenantId, status: "EMITIDA", expiresAt: { gt: new Date() } },
  });
}

export async function getMedicationProducts(tenantId: string, query: string) {
  return prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      category: "MEDICAMENTO",
      ...(query.length > 0 && {
        OR: [
          { genericName:    { contains: query, mode: "insensitive" } },
          { commercialName: { contains: query, mode: "insensitive" } },
        ],
      }),
    },
    take: 10,
    select: { id: true, genericName: true, commercialName: true, unit: true, form: true, concentration: true },
  });
}
