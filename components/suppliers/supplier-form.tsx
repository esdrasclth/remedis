"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import type { SupplierInput } from "@/lib/validations/suppliers";

interface Props {
  tenantId: string;
  supplierId?: string;
  defaultValues?: Partial<SupplierInput>;
}

export function SupplierForm({ tenantId, supplierId, defaultValues = {} }: Props) {
  const router = useRouter();
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: SupplierInput = {
      name:    fd.get("name")    as string,
      rtn:     (fd.get("rtn")     as string) || undefined,
      contact: (fd.get("contact") as string) || undefined,
      phone:   (fd.get("phone")   as string) || undefined,
      email:   (fd.get("email")   as string) || undefined,
      address: (fd.get("address") as string) || undefined,
    };

    setLoading(true);
    setError("");
    const result = supplierId
      ? await updateSupplier(tenantId, supplierId, data)
      : await createSupplier(tenantId, data);
    setLoading(false);

    if (!result.success) { setError(result.error); return; }
    router.push("/suppliers");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Información general</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input name="name" label="Razón social" required defaultValue={defaultValues.name} />
          </div>
          <Input name="rtn" label="RTN" placeholder="0000-0000-000000" defaultValue={defaultValues.rtn} />
          <Input name="contact" label="Persona de contacto" defaultValue={defaultValues.contact} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input name="phone" label="Teléfono" defaultValue={defaultValues.phone} />
          <Input name="email" label="Correo electrónico" type="email" defaultValue={defaultValues.email} />
        </div>
        <Textarea name="address" label="Dirección" rows={2} defaultValue={defaultValues.address} />
      </section>

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={loading}>
          {loading ? "Guardando..." : supplierId ? "Guardar cambios" : "Registrar proveedor"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
