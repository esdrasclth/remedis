export type PlanKey = "BASIC" | "PROFESSIONAL" | "ENTERPRISE";

export interface PlanDef {
  key:          PlanKey;
  name:         string;
  monthlyPrice: number;
  annualPrice:  number;
  annualSavings: number;
  popular?:     boolean;
  limits: {
    users:      number;   // Infinity = ilimitado
    doctors:    number;
    employees:  number;
    warehouses: number;
  };
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDef> = {
  BASIC: {
    key:          "BASIC",
    name:         "Basic",
    monthlyPrice: 699,
    annualPrice:  6990,
    annualSavings: 1398,
    limits: { users: 5, doctors: 2, employees: 200, warehouses: 1 },
    features: [
      "Expedientes médicos SOAP",
      "Recetas digitales con PDF",
      "Farmacia y dispensación",
      "Inventario con lotes y FEFO",
      "Citas médicas",
      "Alertas de stock y vencimientos",
      "2 médicos · 200 pacientes",
      "1 almacén · 5 usuarios",
    ],
  },
  PROFESSIONAL: {
    key:          "PROFESSIONAL",
    name:         "Pro",
    monthlyPrice: 1299,
    annualPrice:  12990,
    annualSavings: 2598,
    popular:      true,
    limits: { users: 20, doctors: 8, employees: 1000, warehouses: 5 },
    features: [
      "Todo lo incluido en Basic",
      "Reportes financieros avanzados",
      "Exportación PDF y Excel",
      "Órdenes de compra a proveedores",
      "Medicamentos permanentes (ciclos)",
      "8 médicos · 1,000 pacientes",
      "5 almacenes · 20 usuarios",
      "Soporte por email prioritario",
    ],
  },
  ENTERPRISE: {
    key:          "ENTERPRISE",
    name:         "Enterprise",
    monthlyPrice: 2499,
    annualPrice:  24990,
    annualSavings: 4998,
    limits: { users: Infinity, doctors: Infinity, employees: Infinity, warehouses: Infinity },
    features: [
      "Todo lo incluido en Pro",
      "Usuarios y médicos ilimitados",
      "Pacientes y almacenes ilimitados",
      "Onboarding personalizado",
      "Capacitación para el equipo",
      "Soporte directo con el desarrollador",
      "Acceso anticipado a nuevas funciones",
      "Acuerdo de nivel de servicio (SLA)",
    ],
  },
};

export const PLAN_ORDER: PlanKey[] = ["BASIC", "PROFESSIONAL", "ENTERPRISE"];

export function formatPrice(amount: number): string {
  return `L. ${amount.toLocaleString("es-HN")}`;
}

export function annualMonthlyEquiv(plan: PlanDef): number {
  return Math.round(plan.annualPrice / 12);
}

export function annualDiscountPct(plan: PlanDef): number {
  return Math.round((plan.annualSavings / (plan.monthlyPrice * 12)) * 100);
}
