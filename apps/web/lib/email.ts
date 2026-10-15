const RESEND_API  = "https://api.resend.com/emails";
const FROM        = process.env.EMAIL_FROM ?? "Remedis <noreply@remedis.com>";
const API_KEY     = process.env.RESEND_API_KEY ?? "";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "remedis.brandsofts.com";

function tenantUrl(slug: string, path = ""): string {
  const base = ROOT_DOMAIN.startsWith("localhost")
    ? `http://localhost:3000`           // dev: no subdomains
    : `https://${slug}.${ROOT_DOMAIN}`; // prod: subdomain per tenant
  return `${base}${path}`;
}

interface SendOptions {
  to:      string | string[];
  subject: string;
  html:    string;
}

export async function sendEmail({ to, subject, html }: SendOptions): Promise<boolean> {
  if (!API_KEY) {
    console.warn("[email] RESEND_API_KEY no configurado — email omitido");
    return false;
  }

  const recipients = Array.isArray(to) ? to : [to];
  console.log(`[email] Enviando "${subject}" → ${recipients.join(", ")} desde ${FROM}`);

  try {
    const res = await fetch(RESEND_API, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: recipients, subject, html }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`[email] Resend rechazó el envío (${res.status}):`, JSON.stringify(body));
      return false;
    }

    console.log(`[email] Enviado OK. ID: ${(body as any).id ?? "—"}`);
    return true;
  } catch (err) {
    console.error("[email] Error de red al enviar:", err);
    return false;
  }
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; background: #f4f3f1; padding: 32px 16px;">
      <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: #0c0a08; padding: 28px 36px; display: flex; align-items: center; gap: 12px;">
          <div style="background: #e4f222; border-radius: 4px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: #0c0a08; vertical-align: middle;">R</div>
          <span style="color: #ffffff; font-size: 18px; font-weight: 600; vertical-align: middle; margin-left: 10px;">Remedis</span>
        </div>
        <!-- Body -->
        <div style="padding: 36px 36px 28px;">
          ${content}
        </div>
        <!-- Footer -->
        <div style="background: #f4f3f1; padding: 16px 36px; font-size: 12px; color: #9395a0; border-top: 1px solid #ebe9e6;">
          © ${new Date().getFullYear()} Remedis · Sistema de Gestión Clínica
        </div>
      </div>
    </div>
  `;
}

function btn(label: string, url: string): string {
  return `<a href="${url}" style="display: inline-block; background: #e4f222; color: #0c0a08; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin-top: 24px;">${label}</a>`;
}

// ─── Welcome email (new tenant registration) ──────────────────────────────────

export function welcomeTenantEmail(data: {
  adminName:   string;
  companyName: string;
  slug:        string;
  clinicType:  "EMPRESA" | "PRIVADA";
  trialDays:   number;
}): string {
  const loginUrl  = tenantUrl(data.slug, "/login");
  const displayUrl = ROOT_DOMAIN.startsWith("localhost") ? "localhost:3000" : `${data.slug}.${ROOT_DOMAIN}`;
  const typeLabel = data.clinicType === "EMPRESA" ? "Clínica de Empresa" : "Clínica Privada";

  return emailWrapper(`
    <h1 style="margin: 0 0 6px; font-size: 22px; color: #0c0a08;">¡Bienvenido a Remedis, ${data.adminName}!</h1>
    <p style="margin: 0 0 20px; font-size: 14px; color: #5c5e66;">Tu clínica <strong>${data.companyName}</strong> (${typeLabel}) ha sido creada exitosamente.</p>

    <div style="background: #f4f3f1; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #0c0a08; text-transform: uppercase; letter-spacing: 0.05em;">Tu acceso</p>
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; color: #5c5e66; width: 120px;">Plataforma</td>
          <td style="padding: 5px 0; font-family: monospace; color: #0c0a08;">${displayUrl}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #5c5e66;">Plan</td>
          <td style="padding: 5px 0; color: #0c0a08;">Trial · ${data.trialDays} días gratis</td>
        </tr>
      </table>
    </div>

    <p style="margin: 0; font-size: 14px; color: #5c5e66;">Durante tu período de prueba tendrás acceso completo a:</p>
    <ul style="margin: 12px 0 0; padding-left: 20px; font-size: 14px; color: #5c5e66; line-height: 1.8;">
      <li>Expedientes clínicos y consultas médicas</li>
      <li>Farmacia e inventario médico</li>
      <li>Dispensación y recetas digitales</li>
      ${data.clinicType === "EMPRESA" ? "<li>Integración con medicamentos del seguro social</li>" : "<li>Gestión de pacientes externos</li>"}
    </ul>

    ${btn("Iniciar sesión en Remedis", loginUrl)}

    <p style="margin: 24px 0 0; font-size: 13px; color: #9395a0;">¿Tienes preguntas? Responde este correo y te ayudamos.</p>
  `);
}

// ─── New user credentials email ───────────────────────────────────────────────

export function newUserCredentialsEmail(data: {
  userName:    string;
  email:       string;
  password:    string;
  companyName: string;
  slug:        string;
  role:        string;
}): string {
  const loginUrl   = tenantUrl(data.slug, "/login");
  const displayUrl = ROOT_DOMAIN.startsWith("localhost") ? "localhost:3000" : `${data.slug}.${ROOT_DOMAIN}`;

  const roleLabels: Record<string, string> = {
    ADMIN_CLINICA: "Administrador", MEDICO: "Médico", ENFERMERA: "Enfermera",
    FARMACEUTICO: "Farmacéutico", RRHH: "RRHH", AUDITOR: "Auditor", RECEPCIONISTA: "Recepcionista",
  };

  return emailWrapper(`
    <h1 style="margin: 0 0 6px; font-size: 22px; color: #0c0a08;">Tu cuenta en Remedis está lista</h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #5c5e66;">Hola <strong>${data.userName}</strong>, el administrador de <strong>${data.companyName}</strong> creó tu cuenta con el rol de <strong>${roleLabels[data.role] ?? data.role}</strong>.</p>

    <div style="background: #f4f3f1; border-radius: 8px; padding: 20px 24px; margin-bottom: 8px;">
      <p style="margin: 0 0 14px; font-size: 13px; font-weight: 600; color: #0c0a08; text-transform: uppercase; letter-spacing: 0.05em;">Tus credenciales de acceso</p>
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #5c5e66; width: 120px;">Plataforma</td>
          <td style="padding: 6px 0; font-family: monospace; color: #0c0a08;">${displayUrl}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #5c5e66;">Usuario</td>
          <td style="padding: 6px 0; color: #0c0a08;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #5c5e66;">Contraseña</td>
          <td style="padding: 6px 0; font-family: monospace; font-size: 16px; font-weight: 700; color: #0c0a08; letter-spacing: 0.08em;">${data.password}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 8px 0 0; font-size: 12px; color: #9395a0;">⚠ Por seguridad, cambia tu contraseña después de iniciar sesión por primera vez.</p>

    ${btn("Iniciar sesión", loginUrl)}
  `);
}

// ─── Plan request (internal notification) ─────────────────────────────────────

export function planRequestEmail(data: {
  contactName:  string;
  contactEmail: string;
  companyName:  string;
  companySlug:  string;
  planName:     string;
  billing:      string;
  message?:     string | null;
}): string {
  const billingLabel = data.billing === "annual" ? "Anual" : "Mensual";
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <div style="background: #1a1917; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #f5c842; margin: 0; font-size: 22px;">Nueva solicitud de plan</h1>
        <p style="color: #9ca3af; margin: 6px 0 0; font-size: 14px;">Remedis · Sistema de Gestión Médica</p>
      </div>
      <div style="background: #f9f9f9; padding: 24px 32px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 140px; font-weight: 600;">Contacto</td>
            <td style="padding: 8px 0;">${data.contactName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${data.contactEmail}">${data.contactEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Empresa</td>
            <td style="padding: 8px 0;">${data.companyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Subdominio</td>
            <td style="padding: 8px 0; font-family: monospace;">${data.companySlug}.${ROOT_DOMAIN}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Plan solicitado</td>
            <td style="padding: 8px 0; font-weight: 700; color: #1a1917;">${data.planName} · ${billingLabel}</td>
          </tr>
          ${data.message ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-weight: 600; vertical-align: top;">Mensaje</td>
            <td style="padding: 8px 0;">${data.message}</td>
          </tr>` : ""}
        </table>

        <div style="margin-top: 20px; padding: 16px; background: #fff3cd; border-radius: 8px; border: 1px solid #fbbf24; font-size: 13px; color: #92400e;">
          <strong>Acción requerida:</strong> Contactar al cliente, acordar pago y asignar el plan desde el panel de administración en <strong>${data.companySlug}.${ROOT_DOMAIN}/admin</strong>.
        </div>
      </div>
      <div style="background: #f3f4f6; padding: 14px 32px; border-radius: 0 0 12px 12px; font-size: 12px; color: #9ca3af; border: 1px solid #e5e7eb; border-top: none;">
        Remedis · Sistema de Gestión Médica · ${new Date().toLocaleDateString("es-HN")}
      </div>
    </div>
  `;
}

// ─── Trial expiring (3 days left) ────────────────────────────────────────────

export function trialExpiringEmail(data: {
  companyName: string;
  slug:        string;
  daysLeft:    number;
}): string {
  const upgradeUrl = tenantUrl(data.slug, "/settings?tab=plan");
  return emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #0c0a08;">Tu período de prueba vence en ${data.daysLeft} día${data.daysLeft !== 1 ? "s" : ""}</h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #5c5e66;">
      Hola equipo de <strong>${data.companyName}</strong> — tu acceso gratuito a Remedis está por terminar.
      No pierdas el acceso a tus expedientes, farmacia e inventario.
    </p>

    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⏳ Quedan ${data.daysLeft} día${data.daysLeft !== 1 ? "s" : ""}</strong> — después tu cuenta entrará en modo restringido y no podrás acceder al sistema.
      </p>
    </div>

    <p style="margin: 0 0 8px; font-size: 14px; color: #5c5e66; font-weight: 600;">Nuestros planes:</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px;">
      <tr style="background: #f4f3f1;"><td style="padding: 10px 14px; font-weight: 600; color: #0c0a08;">Básico</td><td style="padding: 10px 14px; color: #5c5e66;">Hasta 3 usuarios · farmacia · expedientes</td></tr>
      <tr><td style="padding: 10px 14px; font-weight: 600; color: #0c0a08;">Profesional</td><td style="padding: 10px 14px; color: #5c5e66;">Hasta 10 usuarios · reportes avanzados</td></tr>
      <tr style="background: #f4f3f1;"><td style="padding: 10px 14px; font-weight: 600; color: #0c0a08;">Enterprise</td><td style="padding: 10px 14px; color: #5c5e66;">Usuarios ilimitados · soporte dedicado</td></tr>
    </table>

    ${btn("Ver planes y actualizar", upgradeUrl)}
    <p style="margin: 20px 0 0; font-size: 13px; color: #9395a0;">¿Preguntas? Responde este correo.</p>
  `);
}

// ─── Trial expired ────────────────────────────────────────────────────────────

export function trialExpiredEmail(data: {
  companyName: string;
  slug:        string;
}): string {
  const upgradeUrl = tenantUrl(data.slug, "/settings?tab=plan");
  return emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #0c0a08;">Tu período de prueba ha terminado</h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #5c5e66;">
      Hola equipo de <strong>${data.companyName}</strong> — tu prueba gratuita de 14 días ha concluido.
    </p>
    <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        <strong>🔒 Tu acceso está restringido.</strong> Para recuperar el acceso completo activa un plan. Tus datos están seguros — no hemos eliminado nada.
      </p>
    </div>
    ${btn("Activar mi plan ahora", upgradeUrl)}
    <p style="margin: 20px 0 0; font-size: 13px; color: #9395a0;">¿Necesitas ayuda? Responde este correo.</p>
  `);
}

// ─── Welcome to paid plan ─────────────────────────────────────────────────────

export function planWelcomeEmail(data: {
  companyName: string;
  slug:        string;
  plan:        string;
  expiresAt?:  Date | null;
}): string {
  const loginUrl  = tenantUrl(data.slug, "/dashboard");
  const labels: Record<string, string>   = { BASIC: "Básico", PROFESSIONAL: "Profesional", ENTERPRISE: "Enterprise" };
  const features: Record<string, string[]> = {
    BASIC:        ["Hasta 3 usuarios", "Farmacia e inventario", "Expedientes y recetas digitales", "Soporte por correo"],
    PROFESSIONAL: ["Hasta 10 usuarios", "Todo lo del Básico", "Reportes avanzados", "Soporte prioritario"],
    ENTERPRISE:   ["Usuarios ilimitados", "Todo lo del Profesional", "Personalización y SLA", "Soporte dedicado 24/7"],
  };
  const planLabel = labels[data.plan] ?? data.plan;
  const feats     = features[data.plan] ?? [];
  const expiry    = data.expiresAt
    ? `<p style="margin:10px 0 0;font-size:13px;color:#166534;">Activo hasta el <strong>${data.expiresAt.toLocaleDateString("es-HN",{day:"numeric",month:"long",year:"numeric"})}</strong>.</p>`
    : "";
  return emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #0c0a08;">¡Bienvenidos al plan ${planLabel}!</h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #5c5e66;">Hola equipo de <strong>${data.companyName}</strong> — su cuenta ha sido activada con el plan <strong>${planLabel}</strong>. ¡Gracias por confiar en Remedis!</p>
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">✅ Plan ${planLabel} activo — incluye</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #166534; line-height: 1.9;">${feats.map(f => `<li>${f}</li>`).join("")}</ul>
      ${expiry}
    </div>
    ${btn("Ir a mi clínica", loginUrl)}
    <p style="margin: 20px 0 0; font-size: 13px; color: #9395a0;">¿Preguntas sobre tu plan? Responde este correo.</p>
  `);
}

// ─── Account suspended ────────────────────────────────────────────────────────

export function accountSuspendedEmail(data: {
  companyName:  string;
  contactEmail: string;
}): string {
  return emailWrapper(`
    <h1 style="margin: 0 0 8px; font-size: 22px; color: #0c0a08;">Tu cuenta ha sido suspendida</h1>
    <p style="margin: 0 0 24px; font-size: 14px; color: #5c5e66;">Hola equipo de <strong>${data.companyName}</strong> — el acceso a tu cuenta en Remedis ha sido temporalmente suspendido.</p>
    <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>🔒 Acceso restringido.</strong> Tus datos están seguros. Para resolver esta situación contáctanos:</p>
    </div>
    <p style="margin: 0; font-size: 15px;"><a href="mailto:${data.contactEmail}" style="color: #0066ff; font-weight: 600;">${data.contactEmail}</a></p>
    <p style="margin: 20px 0 0; font-size: 13px; color: #9395a0;">Nuestro equipo te responderá a la brevedad.</p>
  `);
}

