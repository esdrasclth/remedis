"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { SessionUser } from "@/types";

interface TopbarProps {
  user: SessionUser;
  tenantId: string;
  avatar?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:    "Super Admin",
  ADMIN_CLINICA:  "Admin Clínica",
  MEDICO:         "Médico",
  ENFERMERA:      "Enfermera",
  FARMACEUTICO:   "Farmacéutico",
  RRHH:           "RRHH",
  AUDITOR:        "Auditor",
  RECEPCIONISTA:  "Recepcionista",
};

function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  return (email?.[0] ?? "U").toUpperCase();
}

export function Topbar({ user, tenantId, avatar }: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 shrink-0 bg-panel-bg border-b border-[var(--border-divider)]"
      style={{ height: "var(--header-h, 56px)" }}
    >
      <div />

      <div className="flex items-center gap-1">
        {/* Super admin panel link */}
        {user.role === "SUPER_ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] text-sunbeam-yellow hover:bg-sunbeam-yellow/10 transition-colors"
            title="Panel de administración"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </Link>
        )}

        {/* Notification bell */}
        <NotificationBell tenantId={tenantId} />

        {/* Theme toggle */}
        <ThemeToggle />

        <div className="w-2" />

        {/* Avatar + user info — links to profile */}
        <Link href="/profile" className="flex items-center gap-2.5 rounded-[6px] px-2 py-1 hover:bg-ash-gray transition-colors">
          <div className="w-7 h-7 rounded-full bg-ocean-abyss flex items-center justify-center shrink-0 overflow-hidden">
            {avatar ? (
              <Image
                src={avatar}
                alt={user.name ?? ""}
                width={28}
                height={28}
                className="w-7 h-7 object-cover"
                unoptimized
              />
            ) : (
              <span className="text-[11px] font-medium text-sunbeam-yellow">
                {initials(user.name, user.email)}
              </span>
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-medium text-pure-white">
              {user.name ?? user.email}
            </span>
            <span className="text-[11px] text-slate-gray">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </Link>

        <div className="w-2" />

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
