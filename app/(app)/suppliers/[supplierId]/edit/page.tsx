import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getSupplier } from "@/lib/actions/suppliers";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = await params;
  const { tenantId }   = await getTenantFromHeaders();
  if (!tenantId) return null;

  const supplier = await getSupplier(tenantId, supplierId);
  if (!supplier) notFound();

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Editar proveedor</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">{supplier.name}</p>
        </div>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <SupplierForm
          tenantId={tenantId}
          supplierId={supplierId}
          defaultValues={{
            name:    supplier.name,
            rtn:     supplier.rtn    ?? undefined,
            contact: supplier.contact ?? undefined,
            phone:   supplier.phone  ?? undefined,
            email:   supplier.email  ?? undefined,
            address: supplier.address ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
