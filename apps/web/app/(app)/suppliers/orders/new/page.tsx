import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTenantFromHeaders } from "@/lib/tenant";
import { getSuppliers } from "@/lib/actions/suppliers";
import { OrderForm } from "@/components/suppliers/order-form";

export default async function NewOrderPage() {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const suppliers = await getSuppliers(tenantId);

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/suppliers?tab=ordenes" className="text-iron-gray hover:text-pure-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[20px] font-medium text-pure-white">Nueva orden de compra</h1>
          <p className="text-[13px] text-slate-gray mt-0.5">Solicita productos a un proveedor</p>
        </div>
      </div>
      <div className="bg-ash-gray rounded-[12px] p-6">
        <OrderForm tenantId={tenantId} suppliers={suppliers} />
      </div>
    </div>
  );
}
