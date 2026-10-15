import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, trialExpiringEmail, trialExpiredEmail } from "@/lib/email";

// Protege el endpoint con un secret para que solo lo llame el cron de Dokploy
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // si no hay secret configurado, permite en desarrollo
  return req.headers.get("x-cron-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now   = new Date();
  const sent  = { expiring: 0, expired: 0 };

  // ── Trials que vencen en exactamente 3 días (ventana: entre 2.5 y 3.5 días) ──
  const expiringFrom = new Date(now.getTime() + 2.5 * 86400000);
  const expiringTo   = new Date(now.getTime() + 3.5 * 86400000);

  const expiring = await prisma.tenant.findMany({
    where: {
      plan:        "TRIAL",
      status:      "ACTIVE",
      trialEndsAt: { gte: expiringFrom, lte: expiringTo },
    },
    select: { name: true, slug: true, trialEndsAt: true, users: { select: { email: true }, where: { isActive: true } } },
  });

  for (const t of expiring) {
    const daysLeft  = Math.ceil((t.trialEndsAt!.getTime() - now.getTime()) / 86400000);
    const recipients = t.users.map(u => u.email);
    if (!recipients.length) continue;

    const ok = await sendEmail({
      to:      recipients,
      subject: `⏳ Tu período de prueba vence en ${daysLeft} días — ${t.name}`,
      html:    trialExpiringEmail({ companyName: t.name, slug: t.slug, daysLeft }),
    });
    if (ok) sent.expiring++;
  }

  // ── Trials vencidos en las últimas 24 horas (primera vez que los detectamos) ──
  const expiredFrom = new Date(now.getTime() - 24 * 86400000);

  const expired = await prisma.tenant.findMany({
    where: {
      plan:        "TRIAL",
      status:      "ACTIVE",
      trialEndsAt: { gte: expiredFrom, lte: now },
    },
    select: { name: true, slug: true, users: { select: { email: true }, where: { isActive: true } } },
  });

  for (const t of expired) {
    const recipients = t.users.map(u => u.email);
    if (!recipients.length) continue;

    const ok = await sendEmail({
      to:      recipients,
      subject: `🔒 Tu período de prueba ha terminado — ${t.name}`,
      html:    trialExpiredEmail({ companyName: t.name, slug: t.slug }),
    });
    if (ok) sent.expired++;
  }

  console.log(`[cron/trial-reminders] expiring=${sent.expiring} expired=${sent.expired}`);
  return NextResponse.json({ ok: true, ...sent });
}
