import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import {
  getFullStockReport,
  getExpiringReport,
  getConsumptionReport,
  getAppointmentReport,
  getMorbidityReport,
} from "@/lib/actions/reports";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { key: "inventario",    label: "Inventario" },
  { key: "vencimientos",  label: "Por vencer" },
  { key: "consumo",       label: "Consumo" },
  { key: "citas",         label: "Citas" },
  { key: "morbilidad",    label: "Morbilidad" },
] as const;

type Tab = typeof TABS[number]["key"];

function monthBounds() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const { tab = "inventario" } = await searchParams;
  const activeTab = TABS.find(t => t.key === tab)?.key ?? "inventario";
  const { start, end } = monthBounds();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-[20px] font-medium text-pure-white">Reportes</h1>
        <p className="text-[13px] text-slate-gray mt-0.5">
          Datos en tiempo real — mes actual:{" "}
          {start.toLocaleDateString("es-HN", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-ash-gray rounded-[8px] p-1 w-fit">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`/reports?tab=${t.key}`}
            className={`px-4 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? "bg-sunbeam-yellow text-deep-space-black"
                : "text-slate-gray hover:text-pure-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "inventario" && <StockReport tenantId={tenantId} />}
      {activeTab === "vencimientos" && <ExpiringReport tenantId={tenantId} />}
      {activeTab === "consumo" && <ConsumptionReport tenantId={tenantId} start={start} end={end} />}
      {activeTab === "citas" && <AppointmentsReport tenantId={tenantId} start={start} end={end} />}
      {activeTab === "morbilidad" && <MorbidityReport tenantId={tenantId} start={start} end={end} />}
    </div>
  );
}

// ─── Stock Report ──────────────────────────────────────────────────────────────

async function StockReport({ tenantId }: { tenantId: string }) {
  const products = await getFullStockReport(tenantId);
  const lowCount = products.filter(p => p.totalStock <= p.minStock).length;

  const COL = {
    name: "w-auto px-4 py-3",
    cat:  "w-32   px-4 py-3",
    batches: "w-24 px-4 py-3 text-right",
    stock:"w-28   px-4 py-3 text-right",
    min:  "w-24   px-4 py-3 text-right",
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-gray">
        {products.length} productos · {lowCount > 0 ? (
          <span className="text-blaze-orange">{lowCount} bajo mínimo</span>
        ) : (
          <span className="text-emerald-green">todos sobre mínimo</span>
        )}
      </p>
      <div className="rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#222120]">
              <th className={`${COL.name}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Producto</th>
              <th className={`${COL.cat}     text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Categoría</th>
              <th className={`${COL.batches} text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Lotes</th>
              <th className={`${COL.stock}   text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Stock actual</th>
              <th className={`${COL.min}     text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Mínimo</th>
            </tr>
          </thead>
          <tbody className="bg-ash-gray">
            {products.map(p => {
              const isLow = p.totalStock <= p.minStock;
              return (
                <tr key={p.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className={COL.name}>
                    <Link href={`/inventory/${p.id}`} className="hover:underline">
                      <p className="text-[13px] text-pure-white font-medium">{p.genericName}</p>
                      {p.commercialName && <p className="text-[11px] text-slate-gray mt-0.5">{p.commercialName}</p>}
                    </Link>
                  </td>
                  <td className={`${COL.cat} text-[12px] text-slate-gray`}>
                    {p.category === "MEDICAMENTO" ? "Medicamento" : p.category === "INSUMO_DESCARTABLE" ? "Insumo" : "Equipo"}
                  </td>
                  <td className={`${COL.batches} text-[13px] text-slate-gray tabular-nums`}>
                    {p.activeBatches}
                  </td>
                  <td className={`${COL.stock} tabular-nums`}>
                    <div className="flex items-center justify-end gap-1.5">
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-blaze-orange shrink-0" />}
                      <span className={`text-[14px] font-medium ${isLow ? "text-blaze-orange" : "text-pure-white"}`}>
                        {p.totalStock}
                      </span>
                      {p.unit && <span className="text-[11px] text-iron-gray">{p.unit}</span>}
                    </div>
                  </td>
                  <td className={`${COL.min} text-[13px] text-slate-gray tabular-nums`}>{p.minStock}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Expiring Report ───────────────────────────────────────────────────────────

async function ExpiringReport({ tenantId }: { tenantId: string }) {
  const batches = await getExpiringReport(tenantId, 90);

  const expired = batches.filter(b => new Date(b.expiryDate) < new Date());
  const days30  = batches.filter(b => {
    const d = new Date(b.expiryDate);
    const now = new Date();
    return d >= now && d <= new Date(Date.now() + 30 * 86400000);
  });
  const days90  = batches.filter(b => {
    const d = new Date(b.expiryDate);
    const now = new Date(Date.now() + 30 * 86400000);
    return d > now;
  });

  const COL = {
    product: "w-auto px-4 py-3",
    batch:   "w-36   px-4 py-3",
    expiry:  "w-36   px-4 py-3",
    days:    "w-28   px-4 py-3 text-right",
    qty:     "w-24   px-4 py-3 text-right",
    warehouse:"w-36  px-4 py-3",
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="bg-blaze-orange/10 rounded-[8px] px-4 py-3 flex-1">
          <p className="text-[11px] text-blaze-orange uppercase tracking-wide">Vencidos</p>
          <p className="text-[24px] font-medium text-blaze-orange tabular-nums">{expired.length}</p>
        </div>
        <div className="bg-blaze-orange/10 rounded-[8px] px-4 py-3 flex-1">
          <p className="text-[11px] text-blaze-orange uppercase tracking-wide">En 30 días</p>
          <p className="text-[24px] font-medium text-blaze-orange tabular-nums">{days30.length}</p>
        </div>
        <div className="bg-sunbeam-yellow/10 rounded-[8px] px-4 py-3 flex-1">
          <p className="text-[11px] text-sunbeam-yellow uppercase tracking-wide">En 31–90 días</p>
          <p className="text-[24px] font-medium text-sunbeam-yellow tabular-nums">{days90.length}</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <p className="text-[13px] text-slate-gray py-8 text-center">Sin lotes próximos a vencer en 90 días</p>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#222120]">
                <th className={`${COL.product}   text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Producto</th>
                <th className={`${COL.batch}     text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Lote</th>
                <th className={`${COL.expiry}    text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Vencimiento</th>
                <th className={`${COL.days}      text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Días</th>
                <th className={`${COL.qty}       text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Stock</th>
                <th className={`${COL.warehouse} text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide`}>Almacén</th>
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {batches.map(b => {
                const days    = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                const expired = days <= 0;
                const warn30  = days > 0 && days <= 30;
                return (
                  <tr key={b.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className={COL.product}>
                      <p className="text-[13px] text-pure-white font-medium">{b.product.genericName}</p>
                      {b.product.commercialName && <p className="text-[11px] text-slate-gray">{b.product.commercialName}</p>}
                    </td>
                    <td className={`${COL.batch} font-mono text-[12px] text-slate-gray`}>{b.batchNumber}</td>
                    <td className={`${COL.expiry} text-[12px] ${expired || warn30 ? "text-blaze-orange" : "text-sunbeam-yellow"}`}>
                      {new Date(b.expiryDate).toLocaleDateString("es-HN")}
                    </td>
                    <td className={`${COL.days} text-[13px] font-medium tabular-nums ${expired || warn30 ? "text-blaze-orange" : "text-sunbeam-yellow"}`}>
                      {expired ? "Vencido" : `${days}d`}
                    </td>
                    <td className={`${COL.qty} text-[13px] text-pure-white tabular-nums`}>
                      {b.currentQty} {b.product.unit ?? ""}
                    </td>
                    <td className={`${COL.warehouse} text-[12px] text-slate-gray`}>{b.warehouse.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Consumption Report ────────────────────────────────────────────────────────

async function ConsumptionReport({ tenantId, start, end }: { tenantId: string; start: Date; end: Date }) {
  const items = await getConsumptionReport(tenantId, start, end);
  const total = items.reduce((s, i) => s + i.totalQty, 0);

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-gray">
        {items.length} productos dispensados · {total} unidades totales
      </p>
      {items.length === 0 ? (
        <p className="text-[13px] text-slate-gray py-8 text-center">Sin dispensaciones este mes</p>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#222120]">
                <th className="w-8 px-4 py-3 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">#</th>
                <th className="w-auto px-4 py-3 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Medicamento</th>
                <th className="w-32 px-4 py-3 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Categoría</th>
                <th className="w-28 px-4 py-3 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Unidades</th>
                <th className="w-28 px-4 py-3 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">% del total</th>
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {items.map((item, idx) => {
                const pct = total > 0 ? ((item.totalQty / total) * 100).toFixed(1) : "0";
                return (
                  <tr key={item.productId} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 text-[12px] text-iron-gray tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-pure-white font-medium">{item.genericName}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-gray">
                      {item.category === "MEDICAMENTO" ? "Medicamento" : item.category === "INSUMO_DESCARTABLE" ? "Insumo" : "Equipo"}
                    </td>
                    <td className="px-4 py-3 text-right text-[14px] font-medium text-pure-white tabular-nums">
                      {item.totalQty} {item.unit ?? ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-[#222120] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-sunbeam-yellow rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-slate-gray tabular-nums w-10 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Appointments Report ───────────────────────────────────────────────────────

async function AppointmentsReport({ tenantId, start, end }: { tenantId: string; start: Date; end: Date }) {
  const report = await getAppointmentReport(tenantId, start, end);

  const STATUS_LABEL: Record<string, string> = {
    PROGRAMADA: "Programada", CONFIRMADA: "Confirmada", EN_CONSULTA: "En consulta",
    COMPLETADA: "Completada", CANCELADA: "Cancelada", NO_ASISTIO: "No asistió",
  };
  const TYPE_LABEL: Record<string, string> = {
    PRIMERA_VEZ: "Primera vez", CONTROL: "Control", URGENCIA: "Urgencia", SEGUIMIENTO: "Seguimiento",
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-gray">{report.total} citas en el mes</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
          <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Por estado</h3>
          {report.byStatus.length === 0 ? (
            <p className="text-[12px] text-iron-gray">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {report.byStatus.map(r => (
                <div key={r.status} className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-gray">{STATUS_LABEL[r.status] ?? r.status}</span>
                  <span className="text-[14px] font-medium text-pure-white tabular-nums">{r._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-ash-gray rounded-[12px] p-5 space-y-3">
          <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Por tipo</h3>
          {report.byType.length === 0 ? (
            <p className="text-[12px] text-iron-gray">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {report.byType.map(r => (
                <div key={r.type} className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-gray">{TYPE_LABEL[r.type] ?? r.type}</span>
                  <span className="text-[14px] font-medium text-pure-white tabular-nums">{r._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Morbidity Report ──────────────────────────────────────────────────────────

async function MorbidityReport({ tenantId, start, end }: { tenantId: string; start: Date; end: Date }) {
  const diagnoses = await getMorbidityReport(tenantId, start, end);
  const total = diagnoses.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-gray">
        {diagnoses.length} diagnósticos distintos · {total} casos en el mes
      </p>
      {diagnoses.length === 0 ? (
        <p className="text-[13px] text-slate-gray py-8 text-center">Sin diagnósticos registrados este mes</p>
      ) : (
        <div className="rounded-[12px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#222120]">
                <th className="w-8 px-4 py-3 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">#</th>
                <th className="w-24 px-4 py-3 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Código</th>
                <th className="w-auto px-4 py-3 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Diagnóstico</th>
                <th className="w-24 px-4 py-3 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Casos</th>
                <th className="w-32 px-4 py-3 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Frecuencia</th>
              </tr>
            </thead>
            <tbody className="bg-ash-gray">
              {diagnoses.map((d, idx) => {
                const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : "0";
                return (
                  <tr key={d.code} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-4 py-3 text-[12px] text-iron-gray tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-sunbeam-yellow">{d.code}</td>
                    <td className="px-4 py-3 text-[13px] text-pure-white">{d.description}</td>
                    <td className="px-4 py-3 text-right text-[14px] font-medium text-pure-white tabular-nums">{d.count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-[#222120] rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-deep-sea-blue rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[12px] text-slate-gray tabular-nums w-10 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
