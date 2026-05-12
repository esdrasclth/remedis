-- AlterEnum
ALTER TYPE "TenantPlan" ADD VALUE 'TRIAL';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "planNotes" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ALTER COLUMN "plan" SET DEFAULT 'TRIAL';

-- CreateTable
CREATE TABLE "plan_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "billing" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plan_requests" ADD CONSTRAINT "plan_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
