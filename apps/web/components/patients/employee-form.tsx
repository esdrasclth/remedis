"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createEmployee, updateEmployee } from "@/lib/actions/patients";
import type { EmployeeInput } from "@/lib/validations/patients";

const BLOOD_TYPES: { value: string; label: string }[] = [
  { value: "A_POSITIVE",  label: "A+" },
  { value: "A_NEGATIVE",  label: "A-" },
  { value: "B_POSITIVE",  label: "B+" },
  { value: "B_NEGATIVE",  label: "B-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_POSITIVE",  label: "O+" },
  { value: "O_NEGATIVE",  label: "O-" },
];

interface Props {
  tenantId: string;
  employeeId?: string;
  clinicType?: "EMPRESA" | "PRIVADA";
  defaultValues?: Partial<EmployeeInput> & {
    medicalHistory?: {
      bloodType?: string | null;
      allergies?: string[];
      chronicConditions?: string[];
    } | null;
  };
}

export function EmployeeForm({ tenantId, employeeId, clinicType = "EMPRESA", defaultValues = {} }: Props) {
  const isPrivada = clinicType === "PRIVADA";
  const router  = useRouter();
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Medical history state
  const [bloodType,         setBloodType]         = useState(defaultValues.medicalHistory?.bloodType ?? "");
  const [allergies,         setAllergies]         = useState<string[]>(defaultValues.medicalHistory?.allergies ?? []);
  const [allergyInput,      setAllergyInput]      = useState("");
  const [conditions,        setConditions]        = useState<string[]>(defaultValues.medicalHistory?.chronicConditions ?? []);
  const [conditionInput,    setConditionInput]    = useState("");

  function addTag(list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) {
    const val = input.trim();
    if (val && !list.includes(val)) setList([...list, val]);
    setInput("");
  }

  function removeTag(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: EmployeeInput = {
      employeeNumber:    fd.get("employeeNumber") as string,
      firstName:         fd.get("firstName")      as string,
      lastName:          fd.get("lastName")       as string,
      gender:            (fd.get("gender") as "MASCULINO" | "FEMENINO" | "OTRO" | "") || undefined,
      birthDate:         (fd.get("birthDate") as string) || undefined,
      phone:             (fd.get("phone") as string) || undefined,
      email:             (fd.get("email") as string) || undefined,
      department:        (fd.get("department") as string) || undefined,
      position:          (fd.get("position") as string) || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bloodType:         (bloodType || undefined) as any,
      allergies,
      chronicConditions: conditions,
    };

    setLoading(true);
    setError("");
    const result = employeeId
      ? await updateEmployee(tenantId, employeeId, data)
      : await createEmployee(tenantId, data);
    setLoading(false);

    if (!result.success) { setError(result.error); return; }

    if (!employeeId) {
      router.push(`/patients/${(result.data as { id: string }).id}`);
    } else {
      router.push(`/patients/${employeeId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identificación */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Identificación</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            name="employeeNumber"
            label={isPrivada ? "N° Expediente" : "N° Empleado"}
            required
            defaultValue={defaultValues.employeeNumber}
          />
          <Input name="firstName"      label="Nombre"      required defaultValue={defaultValues.firstName} />
          <Input name="lastName"       label="Apellido"    required defaultValue={defaultValues.lastName} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select name="gender" label="Género" defaultValue={defaultValues.gender ?? ""}>
            <option value="">Sin especificar</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
            <option value="OTRO">Otro</option>
          </Select>
          <Input name="birthDate" label="Fecha de nacimiento" type="date" defaultValue={defaultValues.birthDate} />
          <Input name="phone"     label="Teléfono"            defaultValue={defaultValues.phone} />
        </div>
        <Input name="email" label="Correo electrónico" type="email" defaultValue={defaultValues.email} />
      </section>

      {/* Información laboral — solo para clínicas de empresa */}
      {!isPrivada && (
        <section className="space-y-4">
          <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Información laboral</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input name="department" label="Departamento" defaultValue={defaultValues.department} />
            <Input name="position"   label="Cargo"        defaultValue={defaultValues.position} />
          </div>
        </section>
      )}

      {/* Antecedentes médicos */}
      <section className="space-y-4">
        <h3 className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">Antecedentes médicos</h3>
        <div className="max-w-xs">
          <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">
            Tipo de sangre
          </label>
          <select
            value={bloodType}
            onChange={e => setBloodType(e.target.value)}
            className="w-full bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white focus:outline-none focus:border-iron-gray"
          >
            <option value="">— Sin especificar —</option>
            {BLOOD_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
          </select>
        </div>

        {/* Alergias */}
        <div>
          <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">Alergias</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {allergies.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blaze-orange/20 text-blaze-orange text-[12px] rounded-[4px]">
                {a}
                <button type="button" onClick={() => removeTag(allergies, setAllergies, i)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(allergies, setAllergies, allergyInput, setAllergyInput); }}}
              placeholder="Ej: Penicilina — presiona Enter para agregar"
              className="flex-1 bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none focus:border-iron-gray"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => addTag(allergies, setAllergies, allergyInput, setAllergyInput)}>
              Agregar
            </Button>
          </div>
        </div>

        {/* Condiciones crónicas */}
        <div>
          <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">Enfermedades crónicas</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {conditions.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sunbeam-yellow/20 text-sunbeam-yellow text-[12px] rounded-[4px]">
                {c}
                <button type="button" onClick={() => removeTag(conditions, setConditions, i)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={conditionInput}
              onChange={e => setConditionInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(conditions, setConditions, conditionInput, setConditionInput); }}}
              placeholder="Ej: Diabetes tipo 2 — presiona Enter para agregar"
              className="flex-1 bg-input-bg border border-iron-gray/40 rounded-[10px] px-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none focus:border-iron-gray"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => addTag(conditions, setConditions, conditionInput, setConditionInput)}>
              Agregar
            </Button>
          </div>
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
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
