"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createProduct, updateProduct, productSchema, type ProductInput } from "@/lib/actions/inventory";

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
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

    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(isEdit ? `/inventory/${initial!.id}` : "/inventory");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Section title="Identificación">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="genericName"
            label="Nombre genérico *"
            placeholder="Ej: Paracetamol"
            error={errors.genericName?.message}
            {...register("genericName")}
          />
          <Input
            id="commercialName"
            label="Nombre comercial"
            placeholder="Ej: Tafirol"
            error={errors.commercialName?.message}
            {...register("commercialName")}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            id="category"
            label="Categoría *"
            error={errors.category?.message}
            {...register("category")}
          >
            <option value="MEDICAMENTO">Medicamento</option>
            <option value="INSUMO_DESCARTABLE">Insumo Descartable</option>
            <option value="EQUIPO_MEDICO">Equipo Médico</option>
          </Select>
          <Select
            id="defaultSource"
            label="Fuente *"
            error={errors.defaultSource?.message}
            {...register("defaultSource")}
          >
            <option value="EMPRESA">Empresa</option>
            <option value="IHSS">IHSS</option>
          </Select>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-slate-gray uppercase tracking-wide">
              Requiere receta
            </label>
            <label className="flex items-center gap-3 bg-ocean-abyss border border-iron-gray rounded-[10px] px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-sunbeam-yellow"
                {...register("requiresPrescription")}
              />
              <span className="text-[13px] text-pure-white">Sí, requiere receta médica</span>
            </label>
          </div>
        </div>
      </Section>

      <Section title="Presentación">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            id="form"
            label="Forma farmacéutica"
            error={errors.form?.message}
            {...register("form")}
          >
            <option value="">— Seleccionar —</option>
            {FORMS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </Select>
          <Input
            id="concentration"
            label="Concentración"
            placeholder="Ej: 500mg, 250mg/5ml"
            error={errors.concentration?.message}
            {...register("concentration")}
          />
          <Select
            id="unit"
            label="Unidad de medida"
            error={errors.unit?.message}
            {...register("unit")}
          >
            <option value="">— Seleccionar —</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
        </div>
      </Section>

      <Section title="Control de inventario">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="minStock"
            label="Stock mínimo (alerta)"
            type="number"
            min="0"
            placeholder="0"
            error={errors.minStock?.message}
            {...register("minStock")}
          />
        </div>
        <p className="text-[12px] text-slate-gray">
          Se mostrará una alerta cuando el stock total sea igual o menor a este valor.
        </p>
      </Section>

      {serverError && (
        <div className="bg-blaze-orange/10 border border-blaze-orange/30 rounded-[10px] px-4 py-3">
          <p className="text-[13px] text-blaze-orange">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ash-gray rounded-[12px] p-5 space-y-4">
      <h3 className="text-[12px] text-slate-gray uppercase tracking-wide font-medium">
        {title}
      </h3>
      {children}
    </div>
  );
}
