"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { createDoctor, updateDoctor, toggleDoctorActive } from "@/lib/actions/settings";

type Doctor = {
  id: string;
  name: string | null;
  email: string;
  specialty: string | null;
  licenseNumber: string | null;
  isActive: boolean;
};

interface Props { tenantId: string; doctors: Doctor[] }

type ModalMode = "create" | "edit";

export function DoctorsPanel({ tenantId, doctors: initial }: Props) {
  const router = useRouter();
  const [doctors, setDoctors] = useState(initial);
  const [modal,   setModal]   = useState(false);
  const [mode,    setMode]    = useState<ModalMode>("create");
  const [editId,  setEditId]  = useState<string | null>(null);
  const [busy,    setBusy]    = useState<string | null>(null);

  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [specialty,     setSpecialty]     = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password,      setPassword]      = useState("");
  const [error,         setError]         = useState("");
  const [formBusy,      setFormBusy]      = useState(false);

  function openCreate() {
    setMode("create");
    setName(""); setEmail(""); setSpecialty(""); setLicenseNumber(""); setPassword("");
    setError(""); setModal(true);
  }

  function openEdit(d: Doctor) {
    setMode("edit"); setEditId(d.id);
    setName(d.name ?? ""); setEmail(d.email);
    setSpecialty(d.specialty ?? ""); setLicenseNumber(d.licenseNumber ?? "");
    setPassword("");
    setError(""); setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormBusy(true); setError("");

    const payload = { name, email, specialty, licenseNumber, password: password || undefined };
    const res = mode === "create"
      ? await createDoctor(tenantId, payload)
      : await updateDoctor(tenantId, editId!, payload);

    if (res.success) {
      setModal(false);
      router.refresh();
    } else setError(res.error);
    setFormBusy(false);
  }

  async function handleToggle(d: Doctor) {
    setBusy(d.id);
    const res = await toggleDoctorActive(tenantId, d.id);
    if (res.success) {
      setDoctors(prev => prev.map(x => x.id === d.id ? { ...x, isActive: !x.isActive } : x));
      router.refresh();
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-gray">
          {doctors.length} médico{doctors.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> Nuevo médico
        </Button>
      </div>

      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        {doctors.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-slate-gray">Sin médicos registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-table-header">
                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Médico</th>
                <th className="w-48 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Especialidad</th>
                <th className="w-36 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Colegiado</th>
                <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-pure-white font-medium">{d.name ?? "—"}</p>
                    <p className="text-[11px] text-slate-gray">{d.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-gray">
                    {d.specialty ?? <span className="text-iron-gray">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono text-slate-gray">
                    {d.licenseNumber ?? <span className="text-iron-gray">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.isActive ? "success" : "muted"}>
                      {d.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-iron-gray hover:text-pure-white transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggle(d)}
                        disabled={busy === d.id}
                        className="text-iron-gray hover:text-pure-white transition-colors disabled:opacity-40"
                        title={d.isActive ? "Desactivar" : "Activar"}
                      >
                        {d.isActive
                          ? <UserX className="w-3.5 h-3.5" />
                          : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={mode === "create" ? "Nuevo médico" : "Editar médico"}
          size="sm"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre completo"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={mode === "edit"}
              required
            />
            <Input
              label="Especialidad"
              placeholder="Ej. Medicina General, Cardiología"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
            />
            <Input
              label="Número de colegiado"
              placeholder="Ej. CMH-12345"
              value={licenseNumber}
              onChange={e => setLicenseNumber(e.target.value)}
            />
            <Input
              label={mode === "create" ? "Contraseña" : "Nueva contraseña (dejar vacío para no cambiar)"}
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={mode === "create"}
            />
            {error && <p className="text-[12px] text-blaze-orange">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={formBusy}>
                {formBusy ? "Guardando…" : mode === "create" ? "Crear médico" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
