import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { to, nombre, comercio, titulo, mensaje, comercio_id } = await req.json();

    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MAILTRAP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL,
          name: process.env.MAILTRAP_FROM_NAME,
        },
        to: [{ email: to }],
        subject: `Nueva notificación de ${comercio}`,
        html: `
          <div style="font-family: Arial; max-width:600px; margin:auto;">
            <h2>${titulo}</h2>
            <p>Hola ${nombre},</p>
            <p>${mensaje}</p>

            <a href="https://fidelizacion.benefi.com.ar/usuarios/${comercio_id}"
               style="display:inline-block; margin-top:20px; padding:12px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px;">
              Ir a mi cuenta
            </a>

            <p style="margin-top:20px; font-size:12px; color:#888;">
              Equipo ${comercio}
            </p>
          </div>
        `,
        category: "Notificacion",
      }),
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("ERROR EMAIL NOTIFICACION:", error);
    return NextResponse.json({ ok: false, error });
  }
}