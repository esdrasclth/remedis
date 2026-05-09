"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import {
  productSchema,
  batchSchema,
  adjustmentSchema,
} from "@/lib/validations/inventory";
export type { ProductInput, BatchInput, AdjustmentInput } from "@/lib/validations/inventory";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(tenantId: string) {
  return prisma.product.findMany({
    where: { tenantId, isActive: true },
    include: {
      batches: {
        where: { isActive: true, currentQty: { gt: 0 } },
        select: { currentQty: true, expiryDate: true },
      },
      _count: { select: { batches: true } },
    },
    orderBy: { genericName: "asc" },
  });
}

export async function getProduct(tenantId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, tenantId },
  });
}

export async function createProduct(
  tenantId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const product = await prisma.product.create({
    data: { ...parsed.data, tenantId },
  });
  revalidatePath("/inventory");
  return { ok: true, data: { id: product.id } };
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  raw: unknown
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await prisma.product.updateMany({
    where: { id: productId, tenantId },
    data: parsed.data,
  });
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  return { ok: true, data: undefined };
}

export async function deactivateProduct(
  tenantId: string,
  productId: string
): Promise<ActionResult> {
  await prisma.product.updateMany({
    where: { id: productId, tenantId },
    data: { isActive: false },
  });
  revalidatePath("/inventory");
  return { ok: true, data: undefined };
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export async function getWarehouses(tenantId: string) {
  return prisma.warehouse.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: "asc" },
  });
}

// ─── Batches ──────────────────────────────────────────────────────────────────

export async function getBatches(tenantId: string, productId: string) {
  return prisma.productBatch.findMany({
    where: { product: { tenantId }, productId, isActive: true },
    include: { warehouse: { select: { name: true, source: true } } },
    orderBy: { expiryDate: "asc" },
  });
}

export async function createBatch(
  tenantId: string,
  productId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  const user = session?.user as unknown as SessionUser;
  if (!user?.id) return { ok: false, error: "No autenticado" };

  const parsed = batchSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { warehouseId, batchNumber, mfgDate, expiryDate, initialQty, source } =
    parsed.data;

  const batch = await prisma.$transaction(async (tx) => {
    const b = await tx.productBatch.create({
      data: {
        productId,
        warehouseId,
        batchNumber,
        mfgDate: mfgDate ? new Date(mfgDate) : null,
        expiryDate: new Date(expiryDate),
        initialQty,
        currentQty: initialQty,
        source,
      },
    });
    await tx.inventoryMovement.create({
      data: {
        tenantId,
        productId,
        batchId: b.id,
        userId: user.id,
        type: "ENTRADA",
        quantity: initialQty,
        reason: `Ingreso de lote ${batchNumber}`,
        reference: batchNumber,
      },
    });
    return b;
  });

  revalidatePath(`/inventory/${productId}`);
  return { ok: true, data: { id: batch.id } };
}

// ─── Stock Adjustment ─────────────────────────────────────────────────────────

export async function adjustStock(
  tenantId: string,
  productId: string,
  raw: unknown
): Promise<ActionResult> {
  const session = await auth();
  const user = session?.user as unknown as SessionUser;
  if (!user?.id) return { ok: false, error: "No autenticado" };

  const parsed = adjustmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { batchId, newQty, reason } = parsed.data;

  const batch = await prisma.productBatch.findFirst({
    where: { id: batchId, product: { tenantId } },
  });
  if (!batch) return { ok: false, error: "Lote no encontrado" };

  const delta = newQty - batch.currentQty;

  await prisma.$transaction([
    prisma.productBatch.update({
      where: { id: batchId },
      data: { currentQty: newQty },
    }),
    prisma.inventoryMovement.create({
      data: {
        tenantId,
        productId,
        batchId,
        userId: user.id,
        type: "AJUSTE",
        quantity: delta,
        reason,
        reference: `ADJ-${Date.now()}`,
      },
    }),
  ]);

  revalidatePath(`/inventory/${productId}`);
  return { ok: true, data: undefined };
}

// ─── Kardex ───────────────────────────────────────────────────────────────────

export async function getKardex(tenantId: string, productId: string) {
  return prisma.inventoryMovement.findMany({
    where: { tenantId, productId },
    include: {
      user: { select: { name: true, email: true } },
      batch: { select: { batchNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// ─── Dashboard Alerts ─────────────────────────────────────────────────────────

export async function getLowStockCount(tenantId: string): Promise<number> {
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    select: {
      minStock: true,
      batches: {
        where: { isActive: true },
        select: { currentQty: true },
      },
    },
  });
  return products.filter((p) => {
    const total = p.batches.reduce((s, b) => s + b.currentQty, 0);
    return total <= p.minStock;
  }).length;
}

export async function getExpiringCount(
  tenantId: string,
  days = 30
): Promise<number> {
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return prisma.productBatch.count({
    where: {
      product: { tenantId },
      isActive: true,
      currentQty: { gt: 0 },
      expiryDate: { lte: limit },
    },
  });
}
