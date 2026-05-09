"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { adjustStock, adjustmentSchema, type AdjustmentInput } from "@/lib/actions/inventory";
import type { getBatches } from "@/lib/actions/inventory";

type Batch = Awaited<ReturnType<typeof getBatches>>[number];

interface AdjustmentModalProps {
  batch: Batch;
  tenantId: string;
  productId: string;
  onClose: () => void;
}

export function AdjustmentModal({ batch, tenantId, productId, onClose }: AdjustmentModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema) as Resolver<AdjustmentInput>,
    defaultValues: {
      batchId: batch.id,
      newQty: batch.currentQty,
      reason: "",
    },
  });

  async function onSubmit(data: AdjustmentInput) {
    setServerError(null);
    const result = await adjustStock(tenantId, productId, data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-ash-gray rounded-[12px] w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-iron-gray/40">
          <div>
            <h2 className="text-[15px] font-medium text-pure-white">Ajuste de stock</h2>
            <p className="text-[12px] text-slate-gray mt-0.5">Lote {batch.batchNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-gray hover:text-pure-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current stock info */}
        <div className="px-5 py-3 bg-ocean-abyss/60 flex items-center justify-between">
          <span className="text-[12px] text-slate-gray">Stock actual</span>
          <span
            className="text-[20px] font-medium text-pure-white"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            {batch.currentQty}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <input type="hidden" {...register("batchId")} />

          <Input
            id="newQty"
            label="Nueva cantidad *"
            type="number"
            min="0"
            error={errors.newQty?.message}
            {...register("newQty")}
          />

          <Textarea
            id="reason"
            label="Motivo del ajuste *"
            placeholder="Ej: Conteo físico, diferencia en inventario..."
            rows={3}
            error={errors.reason?.message}
            {...register("reason")}
          />

          {serverError && (
            <p className="text-[12px] text-blaze-orange">{serverError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Guardando..." : "Confirmar ajuste"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
