"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createProduct, updateProduct } from "@/lib/actions/inventory";
import { productSchema, type ProductInput } from "@/lib/validations/inventory";

const FORMS = ["Tableta", "Cápsula", "Jarabe", "Inyectable", "Crema", "Gel", "Supositorio", "Ampolla", "Parche", "Otro"];
const UNITS = ["comprimido", "ml", "mg", "unidad", "caja", "frasco", "ampolla", "sobre"];

interface ProductFormProps {
  tenantId: string;
  initial?: Partial<ProductInput> & { id?: string };
}

export function ProductForm({ tenantId, initial }: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!initial?.id;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: {
      genericName: initial?.genericName ?? "",
      commercialName: initial?.commercialName ?? "",
      category: initial?.category ?? "MEDICAMENTO",
      form: initial?.form ?? "",
      concentration: initial?.concentration ?? "",
      unit: initial?.unit ?? "",
      requiresPrescription: initial?.requiresPrescription ?? false,
      defaultSource: initial?.defaultSource ?? "EMPRESA",
      minStock: initial?.minStock ?? 0,
    },
  });

  async function onSubmit(data: ProductInput) {
    setServerError(null);
    const result = isEdit
      ? await updateProduct(tenantId, initial!.id!, data)
      : await createProduct(tenantId, data);
    if (!result.ok) { setServerError(result.error); return; }
    router.push(isEdit ? `/inventory/${initial!.id}` : "/inventory");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Identificación */}
      <FormSection title="Identificación">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="genericName" label="Nombre genérico *" placeholder="Ej: Paracetamol"
            error={errors.genericName?.message} {...register("genericName")} />
          <Input id="commercialName" label="Nombre comercial" placeholder="Ej: Tafirol"
            error={errors.commercialName?.message} {...register("commercialName")} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select id="category" label="Categoría *" error={errors.category?.message} {...register("category")}>
            <option value="MEDICAMENTO">Medicamento</option>
            <option value="INSUMO_DESCARTABLE">Insumo Descartable</option>
            <option value="EQUIPO_MEDICO">Equipo Médico</option>
          </Select>
          <Select id="defaultSource" label="Fuente *" error={errors.defaultSource?.message} {...register("defaultSource")}>
            <option value="EMPRESA">Empresa</option>
            <option value="IHSS">IHSS</option>
          </Select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input type="checkbox" className="w-4 h-4 accent-sunbeam-yellow" {...register("requiresPrescription")} />
          <span className="text-[13px] text-slate-gray">Requiere receta médica</span>
        </label>
      </FormSection>

      {/* Presentación */}
      <FormSection title="Presentación farmacéutica">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select id="form" label="Forma" error={errors.form?.message} {...register("form")}>
            <option value="">— Seleccionar —</option>
            {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Input id="concentration" label="Concentración" placeholder="Ej: 500mg"
            error={errors.concentration?.message} {...register("concentration")} />
          <Select id="unit" label="Unidad" error={errors.unit?.message} {...register("unit")}>
            <option value="">— Seleccionar —</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>
      </FormSection>

      {/* Control de stock */}
      <FormSection title="Control de inventario">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="minStock" label="Stock mínimo (alerta)" type="number" min="0" placeholder="0"
            error={errors.minStock?.message} {...register("minStock")} />
        </div>
        <p className="text-[12px] text-[#5a5854]">
          Se mostrará alerta cuando el stock total sea igual o menor a este valor.
        </p>
      </FormSection>

      {serverError && (
        <div className="bg-[#ff492c]/10 rounded-[8px] px-4 py-3">
          <p className="text-[13px] text-blaze-orange">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
      <h3 className="text-[11px] text-[#5a5854] uppercase tracking-wide font-medium">{title}</h3>
      {children}
    </div>
  );
}
