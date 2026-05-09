"use client";

import { Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { SessionUser } from "@/types";

interface TopbarProps {
  user: SessionUser;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_CLINICA: "Admin Clínica",
  MEDICO: "Médico",
  ENFERMERA: "Enfermera",
  FARMACEUTICO: "Farmacéutico",
  RRHH: "RRHH",
  AUDITOR: "Auditor",
  RECEPCIONISTA: "Recepcionista",
};

function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (email?.[0] ?? "U").toUpperCase();
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 shrink-0"
      style={{
        height: "var(--header-h, 56px)",
        background: "#141210",           /* matches sidebar header exactly */
        borderBottom: "1px solid #252220",
      }}
    >
      {/* Empty left — page title lives in page content */}
      <div />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Bell */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-[4px] text-slate-gray hover:text-pure-white hover:bg-ash-gray transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sunbeam-yellow" />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-iron-gray/40 mx-1.5" />

        {/* Avatar + user info */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-ocean-abyss border border-iron-gray/50 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-medium text-sunbeam-yellow">
              {initials(user.name, user.email)}
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-pure-white">
              {user.name ?? user.email}
            </span>
            <span className="text-[11px] text-slate-gray">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-iron-gray/40 mx-1.5" />

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-8 h-8 flex items-center justify-center rounded-[4px] text-slate-gray hover:text-blaze-orange hover:bg-ash-gray transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
