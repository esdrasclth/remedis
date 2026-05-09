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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="min-h-screen bg-deep-space-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-sunbeam-yellow">
            <Activity className="w-5 h-5 text-deep-space-black" strokeWidth={2.5} />
          </div>
          <span
            className="text-pure-white font-medium text-[20px]"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            Remedis
          </span>
        </div>

        {/* Card */}
        <div className="bg-ash-gray rounded-[12px] p-8 space-y-5">
          <div>
            <h1
              className="text-pure-white font-medium text-[24px]"
              style={{ fontFeatureSettings: '"ss01"' }}
            >
              Iniciar sesión
            </h1>
            <p className="text-slate-gray text-[13px] mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] text-slate-gray">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                required
                autoComplete="email"
                className="w-full bg-transparent border border-iron-gray rounded-[10px] px-4 py-2.5 text-[14px] text-pure-white placeholder:text-slate-gray/60 outline-none focus:border-pure-white/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] text-slate-gray">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent border border-iron-gray rounded-[10px] px-4 py-2.5 pr-10 text-[14px] text-pure-white placeholder:text-slate-gray/60 outline-none focus:border-pure-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray hover:text-pure-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-blaze-orange text-[13px] bg-blaze-orange/10 rounded-[6px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sunbeam-yellow text-deep-space-black font-medium text-[14px] rounded py-2.5 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-gray/50 text-[12px] mt-6">
          © {new Date().getFullYear()} Remedis. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
