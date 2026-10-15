"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { medicalRecordSchema, prescriptionItemInputSchema } from "@/lib/validations/medical-records";

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
      employee: { select: { firstName: true, lastName: true, employeeNumber: true, department: true } },
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
      incapacidad: true,
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
    incapacidad,
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

    if (incapacidad) {
      const year = new Date().getFullYear();
      const count = await tx.incapacidad.count({
        where: { tenantId, folio: { startsWith: `INC-${year}-` } },
      });
      const folio = `INC-${year}-${String(count + 1).padStart(4, "0")}`;
      const fechaInicio = new Date(incapacidad.fechaInicio + "T00:00:00");
      const fechaFin    = new Date(incapacidad.fechaFin    + "T00:00:00");
      const dias = Math.max(1, Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / 86400000) + 1);

      await tx.incapacidad.create({
        data: {
          folio, tenantId,
          medicalRecordId: record.id,
          doctorId,
          employeeId:      recordData.employeeId  || null,
          dependentId:     recordData.dependentId || null,
          tipo:            incapacidad.tipo,
          fechaInicio, fechaFin, dias,
          diagnostico:     incapacidad.diagnostico,
          motivo:          incapacidad.motivo,
          restricciones:   incapacidad.restricciones   || null,
          recomendaciones: incapacidad.recomendaciones || null,
          fechaRetorno:    incapacidad.fechaRetorno ? new Date(incapacidad.fechaRetorno + "T00:00:00") : null,
          esIHSS:          incapacidad.esIHSS,
          numeroIHSS:      incapacidad.numeroIHSS || null,
        },
      });
    }

    return { id: record.id, prescriptionId };
  });

  // Create PermanentMedication records for marked items (employees only)
  if (recordData.employeeId) {
    for (const item of prescriptionItems) {
      if (!item.isPermanent) continue;
      const exists = await prisma.permanentMedication.findFirst({
        where: { tenantId, employeeId: recordData.employeeId, productId: item.productId, isActive: true },
      });
      if (!exists) {
        await prisma.permanentMedication.create({
          data: {
            tenantId,
            employeeId: recordData.employeeId,
            productId:  item.productId,
            dose:       item.dose,
            frequency:  item.frequency,
            notes:      "Asignado desde consulta médica",
          },
        });
      }
    }
  }

  revalidatePath("/medical-records");
  revalidatePath("/appointments");
  revalidatePath("/prescriptions");
  revalidatePath("/permanent-meds");
  revalidatePath("/incapacidades");
  return { success: true, data: result };
}

export async function updateMedicalRecord(
  tenantId: string,
  recordId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const updateSchema = z.object({
    subjective:             z.string().optional(),
    objective:              z.string().optional(),
    assessment:             z.string().optional(),
    plan:                   z.string().optional(),
    notes:                  z.string().optional(),
    referral:               z.string().optional(),
    vitalSigns: z.object({
      weight:          z.number().positive().optional(),
      height:          z.number().positive().optional(),
      systolicBp:      z.number().positive().optional(),
      diastolicBp:     z.number().positive().optional(),
      heartRate:       z.number().positive().optional(),
      temperature:     z.number().positive().optional(),
      glucose:         z.number().positive().optional(),
      spo2:            z.number().min(1).max(100).optional(),
      respiratoryRate: z.number().positive().optional(),
    }).optional(),
    diagnoses:              z.array(z.object({
      cie10Code:   z.string().min(1),
      description: z.string().min(1),
      isPrimary:   z.boolean().default(false),
    })).default([]),
    prescriptionItems:      z.array(prescriptionItemInputSchema).default([]),
    prescriptionExpireDays: z.number().min(1).max(365).default(30),
  });

  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { vitalSigns, diagnoses, prescriptionItems, prescriptionExpireDays, ...soap } = parsed.data;

  const existingRecord = await prisma.medicalRecord.findFirst({
    where: { id: recordId, tenantId },
    select: { id: true, doctorId: true, employeeId: true, dependentId: true },
  });
  if (!existingRecord) return { success: false, error: "Consulta no encontrada" };

  await prisma.$transaction(async (tx) => {
    const record = existingRecord;

    await tx.medicalRecord.update({
      where: { id: recordId },
      data: {
        subjective: soap.subjective ?? null,
        objective:  soap.objective  ?? null,
        assessment: soap.assessment ?? null,
        plan:       soap.plan       ?? null,
        notes:      soap.notes      ?? null,
        referral:   soap.referral   ?? null,
      },
    });

    if (vitalSigns) {
      const bmi =
        vitalSigns.weight && vitalSigns.height
          ? parseFloat((vitalSigns.weight / (vitalSigns.height / 100) ** 2).toFixed(1))
          : undefined;
      await tx.vitalSigns.upsert({
        where:  { medicalRecordId: recordId },
        update: { ...vitalSigns, ...(bmi !== undefined && { bmi }) },
        create: { medicalRecordId: recordId, ...vitalSigns, bmi },
      });
    }

    await tx.diagnosis.deleteMany({ where: { medicalRecordId: recordId } });
    if (diagnoses.length > 0) {
      await tx.diagnosis.createMany({
        data: diagnoses.map(d => ({ ...d, medicalRecordId: recordId })),
      });
    }

    if (prescriptionItems.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + prescriptionExpireDays);
      await tx.prescription.create({
        data: {
          tenantId,
          medicalRecordId: recordId,
          doctorId:    record.doctorId,
          employeeId:  record.employeeId  || null,
          dependentId: record.dependentId || null,
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
    }
  });

  // Create PermanentMedication records for marked items (employees only)
  if (existingRecord.employeeId) {
    for (const item of prescriptionItems) {
      if (!item.isPermanent) continue;
      const exists = await prisma.permanentMedication.findFirst({
        where: { tenantId, employeeId: existingRecord.employeeId, productId: item.productId, isActive: true },
      });
      if (!exists) {
        await prisma.permanentMedication.create({
          data: {
            tenantId,
            employeeId: existingRecord.employeeId,
            productId:  item.productId,
            dose:       item.dose,
            frequency:  item.frequency,
            notes:      "Asignado desde consulta médica",
          },
        });
      }
    }
  }

  revalidatePath(`/medical-records/${recordId}`);
  revalidatePath("/medical-records");
  revalidatePath("/prescriptions");
  revalidatePath("/permanent-meds");
  return { success: true, data: { id: recordId } };
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
  const now = new Date();
  const products = await prisma.product.findMany({
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
    select: {
      id: true, genericName: true, commercialName: true, unit: true, form: true, concentration: true,
      batches: {
        where: { isActive: true, currentQty: { gt: 0 }, expiryDate: { gt: now } },
        select: { currentQty: true },
      },
    },
  });
  return products.map(p => ({
    id: p.id, genericName: p.genericName, commercialName: p.commercialName,
    unit: p.unit, form: p.form, concentration: p.concentration,
    totalStock: p.batches.reduce((s, b) => s + b.currentQty, 0),
  }));
}
