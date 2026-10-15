import Link from "next/link";
import { Users } from "lucide-react";
import { getAllUsers } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN_CLINICA: "Admin Clínica", MEDICO: "Médico",
  ENFERMERA: "Enfermera", FARMACEUTICO: "Farmacéutico", RRHH: "RRHH",
  AUDITOR: "Auditor", RECEPCIONISTA: "Recepcionista",
};
const ROLE_VARIANT: Record<string, "warning" | "info" | "success" | "muted"> = {
  SUPER_ADMIN:   "warning",
  ADMIN_CLINICA: "info",
  MEDICO:        "success",
  ENFERMERA:     "success",
  FARMACEUTICO:  "info",
  RRHH:          "muted",
  AUDITOR:       "muted",
  RECEPCIONISTA: "muted",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await getAllUsers(q);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-iron-gray" />
          <div>
            <h1 className="text-[20px] font-medium text-pure-white">Usuarios</h1>
            <p className="text-[13px] text-slate-gray mt-0.5">{users.length} usuarios en todos los tenants</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <form method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o email…"
          className="w-full max-w-sm bg-ash-gray border border-white/[0.06] rounded-[10px] px-4 py-2.5 text-[13px] text-pure-white placeholder:text-iron-gray outline-none focus:border-iron-gray/60 transition-colors"
        />
      </form>

      {/* Table */}
      <div className="bg-ash-gray rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Usuario</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Tenant</th>
              <th className="w-36 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Rol</th>
              <th className="w-24 px-4 py-2.5 text-left text-[11px] font-medium text-slate-gray uppercase tracking-wide">Estado</th>
              <th className="w-36 px-4 py-2.5 text-right text-[11px] font-medium text-slate-gray uppercase tracking-wide">Registro</th>
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
                  {u.tenant ? (
                    <div>
                      <p className="text-[12px] text-slate-gray">{u.tenant.name}</p>
                      <p className="text-[11px] text-iron-gray font-mono">{u.tenant.slug}</p>
                    </div>
                  ) : (
                    <span className="text-[12px] text-iron-gray">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[u.role] ?? "muted"}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? "success" : "muted"}>
                    {u.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-[12px] text-iron-gray">
                  {new Date(u.createdAt).toLocaleDateString("es-HN")}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-iron-gray">
                  {q ? `Sin resultados para "${q}"` : "Sin usuarios registrados"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
