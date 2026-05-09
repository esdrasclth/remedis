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
    if (result?.error) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#f2f0ee" }}>
      {/* Left panel – branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "#1a1918" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-sunbeam-yellow flex items-center justify-center">
            <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
          </div>
          <span className="text-white font-medium text-[18px]">Remedis</span>
        </div>
        <div>
          <p className="text-[28px] font-medium text-white leading-snug mb-3">
            Gestión clínica empresarial para Honduras
          </p>
          <p className="text-[14px] text-[#8a8784] leading-relaxed">
            Control de inventario, citas, recetas y farmacia — todo en un solo lugar.
          </p>
        </div>
        <p className="text-[12px] text-[#4d4b48]">
          © {new Date().getFullYear()} Remedis
        </p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[6px] bg-sunbeam-yellow flex items-center justify-center">
              <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
            </div>
            <span className="font-medium text-[18px] text-[#1a1918]">Remedis</span>
          </div>

          <h1 className="text-[24px] font-medium text-[#1a1918] mb-1">
            Iniciar sesión
          </h1>
          <p className="text-[14px] text-[#6b6966] mb-7">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#52504e] uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                required
                autoComplete="email"
                className="w-full bg-white border border-[#d8d4cf] rounded-[8px] px-3.5 py-2.5 text-[14px] text-[#1a1918] placeholder:text-[#b0ada9] outline-none focus:border-[#1a1918] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#52504e] uppercase tracking-wide">
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
                  className="w-full bg-white border border-[#d8d4cf] rounded-[8px] px-3.5 py-2.5 pr-11 text-[14px] text-[#1a1918] placeholder:text-[#b0ada9] outline-none focus:border-[#1a1918] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0ada9] hover:text-[#6b6966] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-[#fff0ed] border border-[#ffcfc7] rounded-[8px] px-3.5 py-2.5">
                <span className="text-[13px] text-blaze-orange">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1918] text-white font-medium text-[14px] rounded-[6px] py-2.5 mt-1 transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-[12px] text-[#b0ada9] mt-8">
            © {new Date().getFullYear()} Remedis · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
