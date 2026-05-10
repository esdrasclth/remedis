"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createEmployee, updateEmployee } from "@/lib/actions/patients";
import type { EmployeeInput } from "@/lib/validations/patients";

interface Props {
  tenantId: string;
  employeeId?: string;
  defaultValues?: Partial<EmployeeInput>;
}

export function EmployeeForm({ tenantId, employeeId, defaultValues = {} }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: EmployeeInput = {
      employeeNumber: fd.get("employeeNumber") as string,
      firstName:      fd.get("firstName")      as string,
      lastName:       fd.get("lastName")       as string,
      gender:         (fd.get("gender") as "MASCULINO" | "FEMENINO" | "OTRO" | "") || undefined,
      birthDate:      (fd.get("birthDate") as string) || undefined,
      phone:          (fd.get("phone") as string) || undefined,
      email:          (fd.get("email") as string) || undefined,
      department:     (fd.get("department") as string) || undefined,
      position:       (fd.get("position") as string) || undefined,
    };

    setLoading(true);
    setError("");
    const result = employeeId
      ? await updateEmployee(tenantId, employeeId, data)
      : await createEmployee(tenantId, data);
    setLoading(false);

    if (!result.success) { setError(result.error); return; }

    if (!employeeId && result.success) {
      router.push(`/patients/${(result.data as { id: string }).id}`);
    } else {
      router.push(`/patients/${employeeId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">
          Identificación
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            name="employeeNumber" label="N° Empleado" required
            defaultValue={defaultValues.employeeNumber}
          />
          <Input
            name="firstName" label="Nombre" required
            defaultValue={defaultValues.firstName}
          />
          <Input
            name="lastName" label="Apellido" required
            defaultValue={defaultValues.lastName}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select name="gender" label="Género" defaultValue={defaultValues.gender ?? ""}>
            <option value="">Sin especificar</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </Select>
          <Input
            name="birthDate" label="Fecha de nacimiento" type="date"
            defaultValue={defaultValues.birthDate}
          />
          <Input
            name="phone" label="Teléfono"
            defaultValue={defaultValues.phone}
          />
        </div>
        <Input
          name="email" label="Correo electrónico" type="email"
          defaultValue={defaultValues.email}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">
          Información laboral
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            name="department" label="Departamento"
            defaultValue={defaultValues.department}
          />
          <Input
            name="position" label="Cargo"
            defaultValue={defaultValues.position}
          />
        </div>
      </section>

      {error && (
        <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
          <p className="text-[13px] text-blaze-orange">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" size="md" disabled={loading}>
          {loading ? "Guardando..." : employeeId ? "Guardar cambios" : "Registrar paciente"}
        </Button>
        <Button
          type="button" variant="ghost" size="md"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
