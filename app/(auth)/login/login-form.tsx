"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("Credenciales incorrectas. Intenta de nuevo.");
    else router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex bg-deep-space-black">
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10"
        style={{ background: "#0e0d0b" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center">
            <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
          </div>
          <span className="text-pure-white font-medium text-[18px]">Remedis</span>
        </div>

        <div className="space-y-3">
          <p className="text-[26px] font-medium text-pure-white leading-snug">
            Gestión clínica empresarial para Honduras
          </p>
          <p className="text-[14px] text-slate-gray leading-relaxed">
            Inventario médico, dispensación, consultas y farmacia — todo en un solo sistema.
          </p>
        </div>

        <p className="text-[12px] text-iron-gray">© {new Date().getFullYear()} Remedis</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[4px] bg-sunbeam-yellow flex items-center justify-center">
              <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
            </div>
            <span className="font-medium text-[18px] text-pure-white">Remedis</span>
          </div>

          <h1 className="text-[24px] font-medium text-pure-white mb-1">
            Iniciar sesión
          </h1>
          <p className="text-[14px] text-slate-gray mb-7">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-gray uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                required
                autoComplete="email"
                className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-iron-gray outline-none focus:border-slate-gray transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-gray uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#2a2825] rounded-[4px] px-4 py-2.5 pr-11 text-[14px] text-pure-white placeholder:text-iron-gray outline-none focus:border-slate-gray transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-iron-gray hover:text-slate-gray transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-blaze-orange/10 rounded-[4px] px-3 py-2.5">
                <p className="text-[13px] text-blaze-orange">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sunbeam-yellow text-deep-space-black font-medium text-[14px] rounded-[4px] py-2.5 mt-1 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-[12px] text-iron-gray mt-8">
            © {new Date().getFullYear()} Remedis · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
