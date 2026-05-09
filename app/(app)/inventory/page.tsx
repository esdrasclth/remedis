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

  const stats = [
    { label: "Productos", value: totalProducts, sub: "en catálogo" },
    { label: "Unidades", value: totalStock, sub: "en stock total" },
    { label: "Stock bajo", value: lowStockCount, sub: "bajo el mínimo", alert: lowStockCount > 0 },
    {
      label: "Por vencer",
      value: expiring30,
      sub: expiring90 > 0 ? `${expiring90} en 90 días` : "próximos 30 días",
      alert: expiring30 > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[22px] font-medium text-white">Inventario</h2>
        <p className="text-[13px] text-slate-gray mt-0.5">
          Catálogo de productos, lotes y movimientos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#1c1b1a] rounded-[10px] px-5 py-4 flex flex-col gap-1.5"
          >
            <span className="text-[11px] text-slate-gray uppercase tracking-wide">{s.label}</span>
            <span
              className={`text-[30px] font-medium leading-none ${s.alert ? "text-blaze-orange" : "text-white"}`}
            >
              {s.value}
            </span>
            <span className="text-[12px] text-[#5a5854]">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <ProductTable products={products} />
    </div>
  );
}
