"use client";

import { Bell, ChevronDown, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { SessionUser } from "@/types";

interface TopbarProps {
  user: SessionUser;
  title?: string;
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

export function Topbar({ user, title }: TopbarProps) {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 bg-ash-gray border-b border-iron-gray/30 sticky top-0 z-10"
      style={{ boxShadow: "rgba(255,255,255,0.6) 0px 0px 2px 0px inset" }}
    >
      {title && (
        <h1
          className="text-pure-white font-medium text-[16px]"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          {title}
        </h1>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 rounded text-slate-gray hover:text-pure-white hover:bg-ocean-abyss transition-colors">
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sunbeam-yellow" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-3 border-l border-iron-gray/30">
          <div className="flex flex-col items-end">
            <span className="text-[13px] text-pure-white font-medium leading-tight">
              {user.name ?? user.email}
            </span>
            <span className="text-[11px] text-slate-gray leading-tight">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded text-slate-gray hover:text-blaze-orange hover:bg-ocean-abyss transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
