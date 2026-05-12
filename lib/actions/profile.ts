"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";

type Result<T = void> = { success: true; data: T } | { success: false; error: string };

const profileSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
});

const passwordSchema = z.object({
  current:  z.string().min(1, "Ingresa tu contraseña actual"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: "Las contraseñas no coinciden", path: ["confirm"] });

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });
}

export async function updateProfile(raw: unknown): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { name: parsed.data.name },
  });

  revalidatePath("/profile");
  return { success: true, data: undefined };
}

export async function changePassword(raw: unknown): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { hashedPassword: true },
  });
  if (!user?.hashedPassword) return { success: false, error: "Esta cuenta no tiene contraseña configurada" };

  const valid = await bcrypt.compare(parsed.data.current, user.hashedPassword);
  if (!valid) return { success: false, error: "La contraseña actual es incorrecta" };

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data:  { hashedPassword: hashed },
  });

  return { success: true, data: undefined };
}

export async function updateAvatar(base64: string | null): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  if (base64 && base64.length > 2_000_000) {
    return { success: false, error: "La imagen es muy grande. Máximo 1.5 MB." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { avatar: base64 },
  });

  revalidatePath("/profile");
  return { success: true, data: undefined };
}
