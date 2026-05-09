import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTenantFromHeaders } from "@/lib/tenant";
import { ProductForm } from "@/components/inventory/product-form";

export default async function NewProductPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/inventory"
          className="text-slate-gray hover:text-pure-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2
            className="text-[24px] font-medium text-pure-white"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            Nuevo producto
          </h2>
          <p className="text-slate-gray text-[13px] mt-1">
            Agrega un medicamento o insumo al catálogo
          </p>
        </div>
      </div>

      <ProductForm tenantId={tenantId} />
    </div>
  );
}
