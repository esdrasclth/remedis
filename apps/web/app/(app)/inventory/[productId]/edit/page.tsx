import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getProduct } from "@/lib/actions/inventory";
import { ProductForm } from "@/components/inventory/product-form";

interface Props {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { productId } = await params;
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const product = await getProduct(tenantId, productId);
  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
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
            Editar producto
          </h2>
          <p className="text-slate-gray text-[13px] mt-1">{product.genericName}</p>
        </div>
      </div>

      <ProductForm
        tenantId={tenantId}
        initial={{
          id: product.id,
          genericName: product.genericName,
          commercialName: product.commercialName ?? undefined,
          category: product.category,
          form: product.form ?? undefined,
          concentration: product.concentration ?? undefined,
          unit: product.unit ?? undefined,
          requiresPrescription: product.requiresPrescription,
          defaultSource: product.defaultSource,
          minStock: product.minStock,
        }}
      />
    </div>
  );
}
