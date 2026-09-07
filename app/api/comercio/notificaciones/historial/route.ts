import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";

export async function POST(req: Request) {
  try {
    // Validar sesión segura del comercio
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

    const body = await req.json();

    const comercioId = String(
      body?.comercio_id || ""
    ).trim();

    if (!comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta el comercio_id.",
        },
        { status: 400 }
      );
    }

    // Verificar que el comercio solicitado
    // coincida con el comercio autenticado
    if (session.comercio_id !== comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    // Obtener únicamente las notificaciones
    // del comercio autenticado
    const {
      data: notificaciones,
      error: notificacionesError,
    } = await supabaseAdmin
      .from("notificaciones")
      .select(
        "id, titulo, mensaje, tipo, activa, created_at"
      )
      .eq(
        "comercio_id",
        session.comercio_id
      )
      .order("created_at", {
        ascending: false,
      });

    if (notificacionesError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudo obtener el historial.",
        },
        { status: 500 }
      );
    }

    const notificacionIds =
      (notificaciones || []).map(
        (n: any) => n.id
      );

    if (!notificacionIds.length) {
      return NextResponse.json({
        ok: true,
        historial: [],
      });
    }

    const {
      data: usuariosNotif,
      error: usuariosNotifError,
    } = await supabaseAdmin
      .from("usuarios_notificaciones")
      .select(
        "notificacion_id, leida"
      )
      .in(
        "notificacion_id",
        notificacionIds
      );

    if (usuariosNotifError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudieron obtener los destinatarios.",
        },
        { status: 500 }
      );
    }

    const historial =
      (notificaciones || []).map(
        (notif: any) => {
          const relacionados =
            (usuariosNotif || []).filter(
              (item: any) =>
                item.notificacion_id ===
                notif.id
            );

          const destinatarios =
            relacionados.length;

          const leidas =
            relacionados.filter(
              (item: any) => item.leida
            ).length;

          const pendientes =
            destinatarios - leidas;

          return {
            notificacion_id: notif.id,
            titulo: notif.titulo,
            mensaje: notif.mensaje,
            tipo: notif.tipo,
            activa: notif.activa,
            created_at: notif.created_at,
            destinatarios,
            leidas,
            pendientes,
          };
        }
      );

    return NextResponse.json({
      ok: true,
      historial,
    });
  } catch (error) {
    console.error(
      "Error cargando historial de notificaciones:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Ocurrió un error inesperado al cargar el historial.",
      },
      { status: 500 }
    );
  }
}