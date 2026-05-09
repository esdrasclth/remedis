export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Pacientes", href: "/patients", icon: "Users" },
  { label: "Citas", href: "/appointments", icon: "CalendarDays" },
  { label: "Consultas", href: "/medical-records", icon: "Stethoscope" },
  { label: "Recetas", href: "/prescriptions", icon: "FileText" },
  { label: "Farmacia", href: "/pharmacy", icon: "Pill" },
  { label: "Inventario", href: "/inventory", icon: "Package" },
  { label: "Med. Permanentes", href: "/permanent-meds", icon: "Heart" },
  { label: "Proveedores", href: "/suppliers", icon: "Truck" },
  { label: "Reportes", href: "/reports", icon: "BarChart3" },
  { label: "Configuración", href: "/settings", icon: "Settings" },
];
