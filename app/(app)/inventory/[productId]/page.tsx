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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="text-slate-gray hover:text-pure-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-[8px] bg-ash-gray flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-gray" />
          </div>
          <div>
            <h2
              className="text-[22px] font-medium text-pure-white"
              style={{ fontFeatureSettings: '"ss01"' }}
            >
              {product.genericName}
            </h2>
            {product.commercialName && (
              <p className="text-slate-gray text-[13px]">{product.commercialName}</p>
            )}
          </div>
        </div>
        <Link href={`/inventory/${productId}/edit`}>
          <Button variant="secondary" size="sm">
            <Edit className="w-3.5 h-3.5" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Product info */}
      <div className="bg-ash-gray rounded-[12px] p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <InfoItem label="Categoría">
            <Badge variant="info">{CATEGORY_LABEL[product.category]}</Badge>
          </InfoItem>
          <InfoItem label="Forma">
            {product.form ?? "—"}
          </InfoItem>
          <InfoItem label="Concentración">
            {product.concentration ?? "—"}
          </InfoItem>
          <InfoItem label="Unidad">
            {product.unit ?? "—"}
          </InfoItem>
          <InfoItem label="Fuente">
            <Badge variant={product.defaultSource === "IHSS" ? "warning" : "muted"}>
              {product.defaultSource}
            </Badge>
          </InfoItem>
          <InfoItem label="Receta">
            {product.requiresPrescription ? (
              <span className="text-sunbeam-yellow text-[13px]">Requerida</span>
            ) : (
              <span className="text-slate-gray text-[13px]">No requerida</span>
            )}
          </InfoItem>
        </div>
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-ash-gray rounded-[12px] p-4 text-center">
          <p className="text-[11px] text-slate-gray uppercase tracking-wide mb-1">Stock total</p>
          <p
            className={`text-[32px] font-medium ${isLow ? "text-blaze-orange" : "text-pure-white"}`}
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            {totalStock}
          </p>
          {product.unit && <p className="text-[12px] text-slate-gray">{product.unit}s</p>}
        </div>
        <div className="bg-ash-gray rounded-[12px] p-4 text-center">
          <p className="text-[11px] text-slate-gray uppercase tracking-wide mb-1">Stock mínimo</p>
          <p
            className="text-[32px] font-medium text-pure-white"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            {product.minStock}
          </p>
        </div>
        <div className="bg-ash-gray rounded-[12px] p-4 text-center">
          <p className="text-[11px] text-slate-gray uppercase tracking-wide mb-1">Lotes activos</p>
          <p
            className="text-[32px] font-medium text-pure-white"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            {batches.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <div className="flex border-b border-iron-gray/40">
          <TabLink
            href={`/inventory/${productId}?tab=batches`}
            active={tab === "batches"}
          >
            Lotes ({batches.length})
          </TabLink>
          <TabLink
            href={`/inventory/${productId}?tab=kardex`}
            active={tab === "kardex"}
          >
            Kardex ({movements.length})
          </TabLink>
        </div>
        <div className="p-4 overflow-x-auto">
          {tab === "batches" ? (
            <BatchList batches={batches} tenantId={tenantId} productId={productId} />
          ) : (
            <KardexTable movements={movements} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-gray uppercase tracking-wide">{label}</span>
      <span className="text-[13px] text-pure-white">{children}</span>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-5 py-3 text-[13px] font-medium transition-colors border-b-2 ${
        active
          ? "text-sunbeam-yellow border-sunbeam-yellow"
          : "text-slate-gray border-transparent hover:text-pure-white"
      }`}
    >
      {children}
    </Link>
  );
}
