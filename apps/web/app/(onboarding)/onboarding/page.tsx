import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/actions/onboarding";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";
import type { SessionUser } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_CLINICA:  "Administrador de clínica",
  MEDICO:         "Médico",
  ENFERMERA:      "Enfermera",
  FARMACEUTICO:   "Farmacéutico",
  RRHH:           "Recursos Humanos",
  AUDITOR:        "Auditor",
  RECEPCIONISTA:  "Recepcionista",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  ADMIN_CLINICA:  "Tienes acceso completo para configurar y gestionar tu clínica.",
  MEDICO:         "Puedes ver tus citas, registrar consultas y emitir recetas.",
  ENFERMERA:      "Tienes acceso a citas, expedientes y registro de consultas.",
  FARMACEUTICO:   "Gestionas el inventario de farmacia y dispensas medicamentos.",
  RRHH:           "Administras los empleados y sus expedientes médicos.",
  AUDITOR:        "Tienes acceso de lectura a reportes e historial de movimientos.",
  RECEPCIONISTA:  "Programas citas y gestionas la llegada de pacientes.",
};

const ROLE_MODULES: Record<string, string[]> = {
  ADMIN_CLINICA:  ["Dashboard con métricas", "Configuración de la clínica", "Gestión de usuarios", "Todos los módulos del sistema"],
  MEDICO:         ["Agenda de citas", "Consultas médicas", "Recetas digitales", "Expedientes clínicos"],
  ENFERMERA:      ["Citas y consultas", "Expedientes de pacientes", "Historial médico"],
  FARMACEUTICO:   ["Inventario de farmacia", "Dispensación de medicamentos", "Recetas pendientes", "Órdenes de compra"],
  RRHH:           ["Registro de empleados", "Expedientes médicos", "Dependientes"],
  AUDITOR:        ["Reportes de movimientos", "Historial de inventario", "Estadísticas"],
  RECEPCIONISTA:  ["Agenda de citas", "Registro de pacientes", "Confirmación de llegada"],
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as SessionUser;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, onboardingDone: true, tenantId: true, name: true, role: true },
  });

  if (!dbUser) redirect("/login");
  if (dbUser.onboardingDone) redirect("/dashboard");

  const isAdmin = dbUser.role === "ADMIN_CLINICA";

  const onboardingStatus = isAdmin && dbUser.tenantId
    ? await getOnboardingStatus(dbUser.tenantId)
    : null;

  return (
    <OnboardingClient
      userId={dbUser.id}
      userName={dbUser.name ?? user.name ?? ""}
      userRole={dbUser.role}
      roleLabel={ROLE_LABEL[dbUser.role] ?? dbUser.role}
      roleDescription={ROLE_DESCRIPTION[dbUser.role] ?? ""}
      roleModules={ROLE_MODULES[dbUser.role] ?? []}
      isAdmin={isAdmin}
      onboardingStatus={onboardingStatus}
    />
  );
}
