"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Camera, Check, X, Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile, changePassword, updateAvatar } from "@/lib/actions/profile";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN_CLINICA: "Admin Clínica",
  MEDICO: "Médico", ENFERMERA: "Enfermera", FARMACEUTICO: "Farmacéutico",
  RRHH: "RRHH", AUDITOR: "Auditor", RECEPCIONISTA: "Recepcionista",
};

function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  return (email?.[0] ?? "U").toUpperCase();
}

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatar: string | null;
    createdAt: Date;
  };
}

// ─── Avatar Section ───────────────────────────────────────────────────────────

function AvatarSection({ user }: ProfileClientProps) {
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) { setMsg("Imagen muy grande. Máximo 2 MB."); return; }

    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target?.result as string;
      setSaving(true);
      setMsg("");
      const result = await updateAvatar(base64);
      setSaving(false);
      if (result.success) {
        setAvatar(base64);
        setMsg("Foto actualizada");
      } else {
        setMsg(result.error);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleRemove() {
    setSaving(true);
    const result = await updateAvatar(null);
    setSaving(false);
    if (result.success) { setAvatar(null); setMsg("Foto eliminada"); }
  }

  return (
    <div className="bg-ash-gray rounded-[12px] p-6 space-y-4">
      <h3 className="text-[11px] text-[#5a5854] uppercase tracking-wide font-medium">Foto de perfil</h3>
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-ocean-abyss flex items-center justify-center overflow-hidden">
            {avatar ? (
              <Image src={avatar} alt={user.name ?? ""} width={80} height={80} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-[24px] font-medium text-sunbeam-yellow">
                {initials(user.name, user.email)}
              </span>
            )}
          </div>
          {saving && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={saving}>
            <Camera className="w-3.5 h-3.5" />
            Cambiar foto
          </Button>
          {avatar && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={saving}>
              <X className="w-3.5 h-3.5" />
              Eliminar
            </Button>
          )}
          {msg && (
            <p className={`text-[12px] ${msg.includes("actualizada") || msg.includes("eliminada") ? "text-emerald-green" : "text-blaze-orange"}`}>
              {msg}
            </p>
          )}
          <p className="text-[11px] text-iron-gray">JPG, PNG o WebP · Máx. 2 MB</p>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Info Section ─────────────────────────────────────────────────────

function ProfileInfoSection({ user }: ProfileClientProps) {
  const [name, setName] = useState(user.name ?? "");
  const [msg, setMsg]   = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    startTransition(async () => {
      const result = await updateProfile({ name });
      setMsg(result.success ? "Cambios guardados" : result.error);
    });
  }

  return (
    <div className="bg-ash-gray rounded-[12px] p-6 space-y-4">
      <h3 className="text-[11px] text-[#5a5854] uppercase tracking-wide font-medium flex items-center gap-2">
        <User className="w-3.5 h-3.5" /> Información personal
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="name"
            label="Nombre completo"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
          />
          <Input
            id="email"
            label="Correo electrónico"
            value={user.email}
            disabled
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[#5a5854] font-medium mb-1.5">Rol</p>
            <div className="h-9 px-3 rounded-[6px] bg-[#1e1c1b] flex items-center">
              <span className="text-[13px] text-slate-gray">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[#5a5854] font-medium mb-1.5">Cuenta creada</p>
            <div className="h-9 px-3 rounded-[6px] bg-[#1e1c1b] flex items-center">
              <span className="text-[13px] text-slate-gray">
                {new Date(user.createdAt).toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        {msg && (
          <p className={`text-[12px] ${msg === "Cambios guardados" ? "text-emerald-green" : "text-blaze-orange"}`}>
            {msg}
          </p>
        )}
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Password Section ─────────────────────────────────────────────────────────

function PasswordSection() {
  const [form, setForm]     = useState({ current: "", password: "", confirm: "" });
  const [show, setShow]     = useState({ current: false, password: false, confirm: false });
  const [msg, setMsg]       = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    startTransition(async () => {
      const result = await changePassword(form);
      if (result.success) {
        setForm({ current: "", password: "", confirm: "" });
        setMsg("Contraseña actualizada correctamente");
      } else {
        setMsg(result.error);
      }
    });
  }

  return (
    <div className="bg-ash-gray rounded-[12px] p-6 space-y-4">
      <h3 className="text-[11px] text-[#5a5854] uppercase tracking-wide font-medium flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" /> Cambiar contraseña
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(["current", "password", "confirm"] as const).map(field => {
          const labels = { current: "Contraseña actual", password: "Nueva contraseña", confirm: "Confirmar nueva contraseña" };
          return (
            <div key={field} className="relative max-w-sm">
              <Input
                id={field}
                label={labels[field]}
                type={show[field] ? "text" : "password"}
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
                className="absolute right-3 top-7 text-iron-gray hover:text-slate-gray transition-colors"
              >
                {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          );
        })}
        {msg && (
          <p className={`text-[12px] ${msg.includes("correctamente") ? "text-emerald-green" : "text-blaze-orange"}`}>
            {msg}
          </p>
        )}
        <Button type="submit" disabled={isPending || !form.current || !form.password || !form.confirm}>
          {isPending ? "Actualizando..." : "Actualizar contraseña"}
        </Button>
      </form>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProfileClient({ user }: ProfileClientProps) {
  return (
    <div className="space-y-5 max-w-2xl">
      <AvatarSection user={user} />
      <ProfileInfoSection user={user} />
      <PasswordSection />
    </div>
  );
}
