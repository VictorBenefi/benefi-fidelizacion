import { NextResponse } from "next/server";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const session = getComercioSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sesión de comercio no válida.",
        },
        { status: 401 }
      );
    }

    const { to, nombre, comercio, titulo, mensaje, comercio_id } =
      await req.json();

    if (!comercio_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta comercio_id.",
        },
        { status: 400 }
      );
    }

    if (session.comercio_id !== comercio_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "No tenés permiso para enviar notificaciones desde este comercio.",
        },
        { status: 403 }
      );
    }

    const { data: usuarioComercio, error: usuarioComercioError } =
    await supabaseAdmin
      .from("usuarios_comercios")
      .select(`
        usuario_id,
        usuarios!inner (
          nombre_completo,
          email
        )
      `)
      .eq("comercio_id", session.comercio_id)
      .eq("usuarios.email", to)
      .maybeSingle();

    if (usuarioComercioError) {
      console.error(
        "Error validando destinatario de la notificación:",
        usuarioComercioError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo validar el destinatario.",
        },
        { status: 500 }
      );
    }

    if (!usuarioComercio) {
      return NextResponse.json(
        {
          ok: false,
          error: "El destinatario no pertenece a este comercio.",
        },
        { status: 403 }
      );
    }

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