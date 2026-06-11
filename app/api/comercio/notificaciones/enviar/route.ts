import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type BodyType = {
  comercio_id?: string
  titulo?: string
  mensaje?: string
  tipo?: string
  modo_envio?: 'uno' | 'grupo' | 'todos'
  usuario_ids?: string[]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BodyType

    const comercioId = body.comercio_id?.trim()
    const titulo = body.titulo?.trim()
    const mensaje = body.mensaje?.trim()
    const tipo = body.tipo?.trim() || 'info'
    const modoEnvio = body.modo_envio
    const usuarioIds = body.usuario_ids || []

    if (!comercioId) {
      return NextResponse.json({ ok: false, error: 'Falta comercio_id.' }, { status: 400 })
    }

    if (!titulo) {
      return NextResponse.json({ ok: false, error: 'Falta el título.' }, { status: 400 })
    }

    if (!mensaje) {
      return NextResponse.json({ ok: false, error: 'Falta el mensaje.' }, { status: 400 })
    }

    if (!modoEnvio || !['uno', 'grupo', 'todos'].includes(modoEnvio)) {
      return NextResponse.json({ ok: false, error: 'Modo de envío inválido.' }, { status: 400 })
    }

    let destinatarios: string[] = []

    if (modoEnvio === 'uno') {
      if (usuarioIds.length !== 1) {
        return NextResponse.json(
          { ok: false, error: 'Debés seleccionar un usuario.' },
          { status: 400 }
        )
      }

      destinatarios = usuarioIds
    }

    if (modoEnvio === 'grupo') {
      if (!usuarioIds.length) {
        return NextResponse.json(
          { ok: false, error: 'Debés seleccionar al menos un usuario.' },
          { status: 400 }
        )
      }

      destinatarios = usuarioIds
    }

    if (modoEnvio === 'todos') {
      const { data: relaciones, error: relError } = await supabaseAdmin
        .from('usuarios_comercios')
        .select('usuario_id')
        .eq('comercio_id', comercioId)

      if (relError) {
        return NextResponse.json(
          { ok: false, error: 'No se pudieron obtener los usuarios del comercio.' },
          { status: 500 }
        )
      }

      destinatarios = Array.from(
        new Set((relaciones || []).map((item: any) => item.usuario_id).filter(Boolean))
      )
    }

    destinatarios = Array.from(new Set(destinatarios.filter(Boolean)))

    if (!destinatarios.length) {
      return NextResponse.json(
        { ok: false, error: 'No hay destinatarios para enviar la notificación.' },
        { status: 400 }
      )
    }

    const { data: notificacionData, error: notificacionError } = await supabaseAdmin
      .from('notificaciones')
      .insert({
        comercio_id: comercioId,
        titulo,
        mensaje,
        tipo,
        activa: true,
      })
      .select('id')
      .single()

    if (notificacionError || !notificacionData) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo crear la notificación.' },
        { status: 500 }
      )
    }
 // 👉 Obtener IDs de usuarios vinculados a la notificación
        const { data: usuariosRelacionados } = await supabaseAdmin
          .from("usuarios_notificaciones")
          .select("usuario_id")
          .eq("notificacion_id", notificacionData.id);

        // 👉 Convertir a array de IDs
        const usuariosIds = usuariosRelacionados?.map(u => u.usuario_id) || [];

        // 👉 Obtener datos de usuarios
        const { data: usuarios } = await supabaseAdmin
          .from("usuarios")
          .select("email, nombre_completo")
          .in("id", usuariosIds);

            // 👉 Obtener nombre del comercio
            const { data: comercioData } = await supabaseAdmin
              .from("comercios")
              .select("nombre_fantasia")
              .eq("id", comercioId)
              .single();

    const nombreComercio = comercioData?.nombre_fantasia || "tu comercio";

    // 👉 Enviar emails
    await Promise.all(
      (usuarios || []).map(async (user) => {
        if (!user.email) return;

        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/emails/notificacion`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: user.email,
            nombre: user.nombre_completo || "Cliente",
            comercio: nombreComercio,
            titulo,
            mensaje,
            comercio_id: comercioId,
          }),
        });
      })
    );

    const payloadUsuarios = destinatarios.map((usuarioId) => ({
      notificacion_id: notificacionData.id,
      usuario_id: usuarioId,
      leida: false,
    }))

    const { error: usuariosNotifError } = await supabaseAdmin
      .from('usuarios_notificaciones')
      .insert(payloadUsuarios)

if (usuariosNotifError) {
  return NextResponse.json(
    { ok: false, error: 'No se pudo asignar la notificación a los usuarios.' },
    { status: 500 }
  )
}

// Obtener datos de usuarios destinatarios
const { data: usuariosEmail } = await supabaseAdmin
  .from('usuarios')
  .select('id, email, nombre_completo')
  .in('id', destinatarios)

// Enviar emails
const resultadosEmail = await Promise.allSettled(
  (usuariosEmail || [])
    .filter((u) => !!u.email)
    .map(async (usuario) => {
      const response = await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MAILTRAP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: process.env.MAILTRAP_FROM_EMAIL,
            name: comercio || process.env.MAILTRAP_FROM_NAME || "BENEFI",
          },
          to: [
            {
              email: usuario.email,
              name: usuario.nombre_completo || usuario.email,
            },
          ],
          subject: `Nueva notificación de ${nombreComercio}`,
          text: `${titulo}\n\n${mensaje}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${titulo}</h2>

              <p>Hola ${usuario.nombre_completo || 'Cliente'},</p>

              <p>
                Recibiste una nueva notificación de 
                <strong>${nombreComercio}</strong>.
              </p>

              <div style="
                margin: 20px 0;
                padding: 16px;
                border-radius: 12px;
                background: #eff6ff;
                color: #0f172a;
              ">
                ${mensaje}
              </div>

              <div style="margin-top: 20px;">
                <a
                  href="https://fidelizacion.benefi.com.ar/usuarios/${comercioId}/dashboard"
                  style="
                    background-color: #2563eb;
                    color: white;
                    padding: 12px 20px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    display: inline-block;
                  "
                >
                  Ir a mi cuenta
                </a>
              </div>

              <p style="margin-top:20px; font-size:12px; color:#888;">
                Equipo de ${comercio}
              </p>
            </div>
          `,
          category: 'Notificacion',
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        console.error('Error Mailtrap notificación:', data)
      }

      return data
    })
)

const emailsEnviados = resultadosEmail.filter(
  (r) => r.status === 'fulfilled'
).length

return NextResponse.json({
  ok: true,
  notificacion_id: notificacionData.id,
  cantidad_destinatarios: destinatarios.length,
  emails_enviados: emailsEnviados,
})

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: 'Ocurrió un error inesperado.' },
      { status: 500 }
    )
  }
}
