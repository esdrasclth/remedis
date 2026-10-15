"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, CheckCircle, Circle, ArrowRight,
  Settings, Users, Stethoscope, UserCheck, Package,
  Briefcase, Heart, Calendar, ClipboardList, BarChart3,
  Pill, ShieldCheck,
} from "lucide-react";
import { completeOnboarding } from "@/lib/actions/onboarding";

interface OnboardingStatus {
  clinicType:  "EMPRESA" | "PRIVADA";
  clinicName:  string;
  steps: {
    clinicConfigured: boolean;
    doctorAdded:      boolean;
    patientAdded:     boolean;
    warehouseReady:   boolean;
  };
}

interface Props {
  userId:            string;
  userName:          string;
  userRole:          string;
  roleLabel:         string;
  roleDescription:   string;
  roleModules:       string[];
  isAdmin:           boolean;
  onboardingStatus:  OnboardingStatus | null;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  ADMIN_CLINICA:  <Settings className="w-6 h-6" />,
  MEDICO:         <Stethoscope className="w-6 h-6" />,
  ENFERMERA:      <Heart className="w-6 h-6" />,
  FARMACEUTICO:   <Pill className="w-6 h-6" />,
  RRHH:           <Users className="w-6 h-6" />,
  AUDITOR:        <BarChart3 className="w-6 h-6" />,
  RECEPCIONISTA:  <Calendar className="w-6 h-6" />,
};

const SETUP_STEPS = [
  {
    key:         "clinicConfigured" as const,
    icon:        <Settings className="w-5 h-5" />,
    title:       "Completa el perfil de tu clínica",
    description: "Agrega teléfono, dirección y texto legal para las recetas.",
    href:        "/settings?tab=clinica",
    cta:         "Ir a Configuración",
  },
  {
    key:         "doctorAdded" as const,
    icon:        <Stethoscope className="w-5 h-5" />,
    title:       "Registra tu primer médico",
    description: "Agrega los médicos que atenderán consultas y emitirán recetas.",
    href:        "/settings?tab=medicos",
    cta:         "Agregar médico",
  },
  {
    key:         "patientAdded" as const,
    icon:        <UserCheck className="w-5 h-5" />,
    title:       "Registra tu primer paciente",
    description: "Crea el primer expediente en el sistema.",
    href:        "/patients/new",
    cta:         "Registrar paciente",
  },
  {
    key:         "warehouseReady" as const,
    icon:        <Package className="w-5 h-5" />,
    title:       "Verifica tus almacenes",
    description: "Revisa que los almacenes creados automáticamente son correctos.",
    href:        "/settings?tab=almacenes",
    cta:         "Ver almacenes",
  },
];

export function OnboardingClient({
  userId, userName, userRole, roleLabel, roleDescription, roleModules,
  isAdmin, onboardingStatus,
}: Props) {
  const router  = useRouter();
  const [busy,  setBusy]  = useState(false);
  const [step,  setStep]  = useState<"welcome" | "setup">(isAdmin ? "welcome" : "welcome");

  const firstName = userName.split(" ")[0];
  const isEmpresa = onboardingStatus?.clinicType === "EMPRESA";

  const completedCount = onboardingStatus
    ? Object.values(onboardingStatus.steps).filter(Boolean).length
    : 0;
  const totalSteps = SETUP_STEPS.length;

  async function handleFinish() {
    setBusy(true);
    await completeOnboarding(userId);
    router.push("/dashboard");
  }

  async function handleGoSetup(href: string) {
    await completeOnboarding(userId);
    router.push(href);
  }

  return (
    <div className="min-h-screen bg-deep-space-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center">
            <Activity className="w-5 h-5 text-charcoal-black" strokeWidth={2.5} />
          </div>
          <span className="text-pure-white font-medium text-[18px]">Remedis</span>
        </div>
        {isAdmin && onboardingStatus && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i < completedCount ? "bg-sunbeam-yellow" : "bg-white/[0.1]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] text-slate-gray">{completedCount}/{totalSteps} configurado</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {/* ── Non-admin welcome ── */}
        {!isAdmin && (
          <div className="w-full max-w-[560px] space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-sunbeam-yellow/10 border border-sunbeam-yellow/20 flex items-center justify-center mx-auto text-sunbeam-yellow">
                {ROLE_ICON[userRole] ?? <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-[13px] text-slate-gray mb-1">Bienvenido/a a Remedis</p>
                <h1 className="text-[28px] font-medium text-pure-white">{firstName}</h1>
                <p className="text-[15px] text-sunbeam-yellow mt-1 font-medium">{roleLabel}</p>
              </div>
              <p className="text-[14px] text-slate-gray leading-relaxed max-w-md mx-auto">
                {roleDescription}
              </p>
            </div>

            <div className="bg-ash-gray rounded-[16px] p-6 space-y-4">
              <h2 className="text-[13px] font-medium text-slate-gray uppercase tracking-wide">
                Módulos a los que tienes acceso
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {roleModules.map(mod => (
                  <div key={mod} className="flex items-center gap-2.5 bg-input-bg rounded-[8px] px-3.5 py-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-green shrink-0" />
                    <span className="text-[13px] text-pure-white">{mod}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-dim rounded-[12px] p-4 border border-sunbeam-yellow/10">
              <p className="text-[13px] text-slate-gray leading-relaxed">
                <span className="text-sunbeam-yellow font-medium">Consejo: </span>
                Si necesitas acceso adicional, contacta al administrador de tu clínica para que ajuste tus permisos.
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-sunbeam-yellow text-charcoal-black font-medium text-[15px] rounded-[8px] py-3.5 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Entrando…" : "Comenzar a usar Remedis"}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* ── Admin onboarding ── */}
        {isAdmin && onboardingStatus && (
          <div className="w-full max-w-[680px] space-y-8">
            {/* Welcome header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-green/10 border border-emerald-green/20 rounded-full px-4 py-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-green" />
                <span className="text-[12px] text-emerald-green font-medium">Cuenta creada exitosamente</span>
              </div>
              <h1 className="text-[30px] font-medium text-pure-white">
                ¡Bienvenido, {firstName}!
              </h1>
              <p className="text-[14px] text-slate-gray leading-relaxed max-w-lg mx-auto">
                Tu {isEmpresa ? "clínica empresarial" : "clínica privada"}{" "}
                <span className="text-pure-white font-medium">{onboardingStatus.clinicName}</span>{" "}
                está lista. Tienes <span className="text-sunbeam-yellow font-medium">14 días de prueba gratuita</span> para explorar todo el sistema.
              </p>
            </div>

            {/* Setup checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-medium text-pure-white">Configura tu clínica</h2>
                <span className="text-[12px] text-slate-gray">Opcional — puedes hacerlo después</span>
              </div>

              {SETUP_STEPS.map(step => {
                const done = onboardingStatus.steps[step.key];
                return (
                  <div
                    key={step.key}
                    className={`flex items-start gap-4 bg-ash-gray rounded-[12px] p-4 border transition-colors ${
                      done ? "border-emerald-green/20" : "border-transparent hover:border-white/[0.08]"
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 p-2 rounded-[8px] ${
                      done ? "bg-emerald-green/10 text-emerald-green" : "bg-input-bg text-slate-gray"
                    }`}>
                      {done ? <CheckCircle className="w-5 h-5" /> : step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-[14px] font-medium ${done ? "text-slate-gray line-through" : "text-pure-white"}`}>
                            {step.title}
                          </p>
                          <p className="text-[12px] text-slate-gray mt-0.5">{step.description}</p>
                        </div>
                        {!done && (
                          <button
                            onClick={() => handleGoSetup(step.href)}
                            className="shrink-0 flex items-center gap-1.5 text-[12px] text-sunbeam-yellow hover:text-sunbeam-yellow/80 font-medium transition-colors whitespace-nowrap"
                          >
                            {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features preview */}
            <div className="grid grid-cols-3 gap-3">
              {(isEmpresa ? [
                { icon: <Briefcase className="w-4 h-4" />, label: "Clínica de empresa", desc: "Empleados y seguro social integrados" },
                { icon: <ClipboardList className="w-4 h-4" />, label: "Expedientes", desc: "Por empleado con dependientes" },
                { icon: <Package className="w-4 h-4" />, label: "2 Almacenes", desc: "Empresa + Seguro Social" },
              ] : [
                { icon: <Heart className="w-4 h-4" />, label: "Clínica privada", desc: "Pacientes externos" },
                { icon: <ClipboardList className="w-4 h-4" />, label: "Expedientes", desc: "Con número de expediente" },
                { icon: <Package className="w-4 h-4" />, label: "1 Almacén", desc: "Farmacia Principal" },
              ]).map(f => (
                <div key={f.label} className="bg-ash-gray rounded-[10px] p-3.5 flex items-start gap-2.5">
                  <div className="text-sunbeam-yellow mt-0.5 shrink-0">{f.icon}</div>
                  <div>
                    <p className="text-[12px] font-medium text-pure-white">{f.label}</p>
                    <p className="text-[11px] text-slate-gray mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleFinish}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-sunbeam-yellow text-charcoal-black font-semibold text-[15px] rounded-[10px] py-4 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Entrando al sistema…" : "Ir al Dashboard"}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
            <p className="text-center text-[12px] text-iron-gray">
              Puedes completar la configuración en cualquier momento desde Ajustes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
