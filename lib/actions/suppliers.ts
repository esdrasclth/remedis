"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  supplierSchema,
  purchaseOrderSchema,
  receiveOrderSchema,
} from "@/lib/validations/suppliers";

export type { SupplierInput, PurchaseOrderInput, ReceiveOrderInput } from "@/lib/validations/suppliers";

type ActionResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: string };

// ─── Suppliers ────────────────────────────────────────────────────────────────

export async function getSuppliers(tenantId: string) {
  return prisma.supplier.findMany({
    where:   { tenantId, isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });
}

export async function getSupplier(tenantId: string, supplierId: string) {
  return prisma.supplier.findFirst({
    where: { id: supplierId, tenantId },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: { include: { product: { select: { genericName: true } } } } },
      },
    },
  });
}

export async function createSupplier(
  tenantId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = supplierSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supplier = await prisma.supplier.create({
    data: { tenantId, ...parsed.data },
  });
  revalidatePath("/suppliers");
  return { success: true, data: { id: supplier.id } };
}

export async function updateSupplier(
  tenantId: string,
  supplierId: string,
  data: unknown
): Promise<ActionResult<void>> {
  const parsed = supplierSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await prisma.supplier.updateMany({
    where: { id: supplierId, tenantId },
    data:  parsed.data,
  });
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
  return { success: true, data: undefined };
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export async function getPurchaseOrders(tenantId: string) {
  return prisma.purchaseOrder.findMany({
    where:   { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true } },
      items:    { include: { product: { select: { genericName: true } } } },
      receipts: { select: { id: true } },
    },
  });
}

export async function getPurchaseOrder(tenantId: string, orderId: string) {
  return prisma.purchaseOrder.findFirst({
    where: { id: orderId, tenantId },
    include: {
      supplier: true,
      items: {
        include: { product: { select: { genericName: true, unit: true, form: true } } },
      },
      receipts: { orderBy: { receivedAt: "desc" } },
    },
  });
}

export async function createPurchaseOrder(
  tenantId: string,
  data: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = purchaseOrderSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const order = await prisma.purchaseOrder.create({
    data: {
      tenantId,
      supplierId: parsed.data.supplierId || null,
      source:     parsed.data.source,
      notes:      parsed.data.notes || null,
      items: {
        create: parsed.data.items.map(i => ({
          productId:    i.productId,
          requestedQty: i.requestedQty,
          unitCost:     i.unitCost ?? null,
        })),
      },
    },
  });
  revalidatePath("/suppliers/orders");
  return { success: true, data: { id: order.id } };
}

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: "BORRADOR" | "ENVIADA" | "CANCELADA"
): Promise<ActionResult<void>> {
  await prisma.purchaseOrder.updateMany({
    where: { id: orderId, tenantId },
    data:  { status },
  });
  revalidatePath("/suppliers/orders");
  revalidatePath(`/suppliers/orders/${orderId}`);
  return { success: true, data: undefined };
}

export async function receiveMerchandise(
  tenantId: string,
  userId: string,
  data: unknown
): Promise<ActionResult<void>> {
  const parsed = receiveOrderSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { orderId, notes, batches } = parsed.data;

  const order = await prisma.purchaseOrder.findFirst({
    where:   { id: orderId, tenantId, status: { in: ["ENVIADA", "PARCIAL"] } },
    include: { items: true },
  });
  if (!order) return { success: false, error: "Orden no encontrada o no está en estado ENVIADA." };

  await prisma.$transaction(async (tx) => {
    // Create receipt record
    await tx.purchaseReceipt.create({
      data: { purchaseOrderId: orderId, notes: notes || null },
    });

    for (const b of batches) {
      // Read unit cost from OC item
      const orderItem = await tx.purchaseOrderItem.findUnique({
        where: { id: b.orderItemId },
        select: { unitCost: true },
      });

      // Create product batch
      const newBatch = await tx.productBatch.create({
        data: {
          productId:   b.productId,
          warehouseId: b.warehouseId,
          batchNumber: b.batchNumber,
          mfgDate:     b.mfgDate ? new Date(b.mfgDate) : null,
          expiryDate:  new Date(b.expiryDate),
          initialQty:  b.receivedQty,
          currentQty:  b.receivedQty,
          source:      b.source,
        },
      });

      // Inventory movement ENTRADA
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: b.productId,
          batchId:   newBatch.id,
          userId,
          type:      "ENTRADA",
          quantity:  b.receivedQty,
          reason:    `Recepción OC ${orderId.slice(-8).toUpperCase()}`,
          reference: orderId,
        },
      });

      // Update received qty on order item
      await tx.purchaseOrderItem.update({
        where: { id: b.orderItemId },
        data:  { receivedQty: { increment: b.receivedQty } },
      });

      // Auto-populate product unit cost from OC item if set
      if (orderItem?.unitCost != null) {
        await tx.product.update({
          where: { id: b.productId },
          data:  { unitCost: orderItem.unitCost },
        });
      }
    }

    // Recalculate order status
    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: orderId },
    });
    const allReceived = updatedItems.every(i => i.receivedQty >= i.requestedQty);
    const anyReceived = updatedItems.some(i => i.receivedQty > 0);

    await tx.purchaseOrder.update({
      where: { id: orderId },
      data:  { status: allReceived ? "RECIBIDA" : anyReceived ? "PARCIAL" : "ENVIADA" },
    });
  });

  revalidatePath("/suppliers/orders");
  revalidatePath(`/suppliers/orders/${orderId}`);
  revalidatePath("/inventory");
  return { success: true, data: undefined };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function searchProductsForOrder(tenantId: string, query: string) {
  return prisma.product.findMany({
    where: {
      tenantId, isActive: true,
      ...(query && {
        OR: [
          { genericName:    { contains: query, mode: "insensitive" } },
          { commercialName: { contains: query, mode: "insensitive" } },
        ],
      }),
    },
    take: 10,
    select: { id: true, genericName: true, commercialName: true, unit: true, unitCost: true },
  });
}
