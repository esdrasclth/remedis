"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createBatch } from "@/lib/actions/inventory";
import { batchSchema, type BatchInput } from "@/lib/validations/inventory";

interface BatchFormProps {
  tenantId: string;
  productId: string;
  warehouses: { id: string; name: string; source: string }[];
}

export function BatchForm({ tenantId, productId, warehouses }: BatchFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BatchInput>({
    resolver: zodResolver(batchSchema) as Resolver<BatchInput>,
    defaultValues: {
      source: "EMPRESA",
      warehouseId: warehouses[0]?.id ?? "",
    },
  });

  async function onSubmit(data: BatchInput) {
    setServerError(null);
    const result = await createBatch(tenantId, productId, data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(`/inventory/${productId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
        <h3 className="text-[12px] text-slate-gray uppercase tracking-wide font-medium">
          Información del lote
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="batchNumber"
            label="Número de lote *"
            placeholder="Ej: LOT-2024-001"
            error={errors.batchNumber?.message}
            {...register("batchNumber")}
          />
          <Input
            id="initialQty"
            label="Cantidad recibida *"
            type="number"
            min="1"
            placeholder="0"
            error={errors.initialQty?.message}
            {...register("initialQty")}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="mfgDate"
            label="Fecha de fabricación"
            type="date"
            error={errors.mfgDate?.message}
            {...register("mfgDate")}
          />
          <Input
            id="expiryDate"
            label="Fecha de vencimiento *"
            type="date"
            error={errors.expiryDate?.message}
            {...register("expiryDate")}
          />
        </div>
      </div>

      <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
        <h3 className="text-[12px] text-slate-gray uppercase tracking-wide font-medium">
          Almacén y fuente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              id="warehouseId"
              label="Almacén de destino *"
              error={errors.warehouseId?.message}
              {...register("warehouseId")}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.source})
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-iron-gray mt-1.5">
              Ubicación física donde se almacenará este lote (bodega, farmacia, etc.).
            </p>
          </div>
          <div>
            <Select
              id="source"
              label="Fuente del medicamento *"
              error={errors.source?.message}
              {...register("source")}
            >
              <option value="EMPRESA">Empresa</option>
              <option value="IHSS">IHSS</option>
            </Select>
            <p className="text-[11px] text-iron-gray mt-1.5">
              Presupuesto que financia este medicamento: Empresa (compra directa) o IHSS (seguro social).
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="bg-blaze-orange/10 rounded-[10px] px-4 py-3">
          <p className="text-[13px] text-blaze-orange">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar ingreso"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
