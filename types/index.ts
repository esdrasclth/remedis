import type { UserRole, TenantPlan, TenantStatus } from "@/app/generated/prisma/client";

export type { UserRole, TenantPlan, TenantStatus };

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  tenantId: string | null;
  clinicId: string | null;
}

export interface TenantConfig {
  prescriptionValidityDays?: number;
  alertDays?: { expiry30: boolean; expiry60: boolean; expiry90: boolean };
  ihssEnabled?: boolean;
}
