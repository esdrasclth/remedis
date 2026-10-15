"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPermanentMeds(tenantId: string) {
  return prisma.permanentMedication.findMany({
    where: { tenantId, isActive: true },
    orderBy: { startDate: "desc" },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true } },
      product:  { select: { id: true, genericName: true, commercialName: true, unit: true, unitCost: true } },
      deliveries: {
        orderBy: { deliveredAt: "desc" },
        take: 1,
        select: { deliveredAt: true, quantity: true },
      },
    },
  });
}

export async function searchMedPatients(tenantId: string, query: string) {
  return prisma.employee.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { firstName:      { contains: query, mode: "insensitive" } },
        { lastName:       { contains: query, mode: "insensitive" } },
        { employeeNumber: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: { id: true, firstName: true, lastName: true, employeeNumber: true, department: true },
  });
}

export async function searchMedProducts(tenantId: string, query: string) {
  const now = new Date();
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      category: "MEDICAMENTO",
      OR: [
        { genericName:    { contains: query, mode: "insensitive" } },
        { commercialName: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: {
      id: true, genericName: true, commercialName: true, unit: true, unitCost: true,
      batches: {
        where: { isActive: true, currentQty: { gt: 0 }, expiryDate: { gt: now } },
        select: { currentQty: true },
      },
    },
  });
  return products.map(p => ({
    id: p.id, genericName: p.genericName, commercialName: p.commercialName, unit: p.unit,
    totalStock: p.batches.reduce((s, b) => s + b.currentQty, 0),
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  employeeId: z.string().min(1),
  productId:  z.string().min(1),
  dose:       z.string().min(1, "Dosis requerida"),
  frequency:  z.string().min(1, "Frecuencia requerida"),
  notes:      z.string().optional(),
});

export async function createPermanentMed(
  tenantId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  // Check for duplicate active assignment
  const existing = await prisma.permanentMedication.findFirst({
    where: { tenantId, employeeId: parsed.data.employeeId, productId: parsed.data.productId, isActive: true },
  });
  if (existing) return { success: false, error: "Este paciente ya tiene este medicamento asignado como permanente." };

  const record = await prisma.permanentMedication.create({
    data: { tenantId, ...parsed.data, notes: parsed.data.notes || null },
  });

  revalidatePath("/permanent-meds");
  return { success: true, data: { id: record.id } };
}

const deliverySchema = z.object({
  permanentMedId: z.string().min(1),
  quantity:       z.coerce.number().int().min(1, "Cantidad debe ser mayor a 0"),
  pharmacistId:   z.string().min(1),
  notes:          z.string().optional(),
});

export async function recordDelivery(
  tenantId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = deliverySchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { permanentMedId, quantity, pharmacistId, notes } = parsed.data;

  const permMed = await prisma.permanentMedication.findFirst({
    where: { id: permanentMedId, tenantId, isActive: true },
    include: { employee: { select: { id: true } } },
  });
  if (!permMed) return { success: false, error: "Medicamento permanente no encontrado." };

  // FEFO allocation
  const now = new Date();
  const batches = await prisma.productBatch.findMany({
    where: { productId: permMed.productId, isActive: true, currentQty: { gt: 0 }, expiryDate: { gt: now }, product: { tenantId } },
    orderBy: { expiryDate: "asc" },
    select: { id: true, currentQty: true },
  });

  let remaining = quantity;
  const allocations: { batchId: string; qty: number }[] = [];
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, b.currentQty);
    allocations.push({ batchId: b.id, qty: take });
    remaining -= take;
  }
  if (remaining > 0) return { success: false, error: "Stock insuficiente para realizar la entrega." };

  const delivery = await prisma.$transaction(async (tx) => {
    const disp = await tx.dispensation.create({
      data: {
        tenantId,
        pharmacistId,
        employeeId: permMed.employee?.id || null,
        type: "VENTANILLA",
        notes: notes || `Entrega mensual: ${permMed.productId}`,
      },
    });

    for (const alloc of allocations) {
      await tx.dispensationItem.create({
        data: { dispensationId: disp.id, productId: permMed.productId, batchId: alloc.batchId, quantity: alloc.qty },
      });
      await tx.productBatch.update({ where: { id: alloc.batchId }, data: { currentQty: { decrement: alloc.qty } } });
      await tx.inventoryMovement.create({
        data: {
          tenantId, productId: permMed.productId, batchId: alloc.batchId, userId: pharmacistId,
          type: "SALIDA", quantity: -alloc.qty, reason: "Medicamento permanente", reference: permanentMedId,
        },
      });
    }

    const del = await tx.permanentMedDelivery.create({
      data: { permanentMedId, dispensationId: disp.id, quantity, notes: notes || null },
    });

    return del;
  });

  revalidatePath("/permanent-meds");
  revalidatePath("/inventory");
  return { success: true, data: { id: delivery.id } };
}

export async function deactivatePermanentMed(
  tenantId: string,
  permanentMedId: string
): Promise<ActionResult> {
  await prisma.permanentMedication.updateMany({
    where: { id: permanentMedId, tenantId },
    data: { isActive: false, endDate: new Date() },
  });
  revalidatePath("/permanent-meds");
  return { success: true, data: undefined };
}
