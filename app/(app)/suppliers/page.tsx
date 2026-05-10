import Link from "next/link";
import { Plus } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getPurchaseOrders } from "@/lib/actions/suppliers";
import { SupplierTable } from "@/components/suppliers/supplier-table";
import { OrderTable } from "@/components/suppliers/order-table";
import { Button } from "@/components/ui/button";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const { tab = "proveedores" } = await searchParams;
  const [suppliers, orders] = await Promise.all([
    getSuppliers(tenantId),
    getPurchaseOrders(tenantId),
  ]);

  const pendingOrders = orders.filter(o => o.status === "ENVIADA").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Proveedores & Compras</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">
            {suppliers.length} proveedor{suppliers.length !== 1 ? "es" : ""}
            {pendingOrders > 0 && ` · ${pendingOrders} orden${pendingOrders !== 1 ? "es" : ""} pendiente${pendingOrders !== 1 ? "s" : ""}`}
          </p>
        </div>
        {tab === "ordenes" ? (
          <Link href="/suppliers/orders/new">
            <Button size="md"><Plus className="w-3.5 h-3.5" /> Nueva orden</Button>
          </Link>
        ) : (
          <Link href="/suppliers/new">
            <Button size="md"><Plus className="w-3.5 h-3.5" /> Nuevo proveedor</Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-ash-gray rounded-[8px] p-1 w-fit">
        {[
          { key: "proveedores", label: "Proveedores" },
          { key: "ordenes",     label: `Órdenes de compra${orders.length > 0 ? ` (${orders.length})` : ""}` },
        ].map(t => (
          <Link
            key={t.key}
            href={`/suppliers?tab=${t.key}`}
            className={`px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
              tab === t.key
                ? "bg-sunbeam-yellow text-deep-space-black"
                : "text-slate-gray hover:text-pure-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "proveedores" ? (
        <SupplierTable suppliers={suppliers} />
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}
