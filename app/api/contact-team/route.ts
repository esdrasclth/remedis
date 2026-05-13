import { NextResponse } from "next/server";

const RESEND_API_URL = "https://api.resend.com/emails";
const TO_EMAIL = "esdrasclth@brandsofts.com";
const DEFAULT_FROM_EMAIL = "Remedis <onboarding@resend.dev>";
const MIN_SUBMISSION_AGE_MS = 2500;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_MESSAGE_LENGTH = 4000;
const rateLimitByIp = new Map<string, { count: number; resetAt: number }>();

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  clinic?: string;
  message?: string;
  website?: string;
  startedAt?: string;
};

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function canSubmit(ip: string) {
  const now = Date.now();

  if (rateLimitByIp.size > 500) {
    for (const [key, entry] of rateLimitByIp.entries()) {
      if (entry.resetAt <= now) {
        rateLimitByIp.delete(key);
      }
    }
  }

  const entry = rateLimitByIp.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtmlEmail(input: {
  name: string;
  email: string;
  phone: string;
  clinic: string;
  message: string;
}) {
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safePhone = escapeHtml(input.phone || "No indicado");
  const safeClinic = escapeHtml(input.clinic || "No indicado");
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f2f0;font-family:Arial,Helvetica,sans-serif;color:#0c0a08;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Nuevo contacto desde la landing de Remedis</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f2f0;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#0c0a08;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:32px 32px 24px;background:linear-gradient(135deg,#0c0a08 0%,#10131f 100%);">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:36px;height:36px;border-radius:10px;background:#e4f222;color:#0c0a08;font-weight:700;font-size:18px;text-align:center;vertical-align:middle;">R</td>
                    <td style="padding-left:12px;">
                      <div style="color:#ffffff;font-size:18px;font-weight:700;line-height:1;">Remedis</div>
                      <div style="color:#999ba3;font-size:12px;margin-top:3px;">Nuevo mensaje comercial</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(228,242,34,0.12);color:#e4f222;font-size:11px;font-weight:700;letter-spacing:0.08em;margin-bottom:18px;">CONTACTO DESDE LA LANDING</div>
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;color:#ffffff;">Solicitud de contacto</h1>
                <p style="margin:0 0 24px;color:#999ba3;font-size:14px;line-height:1.6;">Se recibió un nuevo mensaje desde el formulario de la página pública. A continuación está el resumen del contacto.</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="padding:12px 16px;background:#1a1919;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                      <div style="color:#999ba3;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Nombre</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;margin-top:4px;">${safeName}</div>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="padding:12px 16px;background:#1a1919;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                      <div style="color:#999ba3;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Clínica</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;margin-top:4px;">${safeClinic}</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="padding:12px 16px;background:#1a1919;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                      <div style="color:#999ba3;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Correo</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;margin-top:4px;"><a href="mailto:${safeEmail}" style="color:#ffffff;text-decoration:none;">${safeEmail}</a></div>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="padding:12px 16px;background:#1a1919;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                      <div style="color:#999ba3;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Teléfono</div>
                      <div style="color:#ffffff;font-size:14px;font-weight:700;margin-top:4px;">${safePhone}</div>
                    </td>
                  </tr>
                </table>

                <div style="padding:20px;border-radius:12px;background:#1a1919;border:1px solid rgba(255,255,255,0.06);margin-bottom:24px;">
                  <div style="color:#999ba3;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px;">Mensaje</div>
                  <div style="color:#ffffff;font-size:14px;line-height:1.7;">${safeMessage}</div>
                </div>

                <div style="padding:16px 18px;border-radius:12px;background:rgba(86,131,210,0.12);border:1px solid rgba(86,131,210,0.22);">
                  <div style="color:#5683d2;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">Origen</div>
                  <div style="color:#ffffff;font-size:13px;line-height:1.6;">Enviado desde la landing pública de Remedis</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;color:#4d505d;font-size:12px;line-height:1.6;">
                Remedis · BrandSofts
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing RESEND_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as ContactPayload;
    const name = sanitize(payload.name);
    const email = sanitize(payload.email);
    const phone = sanitize(payload.phone);
    const clinic = sanitize(payload.clinic);
    const message = sanitize(payload.message);
    const honeypot = sanitize(payload.website);
    const startedAt = Number(payload.startedAt || "0");
    const submissionAge = Number.isFinite(startedAt) ? Date.now() - startedAt : Infinity;
    const clientIp = getClientIp(request);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (honeypot) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (submissionAge < MIN_SUBMISSION_AGE_MS) {
      return NextResponse.json(
        { error: "Form submitted too quickly." },
        { status: 429 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 }
      );
    }

    if (!canSubmit(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const subject = `Contacto comercial Remedis - ${clinic || "Sin tipo de clínica"}`;
    const text = [
      `Nombre: ${name}`,
      `Correo: ${email}`,
      `Teléfono: ${phone || "No indicado"}`,
      `Tipo de clínica: ${clinic || "No indicado"}`,
      "",
      "Mensaje:",
      message,
    ].join("\n");
    const html = renderHtmlEmail({
      name,
      email,
      phone,
      clinic,
      message,
    });

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [TO_EMAIL],
        subject,
        text,
        html,
        headers: {
          "Reply-To": email,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Resend rejected the message.",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to send the message.",
      },
      { status: 500 }
    );
  }
}
