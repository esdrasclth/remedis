"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity, LayoutDashboard, Building2, Users, LogOut, ShieldAlert,
} from "lucide-react";

const NAV = [
  { label: "Overview",  href: "/admin",         icon: LayoutDashboard },
  { label: "Tenants",   href: "/admin/tenants",  icon: Building2 },
  { label: "Usuarios",  href: "/admin/users",    icon: Users },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="w-[220px] shrink-0 h-screen flex flex-col bg-panel-bg border-r border-[var(--border-divider)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-[56px] border-b border-[var(--border-divider)]">
        <div className="w-7 h-7 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-charcoal-black" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-pure-white font-medium text-[14px] leading-none block">Remedis</span>
          <span className="text-[10px] text-blaze-orange font-medium uppercase tracking-widest">Super Admin</span>
        </div>
      </div>

      {/* Admin badge */}
      <div className="mx-4 mt-4 mb-2 flex items-center gap-2 px-3 py-2 bg-blaze-orange/10 rounded-[8px]">
        <ShieldAlert className="w-3.5 h-3.5 text-blaze-orange shrink-0" />
        <span className="text-[11px] text-blaze-orange font-medium">Panel de administración</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] transition-colors ${
                active
                  ? "bg-sunbeam-yellow/10 text-sunbeam-yellow font-medium"
                  : "text-slate-gray hover:text-pure-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-sunbeam-yellow" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-[var(--border-divider)] pt-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12px] text-iron-gray hover:text-slate-gray transition-colors"
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          Volver a la app
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12px] text-iron-gray hover:text-blaze-orange transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
