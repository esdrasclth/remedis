import { NextResponse } from "next/server";

const RESEND_API_URL = "https://api.resend.com/emails";
const TO_EMAIL = "esdrasclth@brandsofts.com";
const DEFAULT_FROM_EMAIL = "Remedis <onboarding@resend.dev>";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  clinic?: string;
  message?: string;
};

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
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
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to send the message.",
      },
      { status: 500 }
    );
  }
}
