"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope,
  FileText, Pill, Package, Heart, Truck, BarChart3,
  Settings, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  FileText,
  Pill,
  Package,
  Heart,
  Truck,
  BarChart3,
  Settings,
};

interface SidebarProps {
  tenantName: string;
  tenantLogo?: string | null;
}

export function Sidebar({ tenantName, tenantLogo }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 bg-ash-gray border-r border-iron-gray/30 shrink-0 h-screen sticky top-0">
      {/* Logo / Tenant */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-iron-gray/30">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-sunbeam-yellow">
          <Activity className="w-4 h-4 text-deep-space-black" strokeWidth={2.5} />
        </div>
        <span
          className="text-pure-white font-medium text-[14px] truncate"
          style={{ fontFeatureSettings: '"ss01"' }}
        >
          {tenantName}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded text-[13px] transition-colors",
                    isActive
                      ? "bg-sunbeam-yellow/10 text-sunbeam-yellow font-medium"
                      : "text-slate-gray hover:text-pure-white hover:bg-ocean-abyss"
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn("w-4 h-4 shrink-0", isActive ? "text-sunbeam-yellow" : "")}
                      strokeWidth={1.5}
                    />
                  )}
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1 h-1 rounded-full bg-sunbeam-yellow" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-iron-gray/30">
        <p className="text-[10px] text-slate-gray/60 text-center">
          Remedis v1.0
        </p>
      </div>
    </aside>
  );
}
