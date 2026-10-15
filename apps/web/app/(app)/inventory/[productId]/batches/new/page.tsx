import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getProduct, getWarehouses } from "@/lib/actions/inventory";
import { BatchForm } from "@/components/inventory/batch-form";

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function NewBatchPage({ params }: Props) {
  const { productId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const [product, warehouses] = await Promise.all([
    getProduct(tenantId, productId),
    getWarehouses(tenantId),
  ]);

  if (!product) notFound();

  if (warehouses.length === 0) {
    return (
      <div className="space-y-4 max-w-xl">
        <div className="bg-blaze-orange/10 border border-blaze-orange/30 rounded-[12px] p-5">
          <p className="text-blaze-orange text-[14px]">
            No hay almacenes configurados para este tenant. Contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/inventory/${productId}`}
          className="text-slate-gray hover:text-pure-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2
            className="text-[24px] font-medium text-pure-white"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            Registrar ingreso de lote
          </h2>
          <p className="text-slate-gray text-[13px] mt-1">{product.genericName}</p>
        </div>
      </div>

      <BatchForm
        tenantId={tenantId}
        productId={productId}
        warehouses={warehouses.map((w) => ({
          id: w.id,
          name: w.name,
          source: w.source,
        }))}
      />
    </div>
  );
}
