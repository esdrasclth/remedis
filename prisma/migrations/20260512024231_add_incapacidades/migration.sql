-- CreateEnum
CREATE TYPE "IncapacidadTipo" AS ENUM ('REPOSO_MEDICO', 'INCAPACIDAD_IHSS', 'CERTIFICADO_TRABAJO');

-- CreateEnum
CREATE TYPE "IncapacidadEstado" AS ENUM ('EMITIDA', 'ENTREGADA_PACIENTE', 'PRESENTADA_RRHH', 'CANCELADA');

-- CreateTable
CREATE TABLE "incapacidades" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "employeeId" TEXT,
    "dependentId" TEXT,
    "tipo" "IncapacidadTipo" NOT NULL,
    "estado" "IncapacidadEstado" NOT NULL DEFAULT 'EMITIDA',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "dias" INTEGER NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "restricciones" TEXT,
    "recomendaciones" TEXT,
    "fechaRetorno" TIMESTAMP(3),
    "esIHSS" BOOLEAN NOT NULL DEFAULT false,
    "numeroIHSS" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incapacidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incapacidades_folio_key" ON "incapacidades"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "incapacidades_medicalRecordId_key" ON "incapacidades"("medicalRecordId");

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "dependents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
