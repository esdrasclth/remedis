"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations/register";

type RegisterResult =
  | { success: true; slug: string }
  | { success: false; error: string };

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  return !existing;
}

export async function registerTenant(raw: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { companyName, slug, rtn, adminName, adminEmail, password } = parsed.data;

  const slugTaken = await prisma.tenant.findUnique({ where: { slug } });
  if (slugTaken) return { success: false, error: "Ese subdominio ya está en uso" };

  const emailTaken = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (emailTaken) return { success: false, error: "Ese email ya está registrado" };

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async tx => {
    const tenant = await tx.tenant.create({
      data: {
        name:   companyName,
        slug,
        plan:   "BASIC",
        status: "ACTIVE",
        config: { rtn: rtn ?? "", prescriptionValidDays: 30, legalText: "" },
      },
    });

    await tx.user.create({
      data: {
        tenantId:       tenant.id,
        name:           adminName,
        email:          adminEmail,
        hashedPassword,
        role:           "ADMIN_CLINICA",
        isActive:       true,
      },
    });

    await tx.clinic.create({
      data: { tenantId: tenant.id, name: companyName },
    });

    await tx.warehouse.createMany({
      data: [
        { tenantId: tenant.id, name: "Farmacia Empresa", source: "EMPRESA" },
        { tenantId: tenant.id, name: "Farmacia IHSS",    source: "IHSS" },
      ],
    });
  });

  return { success: true, slug };
}
