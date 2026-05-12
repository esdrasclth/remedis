-- CreateEnum
CREATE TYPE "ClinicType" AS ENUM ('EMPRESA', 'PRIVADA');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "clinicType" "ClinicType" NOT NULL DEFAULT 'EMPRESA';
