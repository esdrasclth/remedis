import { z } from "zod";

export const diagnosisInputSchema = z.object({
  cie10Code:   z.string().min(1),
  description: z.string().min(1),
  isPrimary:   z.boolean().default(false),
});

export const prescriptionItemInputSchema = z.object({
  productId:    z.string().min(1),
  productName:  z.string().optional(),
  dose:         z.string().min(1, "Dosis requerida"),
  frequency:    z.string().min(1, "Frecuencia requerida"),
  duration:     z.string().min(1, "Duración requerida"),
  instructions: z.string().optional(),
  quantity:     z.number().int().min(1).default(1),
});

export const medicalRecordSchema = z.object({
  appointmentId:          z.string().optional(),
  employeeId:             z.string().optional(),
  dependentId:            z.string().optional(),
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
  diagnoses:              z.array(diagnosisInputSchema).default([]),
  prescriptionItems:      z.array(prescriptionItemInputSchema).default([]),
  prescriptionExpireDays: z.number().min(1).max(365).default(30),
});

export type MedicalRecordInput    = z.infer<typeof medicalRecordSchema>;
export type DiagnosisInput        = z.infer<typeof diagnosisInputSchema>;
export type PrescriptionItemInput = z.infer<typeof prescriptionItemInputSchema>;
