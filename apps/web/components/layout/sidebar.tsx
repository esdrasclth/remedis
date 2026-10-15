"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  FileText, Pill, Package, Heart, Truck, BarChart3,
  Settings, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  FileText, Pill, Package, Heart, Truck, BarChart3, Settings, ClipboardList,
};

interface SidebarProps {
  tenantName: string;
  tenantLogo?: string | null;
}

export function Sidebar({ tenantName, tenantLogo }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-panel-bg border-r border-[var(--border-divider)]"
    >
      {/* ── Header — same height as topbar (--header-h: 56px) ── */}
      <div
        className="flex items-center gap-2.5 px-4 shrink-0"
        style={{ height: "var(--header-h, 56px)" }}
      >
        {tenantLogo ? (
          <Image
            src={tenantLogo}
            alt={tenantName}
            width={28}
            height={28}
            className="w-7 h-7 rounded-[4px] object-contain shrink-0"
            unoptimized
          />
        ) : (
          <Image
            src="/images/iconoremedis.png"
            alt="Remedis"
            width={28}
            height={28}
            className="w-7 h-7 rounded-[4px] object-contain shrink-0"
          />
        )}
        <span className="font-medium text-[14px] text-pure-white truncate">
          {tenantName}
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-px">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-[7px] rounded-[4px] text-[13px] transition-colors",
                    isActive
                      ? "bg-ocean-abyss text-sunbeam-yellow font-medium"
                      : "text-slate-gray hover:text-pure-white hover:bg-ash-gray"
                  )}
                >
                  {Icon && (
                    <Icon
                      className="w-4 h-4 shrink-0"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sunbeam-yellow shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div
        className="px-4 py-3 shrink-0"
        style={{}}
      >
        <p className="text-[11px] text-iron-gray">Remedis v1.0</p>
      </div>
    </aside>
  );
}
