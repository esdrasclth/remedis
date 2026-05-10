"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, UserX, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { inviteUser, updateUserRole, toggleUserActive } from "@/lib/actions/settings";

type User = {
  id: string; name: string | null; email: string;
  role: string; isActive: boolean; createdAt: Date;
};

interface Props { tenantId: string; users: User[] }

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:   "Super Admin",
  ADMIN_CLINICA: "Admin Clínica",
  MEDICO:        "Médico",
  ENFERMERA:     "Enfermera",
  FARMACEUTICO:  "Farmacéutico",
  RRHH:          "RRHH",
  AUDITOR:       "Auditor",
  RECEPCIONISTA: "Recepcionista",
};

const ROLES = [
  "ADMIN_CLINICA","MEDICO","ENFERMERA","FARMACEUTICO","RRHH","AUDITOR","RECEPCIONISTA",
] as const;

export function UsersPanel({ tenantId, users: initial }: Props) {
  const router  = useRouter();
  const [users, setUsers]     = useState(initial);

  useEffect(() => { setUsers(initial); }, [initial]);
  const [modal, setModal]     = useState(false);
  const [busy,  setBusy]      = useState<string | null>(null);
  const [error, setError]     = useState("");

  // invite form state
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [role,     setRole]     = useState<string>("RECEPCIONISTA");
  const [password, setPassword] = useState("");
  const [invErr,   setInvErr]   = useState("");
  const [invBusy,  setInvBusy]  = useState(false);

  async function handleRoleChange(userId: string, newRole: string) {
    setBusy(userId);
    const res = await updateUserRole(tenantId, userId, newRole);
    if (res.success) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x));
      router.refresh();
    } else setError(res.error);
    setBusy(null);
  }

  async function handleToggle(userId: string) {
    setBusy(userId + "_toggle");
    const res = await toggleUserActive(tenantId, userId);
    if (res.success) {
      setUsers(u => u.map(x => x.id === userId ? { ...x, isActive: !x.isActive } : x));
      router.refresh();
    } else setError(res.error);
    setBusy(null);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInvBusy(true); setInvErr("");
    const res = await inviteUser(tenantId, { name, email, role, password });
    if (res.success) {
      setModal(false);
      setName(""); setEmail(""); setPassword(""); setRole("RECEPCIONISTA");
      router.refresh();
    } else setInvErr(res.error);
    setInvBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-gray">{users.length} usuario{users.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setModal(true)}>
          <UserPlus className="w-3.5 h-3.5" /> Invitar usuario
        </Button>
      </div>

      {error && <p className="text-[12px] text-blaze-orange">{error}</p>}

      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#222120]">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Usuario</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Rol</th>
              <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
              <th className="w-24 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-[13px] text-pure-white font-medium">{u.name ?? "—"}</p>
                  <p className="text-[11px] text-slate-gray">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  {u.role === "SUPER_ADMIN" ? (
                    <span className="text-[12px] text-sunbeam-yellow font-medium">Super Admin</span>
                  ) : (
                    <div className="relative w-44">
                      <select
                        value={u.role}
                        disabled={!!busy}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="w-full appearance-none bg-[#222120] border border-iron-gray/40 rounded-[8px] px-3 py-1.5 text-[12px] text-pure-white pr-7 cursor-pointer focus:outline-none focus:border-iron-gray disabled:opacity-50"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-iron-gray pointer-events-none" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? "success" : "muted"}>
                    {u.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== "SUPER_ADMIN" && (
                    <button
                      onClick={() => handleToggle(u.id)}
                      disabled={busy === u.id + "_toggle"}
                      className="text-iron-gray hover:text-pure-white transition-colors disabled:opacity-40"
                      title={u.isActive ? "Desactivar" : "Activar"}
                    >
                      {u.isActive
                        ? <UserX className="w-4 h-4" />
                        : <UserCheck className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {modal && <Modal onClose={() => setModal(false)} title="Invitar usuario" size="sm">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label="Nombre completo" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div>
            <label className="block text-[11px] font-medium text-slate-gray uppercase tracking-wide mb-1.5">Rol</label>
            <div className="relative">
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full appearance-none bg-[#2a2825] border border-iron-gray/40 rounded-[10px] px-3 py-2.5 text-[13px] text-pure-white pr-8 focus:outline-none focus:border-iron-gray"
              >
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray pointer-events-none" />
            </div>
          </div>
          <Input
            label="Contraseña temporal"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {invErr && <p className="text-[12px] text-blaze-orange">{invErr}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={invBusy}>
              {invBusy ? "Creando…" : "Crear usuario"}
            </Button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
