import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Crear tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Clínica Demo",
      slug: "demo",
      plan: "PROFESSIONAL",
      status: "ACTIVE",
    },
  });
  console.log(`✓ Tenant: ${tenant.name} (slug: ${tenant.slug})`);

  // 2. Crear usuarios
  const password = await bcrypt.hash("remedis123", 12);

  const users = [
    { email: "admin@demo.com",      name: "Admin Sistema",    role: "ADMIN_CLINICA"  as const },
    { email: "medico@demo.com",     name: "Dr. Juan Pérez",   role: "MEDICO"         as const },
    { email: "farmacia@demo.com",   name: "Ana Farmacéutica", role: "FARMACEUTICO"   as const },
    { email: "enfermera@demo.com",  name: "Rosa Enfermera",   role: "ENFERMERA"      as const },
    { email: "rrhh@demo.com",       name: "Carlos RRHH",      role: "RRHH"           as const },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        hashedPassword: password,
        role: u.role,
        tenantId: tenant.id,
        isActive: true,
      },
    });
    console.log(`✓ Usuario: ${user.name} <${user.email}> [${user.role}]`);
  }

  // 3. Crear clínica
  const clinic = await prisma.clinic.upsert({
    where: { id: "clinic-demo-001" },
    update: {},
    create: {
      id: "clinic-demo-001",
      tenantId: tenant.id,
      name: "Sede Principal",
      address: "Tegucigalpa, Honduras",
      phone: "+504 2222-0000",
    },
  });
  console.log(`✓ Clínica: ${clinic.name}`);

  // 4. Crear almacenes
  await prisma.warehouse.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, clinicId: clinic.id, name: "Almacén Empresa", source: "EMPRESA" },
      { tenantId: tenant.id, clinicId: clinic.id, name: "Almacén IHSS",    source: "IHSS" },
    ],
  });
  console.log(`✓ Almacenes creados`);

  console.log("\n──────────────────────────────────────");
  console.log("Credenciales para iniciar sesión:");
  console.log("──────────────────────────────────────");
  for (const u of users) {
    console.log(`${u.role.padEnd(14)} │ ${u.email.padEnd(22)} │ remedis123`);
  }
  console.log("──────────────────────────────────────\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
