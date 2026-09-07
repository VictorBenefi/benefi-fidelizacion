import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";

type BodyType = {
  comercio_id?: string;
  titulo?: string;
  mensaje?: string;
  tipo?: string;
  modo_envio?: "uno" | "grupo" | "todos";
  usuario_ids?: string[];
};

export async function POST(req: Request) {
  try {
    // 1. Validar sesión segura del comercio
    const session =
      getComercioSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: "Sesión de comercio no válida.",
        },
        { status: 401 }
      );
    }

    const body =
      (await req.json()) as BodyType;

    const comercioId =
      body.comercio_id?.trim();

    const titulo =
      body.titulo?.trim();

    const mensaje =
      body.mensaje?.trim();

    const tipo =
      body.tipo?.trim() || "info";

    const modoEnvio =
      body.modo_envio;

    const usuarioIds =
      body.usuario_ids || [];

    if (!comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta comercio_id.",
        },
        { status: 400 }
      );
    }

    // 2. El comercio solicitado debe coincidir
    // con la sesión segura
    if (
      session.comercio_id !==
      comercioId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    if (!titulo) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta el título.",
        },
        { status: 400 }
      );
    }

    if (!mensaje) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta el mensaje.",
        },
        { status: 400 }
      );
    }

    if (
      !modoEnvio ||
      !["uno", "grupo", "todos"].includes(
        modoEnvio
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Modo de envío inválido.",
        },
        { status: 400 }
      );
    }

    let destinatarios: string[] = [];

    // 3. Obtener todos los usuarios
    // realmente vinculados al comercio
    const {
      data: relacionesComercio,
      error: relacionesError,
    } = await supabaseAdmin
      .from("usuarios_comercios")
      .select("usuario_id")
      .eq(
        "comercio_id",
        session.comercio_id
      );

    if (relacionesError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudieron obtener los usuarios del comercio.",
        },
        { status: 500 }
      );
    }

    const usuariosPermitidos =
      Array.from(
        new Set(
          (relacionesComercio || [])
            .map(
              (item: any) =>
                item.usuario_id
            )
            .filter(Boolean)
        )
      );

    if (modoEnvio === "uno") {
      if (usuarioIds.length !== 1) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Debés seleccionar un usuario.",
          },
          { status: 400 }
        );
      }

      destinatarios = usuarioIds;
    }

    if (modoEnvio === "grupo") {
      if (!usuarioIds.length) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Debés seleccionar al menos un usuario.",
          },
          { status: 400 }
        );
      }

      destinatarios = usuarioIds;
    }

    if (modoEnvio === "todos") {
      destinatarios =
        usuariosPermitidos;
    }

    destinatarios =
      Array.from(
        new Set(
          destinatarios.filter(Boolean)
        )
      );

    // 4. Verificar que TODOS los destinatarios
    // pertenezcan al comercio autenticado
    const destinatariosNoPermitidos =
      destinatarios.filter(
        (usuarioId) =>
          !usuariosPermitidos.includes(
            usuarioId
          )
      );

    if (
      destinatariosNoPermitidos.length > 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Uno o más usuarios seleccionados no pertenecen a este comercio.",
        },
        { status: 403 }
      );
    }

    if (!destinatarios.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No hay destinatarios para enviar la notificación.",
        },
        { status: 400 }
      );
    }

    // 5. Crear notificación únicamente
    // para el comercio autenticado
    const {
      data: notificacionData,
      error: notificacionError,
    } = await supabaseAdmin
      .from("notificaciones")
      .insert({
        comercio_id:
          session.comercio_id,
        titulo,
        mensaje,
        tipo,
        activa: true,
      })
      .select("id")
      .single();

    if (
      notificacionError ||
      !notificacionData
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudo crear la notificación.",
        },
        { status: 500 }
      );
    }

    // 6. Asociar los usuarios
    // a la notificación
    const payloadUsuarios =
      destinatarios.map(
        (usuarioId) => ({
          notificacion_id:
            notificacionData.id,
          usuario_id: usuarioId,
          leida: false,
        })
      );

    const {
      error: usuariosNotifError,
    } = await supabaseAdmin
      .from("usuarios_notificaciones")
      .insert(payloadUsuarios);

    if (usuariosNotifError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudo asignar la notificación a los usuarios.",
        },
        { status: 500 }
      );
    }

    // 7. Obtener nombre del comercio
    const { data: comercioData } =
      await supabaseAdmin
        .from("comercios")
        .select(
          "nombre_fantasia, razon_social"
        )
        .eq(
          "id",
          session.comercio_id
        )
        .single();

    const nombreComercio =
      comercioData?.nombre_fantasia ||
      comercioData?.razon_social ||
      "tu comercio";

    // 8. Obtener emails de los destinatarios
    const { data: usuariosEmail } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id, email, nombre_completo"
        )
        .in("id", destinatarios);

    // 9. Enviar emails
    const resultadosEmail =
      await Promise.allSettled(
        (usuariosEmail || [])
          .filter(
            (usuario) =>
              !!usuario.email
          )
          .map(async (usuario) => {
            const response =
              await fetch(
                "https://send.api.mailtrap.io/api/send",
                {
                  method: "POST",
                  headers: {
                    Authorization:
                      `Bearer ${process.env.MAILTRAP_TOKEN}`,
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    from: {
                      email:
                        process.env
                          .MAILTRAP_FROM_EMAIL,
                      name:
                        nombreComercio ||
                        process.env
                          .MAILTRAP_FROM_NAME ||
                        "BENEFI",
                    },
                    to: [
                      {
                        email:
                          usuario.email,
                        name:
                          usuario.nombre_completo ||
                          usuario.email,
                      },
                    ],
                    subject:
                      `Nueva notificación de ${nombreComercio}`,
                    text:
                      `${titulo}\n\n${mensaje}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>${titulo}</h2>

                        <p>
                          Hola ${
                            usuario.nombre_completo ||
                            "Cliente"
                          },
                        </p>

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
                            href="https://fidelizacion.benefi.com.ar/usuarios/${session.comercio_id}/dashboard"
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

                        <p>
                          ¡Gracias por ser parte! 🚀
                        </p>

                        <p style="margin-top:20px; font-size:12px; color:#888;">
                          Equipo de ${nombreComercio}
                        </p>
                      </div>
                    `,
                    category:
                      "Notificacion",
                  }),
                }
              );

            const data =
              await response
                .json()
                .catch(() => null);

            if (!response.ok) {
              console.error(
                "Error Mailtrap notificación:",
                data
              );

              throw new Error(
                "Error enviando email"
              );
            }

            return data;
          })
      );

    const emailsEnviados =
      resultadosEmail.filter(
        (resultado) =>
          resultado.status ===
          "fulfilled"
      ).length;

    return NextResponse.json({
      ok: true,
      notificacion_id:
        notificacionData.id,
      cantidad_destinatarios:
        destinatarios.length,
      emails_enviados:
        emailsEnviados,
    });
  } catch (error) {
    console.error(
      "Error enviando notificación:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Ocurrió un error inesperado.",
      },
      { status: 500 }
    );
  }
}