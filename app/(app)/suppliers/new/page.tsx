import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default async function NewSupplierPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Nuevo proveedor</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">Registra un proveedor de medicamentos o insumos</p>
        </div>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <SupplierForm tenantId={tenantId} />
      </div>
    </div>
  );
}
