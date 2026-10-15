import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Package, Plus } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getProduct, getBatches, getKardex } from "@/lib/actions/inventory";
import { BatchList } from "@/components/inventory/batch-list";
import { KardexTable } from "@/components/inventory/kardex-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY_LABEL: Record<string, string> = {
  MEDICAMENTO: "Medicamento",
  INSUMO_DESCARTABLE: "Insumo Descartable",
  EQUIPO_MEDICO: "Equipo Médico",
};

interface Props {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const { tab = "batches" } = await searchParams;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const product = await getProduct(tenantId, productId);
  if (!product) notFound();

  const [batches, movements] = await Promise.all([
    getBatches(tenantId, productId),
    getKardex(tenantId, productId),
  ]);

  const totalStock = batches.reduce((s, b) => s + b.currentQty, 0);
  const isLow = totalStock <= product.minStock;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="text-iron-gray hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-[8px] bg-ash-gray flex items-center justify-center">
            <Package className="w-4 h-4 text-iron-gray" />
          </div>
          <div>
            <h2 className="text-[20px] font-medium text-pure-white leading-tight">{product.genericName}</h2>
            {product.commercialName && (
              <p className="text-[12px] text-slate-gray">{product.commercialName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/inventory/${productId}/batches/new`}>
            <Button size="sm"><Plus className="w-3.5 h-3.5" /> Ingresar lote</Button>
          </Link>
          <Link href={`/inventory/${productId}/edit`}>
            <Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5" /> Editar</Button>
          </Link>
        </div>
      </div>

      {/* Info row */}
      <div className="bg-ash-gray rounded-[12px] px-5 py-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-3">
          <InfoItem label="Categoría">
            <Badge variant="info">{CATEGORY_LABEL[product.category]}</Badge>
          </InfoItem>
          <InfoItem label="Forma">{product.form ?? "—"}</InfoItem>
          <InfoItem label="Concentración">{product.concentration ?? "—"}</InfoItem>
          <InfoItem label="Unidad">{product.unit ?? "—"}</InfoItem>
          <InfoItem label="Fuente">
            <Badge variant={product.defaultSource === "IHSS" ? "warning" : "muted"}>
              {product.defaultSource === "IHSS" ? "Seguro Social" : "Empresa"}
            </Badge>
          </InfoItem>
          <InfoItem label="Receta">
            {product.requiresPrescription
              ? <span className="text-sunbeam-yellow text-[12px]">Requerida</span>
              : <span className="text-iron-gray text-[12px]">No requerida</span>}
          </InfoItem>
        </div>
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Stock total", value: totalStock, unit: product.unit, alert: isLow },
          { label: "Stock mínimo", value: product.minStock, unit: product.unit },
          { label: "Lotes activos", value: batches.length },
        ].map((item) => (
          <div key={item.label} className="bg-ash-gray rounded-[12px] px-5 py-4 text-center">
            <p className="text-[11px] text-iron-gray uppercase tracking-wide mb-1.5">{item.label}</p>
            <p className={`text-[32px] font-medium leading-none ${item.alert ? "text-blaze-orange" : "text-pure-white"}`}>
              {item.value}
            </p>
            {item.unit && <p className="text-[11px] text-iron-gray mt-1">{item.unit}s</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <div className="flex">
          <TabLink href={`/inventory/${productId}?tab=batches`} active={tab === "batches"}>
            Lotes ({batches.length})
          </TabLink>
          <TabLink href={`/inventory/${productId}?tab=kardex`} active={tab === "kardex"}>
            Kardex ({movements.length})
          </TabLink>
        </div>
        <div className="overflow-x-auto">
          {tab === "batches"
            ? <BatchList batches={batches} tenantId={tenantId} productId={productId} />
            : <KardexTable movements={movements} />}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-iron-gray uppercase tracking-wide">{label}</span>
      <span className="text-[13px] text-pure-white">{children}</span>
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        "px-5 py-3 text-[13px] font-medium transition-colors",
        active
          ? "text-sunbeam-yellow"
          : "text-iron-gray hover:text-slate-gray",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
