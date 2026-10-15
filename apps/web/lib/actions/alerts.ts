"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type AlertItem = {
  id: string;
  type: string;
  message: string;
  status: string;
  entityId: string | null;
  entityType: string | null;
  createdAt: Date;
};

export async function getAlerts(tenantId: string, limit = 30): Promise<AlertItem[]> {
  return prisma.alert.findMany({
    where:   { tenantId, status: { not: "RESUELTA" } },
    orderBy: { createdAt: "desc" },
    take:    limit,
    select:  { id: true, type: true, message: true, status: true, entityId: true, entityType: true, createdAt: true },
  });
}

export async function getUnreadCount(tenantId: string): Promise<number> {
  return prisma.alert.count({
    where: { tenantId, status: "PENDIENTE" },
  });
}

export async function markAlertRead(alertId: string) {
  await prisma.alert.update({
    where: { id: alertId },
    data:  { status: "LEIDA", readAt: new Date() },
  });
}

export async function markAllRead(tenantId: string) {
  await prisma.alert.updateMany({
    where: { tenantId, status: "PENDIENTE" },
    data:  { status: "LEIDA", readAt: new Date() },
  });
}

export async function resolveAlert(alertId: string) {
  await prisma.alert.update({
    where: { id: alertId },
    data:  { status: "RESUELTA", readAt: new Date() },
  });
}

// ─── Auto-generate system alerts ─────────────────────────────────────────────
// Called after key operations (receiving stock, dispensing, etc.)

export async function generateSystemAlerts(tenantId: string) {
  const now = new Date();

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { config: true } });
  const cfg = (tenant?.config ?? {}) as Record<string, unknown>;
  const expiryDays             = (cfg.expiryAlertDays          as number  | undefined) ?? 30;
  const stockEnabled           = (cfg.stockAlertEnabled        as boolean | undefined) ?? true;
  const expiryEnabled          = (cfg.expiryAlertEnabled       as boolean | undefined) ?? true;
  const expiredEnabled         = (cfg.expiredAlertEnabled      as boolean | undefined) ?? true;
  const prescriptionEnabled    = (cfg.prescriptionAlertEnabled as boolean | undefined) ?? true;

  const inN  = new Date(Date.now() + expiryDays * 86400000);

  const [products, expiring, expired, expiredRx] = await Promise.all([
    // Low stock products
    prisma.product.findMany({
      where:   { tenantId, isActive: true },
      select:  { id: true, genericName: true, minStock: true, batches: { where: { isActive: true }, select: { currentQty: true } } },
    }),
    // Batches expiring within configured days
    prisma.productBatch.findMany({
      where:   { product: { tenantId, isActive: true }, isActive: true, currentQty: { gt: 0 }, expiryDate: { lte: inN, gt: now } },
      select:  { id: true, batchNumber: true, expiryDate: true, product: { select: { id: true, genericName: true } } },
    }),
    // Already expired with stock remaining
    prisma.productBatch.findMany({
      where:   { product: { tenantId, isActive: true }, isActive: true, currentQty: { gt: 0 }, expiryDate: { lt: now } },
      select:  { id: true, batchNumber: true, product: { select: { id: true, genericName: true } } },
    }),
    // Expired prescriptions still showing as EMITIDA
    prisma.prescription.findMany({
      where:   { tenantId, status: "EMITIDA", expiresAt: { lt: now } },
      select:  { id: true, employee: { select: { firstName: true, lastName: true } }, dependent: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const toCreate: Parameters<typeof prisma.alert.create>[0]["data"][] = [];

  // Low stock alerts
  if (stockEnabled) {
    for (const p of products) {
      const total = p.batches.reduce((s, b) => s + b.currentQty, 0);
      if (total <= p.minStock) {
        const existing = await prisma.alert.findFirst({
          where: { tenantId, type: "STOCK_MINIMO", entityId: p.id, status: { not: "RESUELTA" } },
        });
        if (!existing) {
          toCreate.push({
            tenantId, type: "STOCK_MINIMO", entityId: p.id, entityType: "Product",
            message: `Stock bajo: ${p.genericName} tiene ${total} unidades (mínimo: ${p.minStock})`,
          });
        }
      }
    }
  }

  // Expiring batches
  if (expiryEnabled) {
    for (const b of expiring) {
      const days = Math.ceil((new Date(b.expiryDate).getTime() - now.getTime()) / 86400000);
      const existing = await prisma.alert.findFirst({
        where: { tenantId, type: "VENCIMIENTO_PROXIMO", entityId: b.id, status: { not: "RESUELTA" } },
      });
      if (!existing) {
        toCreate.push({
          tenantId, type: "VENCIMIENTO_PROXIMO", entityId: b.id, entityType: "ProductBatch",
          message: `Lote ${b.batchNumber} de ${b.product.genericName} vence en ${days} día${days !== 1 ? "s" : ""}`,
        });
      }
    }
  }

  // Expired batches with stock
  if (expiredEnabled) {
    for (const b of expired) {
      const existing = await prisma.alert.findFirst({
        where: { tenantId, type: "MEDICAMENTO_VENCIDO", entityId: b.id, status: { not: "RESUELTA" } },
      });
      if (!existing) {
        toCreate.push({
          tenantId, type: "MEDICAMENTO_VENCIDO", entityId: b.id, entityType: "ProductBatch",
          message: `Lote ${b.batchNumber} de ${b.product.genericName} está vencido y tiene stock`,
        });
      }
    }
  }

  // Expired prescriptions
  if (prescriptionEnabled) {
    for (const rx of expiredRx) {
      const patient = rx.employee
        ? `${rx.employee.lastName}, ${rx.employee.firstName}`
        : rx.dependent
        ? `${rx.dependent.lastName}, ${rx.dependent.firstName}`
        : "Paciente";
      const existing = await prisma.alert.findFirst({
        where: { tenantId, type: "RECETA_VENCIDA", entityId: rx.id, status: { not: "RESUELTA" } },
      });
      if (!existing) {
        toCreate.push({
          tenantId, type: "RECETA_VENCIDA", entityId: rx.id, entityType: "Prescription",
          message: `Receta de ${patient} venció sin ser dispensada completamente`,
        });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.alert.createMany({ data: toCreate as any });
  }

  return toCreate.length;
}
