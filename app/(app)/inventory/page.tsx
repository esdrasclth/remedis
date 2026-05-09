import { Package, AlertTriangle, Clock } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getProducts, getLowStockCount, getExpiringCount } from "@/lib/actions/inventory";
import { ProductTable } from "@/components/inventory/product-table";

export default async function InventoryPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const [products, lowStockCount, expiring30, expiring90] = await Promise.all([
    getProducts(tenantId),
    getLowStockCount(tenantId),
    getExpiringCount(tenantId, 30),
    getExpiringCount(tenantId, 90),
  ]);

  const totalProducts = products.length;
  const totalStock = products.reduce(
    (s, p) => s + p.batches.reduce((bs, b) => bs + b.currentQty, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-[24px] font-medium text-pure-white"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            Inventario
          </h2>
          <p className="text-slate-gray text-[13px] mt-1">
            Catálogo de productos, lotes y movimientos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total productos"
          value={totalProducts}
          icon={<Package className="w-4 h-4" />}
        />
        <StatCard
          label="Unidades en stock"
          value={totalStock}
          icon={<Package className="w-4 h-4" />}
        />
        <StatCard
          label="Stock bajo"
          value={lowStockCount}
          icon={<AlertTriangle className="w-4 h-4" />}
          alert={lowStockCount > 0}
        />
        <StatCard
          label="Vencen en 30 días"
          value={expiring30}
          icon={<Clock className="w-4 h-4" />}
          alert={expiring30 > 0}
          sub={expiring90 > 0 ? `${expiring90} en 90 días` : undefined}
        />
      </div>

      {/* Product table */}
      <ProductTable products={products} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  alert,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  alert?: boolean;
  sub?: string;
}) {
  return (
    <div className="bg-ash-gray rounded-[12px] p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-gray uppercase tracking-wide">{label}</span>
        <span className={alert ? "text-blaze-orange" : "text-iron-gray"}>{icon}</span>
      </div>
      <span
        className={`text-[28px] font-medium ${alert ? "text-blaze-orange" : "text-pure-white"}`}
        style={{ fontFeatureSettings: '"ss01"' }}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-slate-gray">{sub}</span>}
    </div>
  );
}
