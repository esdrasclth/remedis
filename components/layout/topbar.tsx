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

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function Topbar({ user }: TopbarProps) {
  const initials = getInitials(user.name, user.email);

  return (
    <header
      className="h-13 flex items-center justify-between px-5 shrink-0"
      style={{
        background: "var(--color-topbar-bg)",
        borderBottom: "1px solid var(--color-topbar-border)",
        height: "52px",
      }}
    >
      {/* Left: breadcrumb placeholder */}
      <div />

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-[6px] text-[#6b6966] hover:text-[#1a1918] hover:bg-[#f0eeeb] transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sunbeam-yellow" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#e3e0db] mx-1" />

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-7 h-7 rounded-full bg-[#1a1918] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-medium text-sunbeam-yellow">
              {initials}
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-[#1a1918]">
              {user.name ?? user.email}
            </span>
            <span className="text-[11px] text-[#6b6966]">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#6b6966] hover:text-blaze-orange hover:bg-[#fff0ed] transition-colors ml-1"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
