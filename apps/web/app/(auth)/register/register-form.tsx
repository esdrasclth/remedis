"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle, Eye, EyeOff, ArrowLeft, ArrowRight,
  Building2, User, Sparkles, Briefcase, Stethoscope,
} from "lucide-react";
import { step1Schema, step2Schema } from "@/lib/validations/register";
import { checkSlugAvailable, registerTenant } from "@/lib/actions/register";

type ClinicType = "EMPRESA" | "PRIVADA";
type Step = 0 | 1 | 2 | 3;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

const CLINIC_OPTIONS: {
  type: ClinicType;
  icon: React.ReactNode;
  tag: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accentColor: string;
  iconBg: string;
  borderIdle: string;
  borderHover: string;
}[] = [
  {
    type:        "EMPRESA",
    icon:        <Briefcase className="w-6 h-6" />,
    tag:         "Clínica con seguro social",
    title:       "Clínica de Empresa",
    subtitle:    "Atiendes a tus propios empleados con integración de seguro social",
    bullets: [
      "Empleados como pacientes con datos laborales",
      "2 almacenes: Farmacia Empresa + Farmacia Seguro Social",
      "Control de medicamentos del seguro asignados",
      "Campos de departamento, cargo y N° empleado",
      "Reportes orientados a recursos humanos",
    ],
    accentColor: "text-blue-400",
    iconBg:      "bg-blue-500/15",
    borderIdle:  "border-white/[0.06]",
    borderHover: "hover:border-blue-500/50",
  },
  {
    type:        "PRIVADA",
    icon:        <Stethoscope className="w-6 h-6" />,
    tag:         "Consultorios y clínicas",
    title:       "Clínica Privada",
    subtitle:    "Atiendes al público general con farmacia propia",
    bullets: [
      "Pacientes externos con número de expediente",
      "1 almacén: Farmacia Principal propia",
      "Sin dependencia del seguro social",
      "Expediente clínico completo",
      "Reportes médicos y de consultas",
    ],
    accentColor: "text-emerald-400",
    iconBg:      "bg-emerald-500/15",
    borderIdle:  "border-white/[0.06]",
    borderHover: "hover:border-emerald-500/50",
  },
];

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);

  // Step 0
  const [clinicType, setClinicType] = useState<ClinicType | null>(null);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [slug,        setSlug]        = useState("");
  const [slugManual,  setSlugManual]  = useState(false);
  const [rtn,         setRtn]         = useState("");
  const [slugStatus,  setSlugStatus]  = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [s1Error,     setS1Error]     = useState("");

  // Step 2
  const [adminName,       setAdminName]       = useState("");
  const [adminEmail,      setAdminEmail]      = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [s2Error,         setS2Error]         = useState("");

  // Step 3
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!slugManual && companyName) setSlug(generateSlug(companyName));
  }, [companyName, slugManual]);

  const checkSlug = useCallback(async (value: string) => {
    if (value.length < 3) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const available = await checkSlugAvailable(value);
    setSlugStatus(available ? "available" : "taken");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (slug) checkSlug(slug); }, 500);
    return () => clearTimeout(t);
  }, [slug, checkSlug]);

  function handleCompanyName(v: string) {
    setCompanyName(v);
    if (!slugManual) setSlugStatus("idle");
  }

  function handleSlug(v: string) {
    const clean = v.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(clean);
    setSlugManual(true);
    setSlugStatus("idle");
  }

  function handleStep0(type: ClinicType) {
    setClinicType(type);
    setStep(1);
  }

  function handleStep1() {
    const res = step1Schema.safeParse({ companyName, slug, rtn, clinicType: clinicType ?? "EMPRESA" });
    if (!res.success) { setS1Error(res.error.issues[0].message); return; }
    if (slugStatus === "taken")    { setS1Error("Ese subdominio ya está en uso"); return; }
    if (slugStatus === "checking") { setS1Error("Espera mientras verificamos el subdominio"); return; }
    setS1Error("");
    setStep(2);
  }

  function handleStep2() {
    const res = step2Schema.safeParse({ adminName, adminEmail, password, confirmPassword });
    if (!res.success) { setS2Error(res.error.issues[0].message); return; }
    setS2Error("");
    setStep(3);
  }

  async function handleSubmit() {
    setSubmitting(true); setSubmitError("");
    const result = await registerTenant({
      companyName, slug, rtn,
      clinicType: clinicType ?? "EMPRESA",
      adminName, adminEmail, password,
    });
    if (result.success) {
      router.push(`/login?registered=1&empresa=${encodeURIComponent(companyName)}`);
    } else {
      setSubmitError(result.error);
      setSubmitting(false);
    }
  }

  const isEmpresa = clinicType === "EMPRESA";
  const displayStep = step === 0 ? 1 : step; // steps shown to user: 1-4

  return (
    <div className="min-h-screen flex bg-deep-space-black">
      {/* Left — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[580px] shrink-0 p-12 relative overflow-hidden"
        style={{
          backgroundImage:    "url('/images/auth-bg.jpg')",
          backgroundSize:     "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-auth-panel/80 backdrop-blur-[1px]" />

        <div className="relative z-10 flex items-center gap-2.5">
          <Image src="/images/iconoremedis.png" alt="Remedis" width={32} height={32} className="w-8 h-8 rounded-[4px] object-contain" />
          <span className="text-pure-white font-medium text-[18px]">Remedis</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            {step === 0 && (
              <>
                <p className="text-[32px] font-medium text-pure-white leading-tight">
                  ¿Cómo es tu clínica?
                </p>
                <p className="text-[15px] text-slate-gray leading-relaxed">
                  Empresarial o privada, Remedis se adapta a tu modelo: farmacia, expedientes, dispensación e integración con seguro social.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <p className="text-[32px] font-medium text-pure-white leading-tight">
                  {isEmpresa ? "Clínica de Empresa" : "Clínica Privada"}
                </p>
                <p className="text-[15px] text-slate-gray leading-relaxed">
                  {isEmpresa
                    ? "Gestión de empleados como pacientes, farmacia empresarial e integración con seguro social incluidas."
                    : "Atiende pacientes externos con expedientes clínicos, farmacia propia y recetas digitales."}
                </p>
              </>
            )}
            {(step === 2 || step === 3) && (
              <>
                <p className="text-[32px] font-medium text-pure-white leading-tight">
                  Tu clínica, lista en minutos.
                </p>
                <p className="text-[15px] text-slate-gray leading-relaxed">
                  14 días de prueba gratuita. Sin tarjeta de crédito. Cancela cuando quieras.
                </p>
              </>
            )}
          </div>

          <div className="space-y-3">
            {(step === 0 || step >= 2
              ? [
                  "Inventario médico con control de lotes",
                  "Dispensación con FEFO automático",
                  "Expediente clínico y recetas digitales",
                  isEmpresa ? "Integración con medicamentos del seguro" : "Gestión de pacientes externos",
                ]
              : step === 1 && isEmpresa
              ? [
                  "Farmacia Empresa + Farmacia Seguro Social incluidas",
                  "Control de medicamentos del seguro asignados",
                  "Empleados como pacientes con datos laborales",
                  "Reportes de consumo por departamento",
                ]
              : [
                  "Farmacia Principal lista para operar",
                  "Expediente por paciente con número de expediente",
                  "Recetas digitales para médicos",
                  "Sin dependencia del seguro social",
                ]
            ).map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-green shrink-0" />
                <span className="text-[13px] text-slate-gray">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[12px] text-iron-gray">© {new Date().getFullYear()} Remedis</p>
      </div>

      {/* Right — wizard */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center">
              <Image src="/images/iconoremedis.png" alt="Remedis" width={32} height={32} className="w-8 h-8 rounded-[4px] object-contain" />
            </div>
            <span className="font-medium text-[18px] text-pure-white">Remedis</span>
          </div>

          {/* Step indicator — 4 steps */}
          <div className="flex items-center gap-2 mb-8">
            {([0, 1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
                  step === s ? "bg-sunbeam-yellow text-deep-space-black"
                  : step > s  ? "bg-emerald-green text-deep-space-black"
                  : "bg-[#2a2825] text-iron-gray"
                }`}>
                  {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s + 1}
                </div>
                {i < 3 && <div className={`h-px w-8 ${step > s ? "bg-emerald-green" : "bg-[#2a2825]"}`} />}
              </div>
            ))}
            <div className="ml-3 text-[12px] text-slate-gray">
              {step === 0 && "Tipo de clínica"}
              {step === 1 && "Tu empresa"}
              {step === 2 && "Tu cuenta"}
              {step === 3 && "Confirmar"}
            </div>
          </div>

          {/* ── Step 0: Clinic Type ── */}
          {step === 0 && (
            <div>
              <h1 className="text-[22px] font-medium text-pure-white mb-1">¿Qué tipo de clínica eres?</h1>
              <p className="text-[13px] text-slate-gray mb-6">
                Selecciona la opción que mejor describe tu clínica. Esto define la configuración inicial del sistema.
              </p>

              <div className="space-y-3">
                {CLINIC_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleStep0(opt.type)}
                    className={`w-full text-left rounded-[12px] border bg-ash-gray p-5 transition-all duration-200 ${opt.borderIdle} ${opt.borderHover} group`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon block */}
                      <div className={`shrink-0 w-12 h-12 rounded-[10px] ${opt.iconBg} flex items-center justify-center ${opt.accentColor} transition-transform group-hover:scale-105`}>
                        {opt.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Tag + title row */}
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <div>
                            <span className={`inline-block text-[10px] font-semibold uppercase tracking-widest ${opt.accentColor} mb-1`}>
                              {opt.tag}
                            </span>
                            <p className="text-[16px] font-semibold text-pure-white leading-tight">{opt.title}</p>
                          </div>
                          <div className={`shrink-0 w-7 h-7 rounded-full border border-white/[0.1] flex items-center justify-center transition-all group-hover:border-white/30 group-hover:bg-white/[0.04]`}>
                            <ArrowRight className="w-3.5 h-3.5 text-iron-gray group-hover:text-pure-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        {/* Subtitle */}
                        <p className="text-[12px] text-slate-gray mb-3">{opt.subtitle}</p>

                        {/* Divider */}
                        <div className="h-px bg-white/[0.05] mb-3" />

                        {/* Bullets */}
                        <ul className="space-y-1.5">
                          {opt.bullets.map(b => (
                            <li key={b} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${opt.accentColor} bg-current shrink-0 opacity-70`} />
                              <span className="text-[12px] text-slate-gray">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-[12px] text-iron-gray mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-slate-gray hover:text-pure-white transition-colors underline underline-offset-2">
                  Inicia sesión
                </Link>
              </p>
            </div>
          )}

          {/* ── Step 1: Company Info ── */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-iron-gray" />
                <h1 className="text-[22px] font-medium text-pure-white">
                  {isEmpresa ? "Tu empresa" : "Tu clínica"}
                </h1>
              </div>
              <p className="text-[13px] text-slate-gray mb-7">
                {isEmpresa
                  ? "Información de la empresa que opera la clínica"
                  : "Información de tu clínica o consultorio"}
              </p>

              <div className="space-y-4">
                <Field label={isEmpresa ? "Nombre de la empresa" : "Nombre de la clínica"}>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => handleCompanyName(e.target.value)}
                    placeholder={isEmpresa ? "Empresa Ejemplo S.A." : "Clínica Santa María"}
                    autoFocus
                    className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none"
                  />
                </Field>

                <Field label="Subdominio">
                  <div className="relative">
                    <input
                      type="text"
                      value={slug}
                      onChange={e => handleSlug(e.target.value)}
                      placeholder={isEmpresa ? "miempresa" : "miclinica"}
                      className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none pr-28"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-iron-gray">.remedis.com</span>
                  </div>
                  <div className="mt-1.5">
                    {slugStatus === "checking"  && <span className="text-[11px] text-iron-gray">Verificando…</span>}
                    {slugStatus === "available" && <span className="text-[11px] text-emerald-green">✓ Disponible</span>}
                    {slugStatus === "taken"     && <span className="text-[11px] text-blaze-orange">✗ Ya en uso, elige otro</span>}
                    {slugStatus === "idle" && slug && <span className="text-[11px] text-iron-gray">{slug}.remedis.com</span>}
                  </div>
                </Field>

                <Field label="RTN (opcional)">
                  <input
                    type="text"
                    value={rtn}
                    onChange={e => setRtn(e.target.value)}
                    placeholder="0801-1990-00000"
                    className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none"
                  />
                </Field>
              </div>

              {s1Error && <p className="mt-3 text-[12px] text-blaze-orange">{s1Error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] text-[14px] text-slate-gray hover:text-pure-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  onClick={handleStep1}
                  disabled={!companyName || !slug || slugStatus === "taken" || slugStatus === "checking"}
                  className="flex-1 flex items-center justify-center gap-2 bg-sunbeam-yellow text-deep-space-black font-medium text-[14px] rounded-[4px] py-2.5 transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Admin Account ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-iron-gray" />
                <h1 className="text-[22px] font-medium text-pure-white">Tu cuenta</h1>
              </div>
              <p className="text-[13px] text-slate-gray mb-7">Serás el administrador principal de la clínica</p>

              <div className="space-y-4">
                <Field label="Nombre completo">
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="Juan Pérez"
                    autoFocus
                    className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none"
                  />
                </Field>

                <Field label="Correo electrónico">
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@empresa.com"
                    className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none"
                  />
                </Field>

                <Field label="Contraseña">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 pr-11 text-[14px] text-pure-white placeholder:text-iron-gray outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-iron-gray hover:text-slate-gray transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirmar contraseña">
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 pr-11 text-[14px] text-pure-white placeholder:text-iron-gray outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-iron-gray hover:text-slate-gray transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              </div>

              {s2Error && <p className="mt-3 text-[12px] text-blaze-orange">{s2Error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] text-[14px] text-slate-gray hover:text-pure-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  onClick={handleStep2}
                  disabled={!adminName || !adminEmail || !password || !confirmPassword}
                  className="flex-1 flex items-center justify-center gap-2 bg-sunbeam-yellow text-deep-space-black font-medium text-[14px] rounded-[4px] py-2.5 transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Revisar y confirmar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-iron-gray" />
                <h1 className="text-[22px] font-medium text-pure-white">Todo listo</h1>
              </div>
              <p className="text-[13px] text-slate-gray mb-7">Revisa los datos antes de crear tu cuenta</p>

              <div className="bg-[#181716] rounded-[10px] divide-y divide-white/[0.05] mb-6">
                <SummaryRow
                  label="Tipo de clínica"
                  value={isEmpresa ? "Clínica de Empresa" : "Clínica Privada"}
                  badge={isEmpresa ? "EMPRESA" : "PRIVADA"}
                />
                <SummaryRow label={isEmpresa ? "Empresa" : "Clínica"} value={companyName} />
                <SummaryRow label="Subdominio" value={`${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "remedis.brandsofts.com"}`} />
                {rtn && <SummaryRow label="RTN" value={rtn} />}
                <SummaryRow label="Administrador" value={adminName} />
                <SummaryRow label="Email" value={adminEmail} />
                <SummaryRow label="Plan inicial" value="Prueba gratuita — 14 días" highlight />
                <div className="px-4 py-3">
                  <p className="text-[11px] text-iron-gray uppercase tracking-wide mb-1.5">Almacenes que se crearán</p>
                  {isEmpresa ? (
                    <div className="space-y-1">
                      <p className="text-[12px] text-slate-gray">• Farmacia Empresa</p>
                      <p className="text-[12px] text-slate-gray">• Farmacia Seguro Social</p>
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-gray">• Farmacia Principal</p>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5 mb-4">
                  <p className="text-[13px] text-blaze-orange">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] text-[14px] text-slate-gray hover:text-pure-white transition-colors disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-sunbeam-yellow text-deep-space-black font-medium text-[14px] rounded-[4px] py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Creando tu clínica…" : "Crear mi clínica"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-slate-gray uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({
  label, value, badge, highlight,
}: {
  label: string; value: string; badge?: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-[12px] text-slate-gray shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sunbeam-yellow/15 text-sunbeam-yellow shrink-0">
            {badge}
          </span>
        )}
        <span className={`text-[13px] text-right truncate ${highlight ? "text-sunbeam-yellow font-medium" : "text-pure-white"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
