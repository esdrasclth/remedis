"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { otcDispensationSchema, rxDispensationSchema } from "@/lib/validations/pharmacy";

export type { OTCDispensationInput, RXDispensationInput } from "@/lib/validations/pharmacy";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns FEFO-sorted batches with stock for a product. */
async function getFEFOBatches(productId: string, tenantId: string) {
  return prisma.productBatch.findMany({
    where: {
      productId,
      isActive: true,
      currentQty: { gt: 0 },
      expiryDate: { gt: new Date() },
      product: { tenantId },
    },
    orderBy: { expiryDate: "asc" },
    select: { id: true, currentQty: true },
  });
}

/**
 * Allocates `requested` units across FEFO-sorted batches.
 * Returns allocations or throws if stock is insufficient.
 */
function allocateFEFO(
  batches: { id: string; currentQty: number }[],
  requested: number
): { batchId: string; qty: number }[] {
  const allocations: { batchId: string; qty: number }[] = [];
  let remaining = requested;
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, b.currentQty);
    allocations.push({ batchId: b.id, qty: take });
    remaining -= take;
  }
  if (remaining > 0) throw new Error("Stock insuficiente para uno o más productos.");
  return allocations;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function searchProductsWithStock(tenantId: string, query: string) {
  const now = new Date();
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(query.length > 0 && {
        OR: [
          { genericName:    { contains: query, mode: "insensitive" } },
          { commercialName: { contains: query, mode: "insensitive" } },
        ],
      }),
    },
    take: 12,
    select: {
      id: true, genericName: true, commercialName: true,
      unit: true, form: true, concentration: true,
      requiresPrescription: true,
      batches: {
        where: { isActive: true, currentQty: { gt: 0 }, expiryDate: { gt: now } },
        select: { currentQty: true, batchNumber: true, expiryDate: true },
        orderBy: { expiryDate: "asc" },
      },
    },
  });

  return products.map(p => ({
    id: p.id, genericName: p.genericName, commercialName: p.commercialName,
    unit: p.unit, form: p.form, concentration: p.concentration,
    requiresPrescription: p.requiresPrescription,
    totalStock: p.batches.reduce((s, b) => s + b.currentQty, 0),
    nextBatch: p.batches[0]
      ? { number: p.batches[0].batchNumber, expiryDate: p.batches[0].expiryDate }
      : null,
  }));
}

/** Returns FEFO batch suggestion (number + expiry) for each productId. */
export async function getProductBatchSuggestions(
  tenantId: string,
  productIds: string[]
): Promise<Record<string, { number: string; expiryDate: Date } | null>> {
  if (productIds.length === 0) return {};
  const now = new Date();
  const batches = await prisma.productBatch.findMany({
    where: {
      productId: { in: productIds },
      isActive: true,
      currentQty: { gt: 0 },
      expiryDate: { gt: now },
      product: { tenantId },
    },
    orderBy: { expiryDate: "asc" },
    select: { productId: true, batchNumber: true, expiryDate: true },
  });

  // For each product keep only the first (FEFO) batch
  const result: Record<string, { number: string; expiryDate: Date } | null> = {};
  for (const pid of productIds) result[pid] = null;
  for (const b of batches) {
    if (!result[b.productId]) {
      result[b.productId] = { number: b.batchNumber, expiryDate: b.expiryDate };
    }
  }
  return result;
}

export async function getActivePrescriptions(tenantId: string) {
  return prisma.prescription.findMany({
    where: {
      tenantId,
      status: { in: ["EMITIDA", "PARCIAL"] },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      doctor:   { select: { name: true } },
      employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      dependent:{ select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          product: { select: { genericName: true, commercialName: true, unit: true, unitCost: true } },
        },
      },
    },
  });
}

export async function getDispensations(tenantId: string) {
  return prisma.dispensation.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      pharmacist: { select: { name: true } },
      employee:   { select: { firstName: true, lastName: true, employeeNumber: true } },
      dependent:  { select: { firstName: true, lastName: true } },
      prescription: { select: { id: true } },
      items: {
        include: {
          product: { select: { genericName: true } },
        },
      },
    },
  });
}

// ─── OTC Dispensation ─────────────────────────────────────────────────────────

export async function dispenseOTC(
  tenantId: string,
  pharmacistId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = otcDispensationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { employeeId, dependentId, items, notes } = parsed.data;

  // Block Rx-only products from OTC dispensation
  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, tenantId },
      select: { requiresPrescription: true, genericName: true },
    });
    if (product?.requiresPrescription) {
      return { success: false, error: `"${product.genericName}" requiere receta médica. Use la pestaña "Con receta".` };
    }
  }

  // Pre-fetch FEFO batches for all products
  const batchMap = new Map<string, { batchId: string; qty: number }[]>();
  for (const item of items) {
    const batches = await getFEFOBatches(item.productId, tenantId);
    try {
      batchMap.set(item.productId, allocateFEFO(batches, item.quantity));
    } catch {
      return { success: false, error: `Stock insuficiente para el producto solicitado.` };
    }
  }

  const dispensation = await prisma.$transaction(async (tx) => {
    const d = await tx.dispensation.create({
      data: {
        tenantId,
        pharmacistId,
        employeeId:  employeeId  || null,
        dependentId: dependentId || null,
        type:  "VENTANILLA",
        notes: notes || null,
      },
    });

    for (const item of items) {
      const allocations = batchMap.get(item.productId)!;
      for (const alloc of allocations) {
        await tx.dispensationItem.create({
          data: {
            dispensationId: d.id,
            productId:  item.productId,
            batchId:    alloc.batchId,
            quantity:   alloc.qty,
          },
        });
        await tx.productBatch.update({
          where: { id: alloc.batchId },
          data:  { currentQty: { decrement: alloc.qty } },
        });
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            batchId:   alloc.batchId,
            userId:    pharmacistId,
            type:      "SALIDA",
            quantity:  -alloc.qty,
            reason:    "Dispensación ventanilla",
            reference: d.id,
          },
        });
      }
    }

    return d;
  });

  revalidatePath("/pharmacy");
  revalidatePath("/inventory");
  return { success: true, data: { id: dispensation.id } };
}

// ─── Prescription Dispensation ────────────────────────────────────────────────

export async function dispenseWithPrescription(
  tenantId: string,
  pharmacistId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = rxDispensationSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { prescriptionId, items, notes } = parsed.data;

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, tenantId, status: { in: ["EMITIDA", "PARCIAL"] } },
    include: {
      items: true,
      employee: { select: { id: true } },
      dependent:{ select: { id: true } },
    },
  });
  if (!prescription) return { success: false, error: "Receta no encontrada o ya procesada." };
  if (prescription.expiresAt < new Date()) return { success: false, error: "La receta está vencida." };

  // Validate requested quantities don't exceed remaining
  for (const item of items) {
    const rxItem = prescription.items.find(i => i.id === item.prescriptionItemId);
    if (!rxItem) return { success: false, error: "Ítem de receta no encontrado." };
    const remaining = rxItem.quantity - rxItem.dispensedQty;
    if (item.quantity > remaining) {
      return { success: false, error: `Cantidad solicitada supera lo pendiente para un medicamento.` };
    }
  }

  // Pre-fetch FEFO batches
  const batchMap = new Map<string, { batchId: string; qty: number }[]>();
  for (const item of items) {
    const batches = await getFEFOBatches(item.productId, tenantId);
    try {
      batchMap.set(item.prescriptionItemId, allocateFEFO(batches, item.quantity));
    } catch {
      return { success: false, error: "Stock insuficiente para uno o más medicamentos." };
    }
  }

  const dispensation = await prisma.$transaction(async (tx) => {
    const d = await tx.dispensation.create({
      data: {
        tenantId,
        pharmacistId,
        prescriptionId,
        employeeId:  prescription.employee?.id  || null,
        dependentId: prescription.dependent?.id || null,
        type:  "CON_RECETA",
        notes: notes || null,
      },
    });

    for (const item of items) {
      const allocations = batchMap.get(item.prescriptionItemId)!;
      for (const alloc of allocations) {
        await tx.dispensationItem.create({
          data: {
            dispensationId: d.id,
            productId:  item.productId,
            batchId:    alloc.batchId,
            quantity:   alloc.qty,
          },
        });
        await tx.productBatch.update({
          where: { id: alloc.batchId },
          data:  { currentQty: { decrement: alloc.qty } },
        });
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            batchId:   alloc.batchId,
            userId:    pharmacistId,
            type:      "SALIDA",
            quantity:  -alloc.qty,
            reason:    `Dispensación con receta`,
            reference: prescriptionId,
          },
        });
      }
      // Update dispensed qty on the prescription item
      const totalDispensed = batchMap.get(item.prescriptionItemId)!
        .reduce((s, a) => s + a.qty, 0);
      await tx.prescriptionItem.update({
        where: { id: item.prescriptionItemId },
        data:  { dispensedQty: { increment: totalDispensed } },
      });
    }

    // Recalculate prescription status
    const updatedItems = await tx.prescriptionItem.findMany({
      where: { prescriptionId },
    });
    const allDone = updatedItems.every(i => i.dispensedQty >= i.quantity);
    const anyDone = updatedItems.some(i => i.dispensedQty > 0);
    const newStatus = allDone ? "DISPENSADA" : anyDone ? "PARCIAL" : "EMITIDA";

    await tx.prescription.update({
      where: { id: prescriptionId },
      data:  { status: newStatus },
    });

    return d;
  });

  revalidatePath("/pharmacy");
  revalidatePath("/prescriptions");
  revalidatePath("/inventory");
  return { success: true, data: { id: dispensation.id } };
}
