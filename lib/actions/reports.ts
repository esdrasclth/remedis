"use server";

import { prisma } from "@/lib/prisma";

// ─── Stock ────────────────────────────────────────────────────────────────────

export async function getFullStockReport(tenantId: string) {
  const products = await prisma.product.findMany({
    where:   { tenantId, isActive: true },
    orderBy: { genericName: "asc" },
    include: {
      batches: {
        where:   { isActive: true },
        include: { warehouse: { select: { name: true, source: true } } },
        orderBy: { expiryDate: "asc" },
      },
    },
  });
  return products.map(p => ({
    ...p,
    totalStock:   p.batches.reduce((s, b) => s + b.currentQty, 0),
    activeBatches: p.batches.filter(b => b.currentQty > 0).length,
  }));
}

// ─── Expiring ─────────────────────────────────────────────────────────────────

export async function getExpiringReport(tenantId: string, days = 90) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return prisma.productBatch.findMany({
    where: {
      product:   { tenantId, isActive: true },
      isActive:  true,
      currentQty:{ gt: 0 },
      expiryDate:{ lte: threshold },
    },
    include: {
      product:   { select: { genericName: true, commercialName: true, unit: true, unitCost: true } },
      warehouse: { select: { name: true } },
    },
    orderBy: { expiryDate: "asc" },
  });
}

// ─── Consumption ──────────────────────────────────────────────────────────────

export async function getConsumptionReport(tenantId: string, from: Date, to: Date) {
  const items = await prisma.dispensationItem.findMany({
    where: {
      dispensation: { tenantId, createdAt: { gte: from, lte: to } },
    },
    include: {
      product:     { select: { id: true, genericName: true, unit: true, category: true } },
      dispensation:{ select: { type: true } },
    },
  });

  const map = new Map<string, {
    productId: string; genericName: string; unit: string | null;
    category: string; totalQty: number; events: number;
  }>();
  for (const item of items) {
    const key = item.productId;
    if (map.has(key)) {
      const e = map.get(key)!;
      e.totalQty += item.quantity;
      e.events++;
    } else {
      map.set(key, {
        productId:   item.productId,
        genericName: item.product.genericName,
        unit:        item.product.unit,
        category:    item.product.category,
        totalQty:    item.quantity,
        events:      1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointmentReport(tenantId: string, from: Date, to: Date) {
  const [appointments, byStatus, byType] = await Promise.all([
    prisma.appointment.count({ where: { tenantId, scheduledAt: { gte: from, lte: to } } }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { tenantId, scheduledAt: { gte: from, lte: to } },
      _count: { id: true },
    }),
    prisma.appointment.groupBy({
      by: ["type"],
      where: { tenantId, scheduledAt: { gte: from, lte: to } },
      _count: { id: true },
    }),
  ]);
  return { total: appointments, byStatus, byType };
}

// ─── Morbidity ────────────────────────────────────────────────────────────────

export async function getMorbidityReport(tenantId: string, from: Date, to: Date) {
  const diagnoses = await prisma.diagnosis.findMany({
    where: {
      isPrimary:    true,
      medicalRecord:{ tenantId, createdAt: { gte: from, lte: to } },
    },
    select: { cie10Code: true, description: true },
  });

  const map = new Map<string, { code: string; description: string; count: number }>();
  for (const d of diagnoses) {
    const e = map.get(d.cie10Code);
    if (e) e.count++;
    else map.set(d.cie10Code, { code: d.cie10Code, description: d.description, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ─── Financial ────────────────────────────────────────────────────────────────

export async function getFinancialReport(tenantId: string, year: number, month: number) {
  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true, genericName: true, commercialName: true, unit: true, unitCost: true,
        batches: { where: { isActive: true }, select: { currentQty: true } },
      },
      orderBy: { genericName: "asc" },
    }),
    prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        type: { in: ["ENTRADA", "SALIDA"] },
        createdAt: { gte: from, lte: to },
      },
      select: { type: true, quantity: true, productId: true, reference: true },
    }),
  ]);

  // Build a map of orderId → { productId → unitCost } from PurchaseOrderItems
  // for ENTRADA movements that reference an OC (so old data works even if Product.unitCost was null)
  const orderIds = [...new Set(
    movements.filter(m => m.type === "ENTRADA" && m.reference).map(m => m.reference!)
  )];
  const ocCostMap = new Map<string, number>(); // key: `${orderId}:${productId}`
  if (orderIds.length > 0) {
    const ocItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: { in: orderIds }, unitCost: { not: null } },
      select: { purchaseOrderId: true, productId: true, unitCost: true },
    });
    for (const item of ocItems) {
      ocCostMap.set(`${item.purchaseOrderId}:${item.productId}`, item.unitCost!);
    }
  }

  const productMap = new Map(products.map(p => [p.id, p]));

  let totalIncoming = 0;
  let totalOutgoing = 0;
  const movMap = new Map<string, { incoming: number; outgoing: number }>();

  for (const m of movements) {
    const product = productMap.get(m.productId);
    // For ENTRADA: prefer OC item cost, fall back to product.unitCost
    // For SALIDA: use product.unitCost
    const cost =
      m.type === "ENTRADA" && m.reference
        ? (ocCostMap.get(`${m.reference}:${m.productId}`) ?? product?.unitCost ?? 0)
        : (product?.unitCost ?? 0);
    const value   = m.quantity * cost;
    const entry   = movMap.get(m.productId) ?? { incoming: 0, outgoing: 0 };
    if (m.type === "ENTRADA") { entry.incoming += value; totalIncoming += value; }
    else                      { entry.outgoing += value; totalOutgoing += value; }
    movMap.set(m.productId, entry);
  }

  const productRows = products.map(p => {
    const totalStock = p.batches.reduce((s, b) => s + b.currentQty, 0);
    const value      = totalStock * (p.unitCost ?? 0);
    const mov        = movMap.get(p.id) ?? { incoming: 0, outgoing: 0 };
    return { ...p, totalStock, inventoryValue: value, ...mov };
  });

  const totalInventoryValue = productRows.reduce((s, p) => s + p.inventoryValue, 0);

  return { productRows, totalInventoryValue, totalIncoming, totalOutgoing };
}

// ─── Dashboard summary ────────────────────────────────────────────────────────

export async function getDashboardData(tenantId: string) {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayAppts,
    lowStockCount,
    expiring30Count,
    pendingRxCount,
    todayApptList,
    recentDispensations,
    criticalStock,
  ] = await Promise.all([
    // Counts
    prisma.appointment.count({
      where: { tenantId, scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.product.count({
      where: {
        tenantId, isActive: true,
        batches: { some: { isActive: true } },
      },
      // We need a custom filter — do it via a subquery approach
    }).then(async () => {
      const prods = await prisma.product.findMany({
        where: { tenantId, isActive: true },
        select: { minStock: true, batches: { where: { isActive: true }, select: { currentQty: true } } },
      });
      return prods.filter(p => {
        const total = p.batches.reduce((s, b) => s + b.currentQty, 0);
        return total <= p.minStock;
      }).length;
    }),
    prisma.productBatch.count({
      where: {
        product:   { tenantId, isActive: true },
        isActive:  true,
        currentQty:{ gt: 0 },
        expiryDate:{ lte: new Date(Date.now() + 30 * 86400000) },
      },
    }),
    prisma.prescription.count({
      where: { tenantId, status: "EMITIDA", expiresAt: { gt: now } },
    }),
    // Today's appointments list
    prisma.appointment.findMany({
      where:   { tenantId, scheduledAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { scheduledAt: "asc" },
      take: 8,
      include: {
        doctor:   { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
        dependent:{ select: { firstName: true, lastName: true } },
        medicalRecord: { select: { id: true } },
      },
    }),
    // Recent dispensations (last 5)
    prisma.dispensation.findMany({
      where:   { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        employee:  { select: { firstName: true, lastName: true } },
        dependent: { select: { firstName: true, lastName: true } },
        items: { include: { product: { select: { genericName: true } } } },
      },
    }),
    // Critical stock (below minimum, with stock > 0)
    prisma.product.findMany({
      where:   { tenantId, isActive: true },
      select: {
        id: true, genericName: true, minStock: true, unit: true,
        batches: { where: { isActive: true }, select: { currentQty: true } },
      },
    }).then(prods =>
      prods
        .map(p => ({ ...p, total: p.batches.reduce((s, b) => s + b.currentQty, 0) }))
        .filter(p => p.total <= p.minStock)
        .sort((a, b) => a.total - b.total)
        .slice(0, 6)
    ),
  ]);

  return {
    todayAppts,
    lowStockCount,
    expiring30Count,
    pendingRxCount,
    todayApptList,
    recentDispensations,
    criticalStock,
  };
}
