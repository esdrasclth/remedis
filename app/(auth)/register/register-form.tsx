"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, CheckCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Building2, User, Sparkles } from "lucide-react";
import { step1Schema, step2Schema } from "@/lib/validations/register";
import { checkSlugAvailable, registerTenant } from "@/lib/actions/register";

type Step = 1 | 2 | 3;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [slug,        setSlug]        = useState("");
  const [slugManual,  setSlugManual]  = useState(false);
  const [rtn,         setRtn]         = useState("");
  const [slugStatus,  setSlugStatus]  = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [s1Error,     setS1Error]     = useState("");

  // Step 2
  const [adminName,        setAdminName]        = useState("");
  const [adminEmail,       setAdminEmail]       = useState("");
  const [password,         setPassword]         = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [s2Error,          setS2Error]          = useState("");

  // Step 3
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auto-generate slug from company name
  useEffect(() => {
    if (!slugManual && companyName) {
      setSlug(generateSlug(companyName));
    }
  }, [companyName, slugManual]);

  // Debounced slug check
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

  function handleStep1() {
    const res = step1Schema.safeParse({ companyName, slug, rtn });
    if (!res.success) { setS1Error(res.error.issues[0].message); return; }
    if (slugStatus === "taken") { setS1Error("Ese subdominio ya está en uso"); return; }
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
    const result = await registerTenant({ companyName, slug, rtn, adminName, adminEmail, password });
    if (result.success) {
      router.push(`/login?registered=1&empresa=${encodeURIComponent(companyName)}`);
    } else {
      setSubmitError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-deep-space-black">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10" style={{ background: "#0e0d0b" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center">
            <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
          </div>
          <span className="text-pure-white font-medium text-[18px]">Remedis</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-[26px] font-medium text-pure-white leading-snug">
              Tu clínica empresarial, lista en minutos
            </p>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              Inventario, farmacia, consultas y más — integrado con IHSS.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Inventario médico con control de lotes",
              "Dispensación con FEFO automático",
              "Expediente clínico y recetas digitales",
              "Integración con medicamentos IHSS",
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-green shrink-0" />
                <span className="text-[13px] text-slate-gray">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-iron-gray">© {new Date().getFullYear()} Remedis</p>
      </div>

      {/* Right — wizard */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center">
              <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
            </div>
            <span className="font-medium text-[18px] text-pure-white">Remedis</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {([1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
                  step === s ? "bg-sunbeam-yellow text-deep-space-black"
                  : step > s ? "bg-emerald-green text-deep-space-black"
                  : "bg-[#2a2825] text-iron-gray"
                }`}>
                  {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                </div>
                {i < 2 && <div className={`flex-1 h-px w-8 ${step > s ? "bg-emerald-green" : "bg-[#2a2825]"}`} />}
              </div>
            ))}
            <div className="ml-3 text-[12px] text-slate-gray">
              {step === 1 && "Tu empresa"}
              {step === 2 && "Tu cuenta"}
              {step === 3 && "Confirmar"}
            </div>
          </div>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-iron-gray" />
                <h1 className="text-[22px] font-medium text-pure-white">Tu empresa</h1>
              </div>
              <p className="text-[13px] text-slate-gray mb-7">Información básica de tu clínica u organización</p>

              <div className="space-y-4">
                <Field label="Nombre de la clínica / empresa">
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => handleCompanyName(e.target.value)}
                    placeholder="Empresa Ejemplo S.A."
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
                      placeholder="miempresa"
                      className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none pr-24"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-iron-gray">.remedis.com</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {slugStatus === "checking" && <span className="text-[11px] text-iron-gray">Verificando…</span>}
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

              <button
                onClick={handleStep1}
                disabled={!companyName || !slug || slugStatus === "taken" || slugStatus === "checking"}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-sunbeam-yellow text-deep-space-black font-medium text-[14px] rounded-[4px] py-2.5 transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-[12px] text-iron-gray mt-5">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-slate-gray hover:text-pure-white transition-colors underline underline-offset-2">
                  Inicia sesión
                </Link>
              </p>
            </div>
          )}

          {/* ── Step 2 ── */}
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

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-iron-gray" />
                <h1 className="text-[22px] font-medium text-pure-white">Todo listo</h1>
              </div>
              <p className="text-[13px] text-slate-gray mb-7">Revisa los datos antes de crear tu cuenta</p>

              <div className="bg-[#181716] rounded-[10px] divide-y divide-white/[0.05] mb-6">
                <SummaryRow label="Empresa"    value={companyName} />
                <SummaryRow label="Subdominio" value={`${slug}.remedis.com`} />
                {rtn && <SummaryRow label="RTN" value={rtn} />}
                <SummaryRow label="Administrador" value={adminName} />
                <SummaryRow label="Email" value={adminEmail} />
                <SummaryRow label="Plan" value="Básico (gratuito)" />
                <div className="px-4 py-3">
                  <p className="text-[11px] text-iron-gray uppercase tracking-wide mb-1">Se crearán</p>
                  <p className="text-[12px] text-slate-gray">2 almacenes por defecto: Farmacia Empresa y Farmacia IHSS</p>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-[12px] text-slate-gray shrink-0">{label}</span>
      <span className="text-[13px] text-pure-white text-right truncate">{value}</span>
    </div>
  );
}
