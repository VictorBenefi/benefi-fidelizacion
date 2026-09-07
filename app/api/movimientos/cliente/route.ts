import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";

export async function POST(req: Request) {
  try {
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

    const usuario_id = String(
      body?.usuario_id || ""
    ).trim();

    const comercio_id = String(
      body?.comercio_id || ""
    ).trim();

    const terminal_id = body?.terminal_id
      ? String(body.terminal_id).trim()
      : null;

    if (!usuario_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "usuario_id es obligatorio",
        },
        { status: 400 }
      );
    }

    if (!comercio_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "comercio_id es obligatorio",
        },
        { status: 400 }
      );
    }

    // El comercio solicitado debe coincidir
    // con la sesión segura
    if (
      session.comercio_id !== comercio_id
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

    // Verificar que el usuario pertenezca
    // realmente al comercio autenticado
    const {
      data: relacionUsuario,
      error: relacionError,
    } = await supabaseAdmin
      .from("usuarios_comercios")
      .select("usuario_id")
      .eq(
        "comercio_id",
        session.comercio_id
      )
      .eq("usuario_id", usuario_id)
      .maybeSingle();

    if (relacionError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se pudo validar el usuario.",
        },
        { status: 500 }
      );
    }

    if (!relacionUsuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El usuario no pertenece a este comercio.",
        },
        { status: 403 }
      );
    }

    let query = supabaseAdmin
      .from("movimientos_puntos")
      .select(`
        id,
        operacion_id,
        terminal_id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        observaciones,
        fecha,
        promocion_id,
        estado,
        es_reverso,
        movimiento_original_id,
        anulado_por_movimiento_id
      `)
      .eq("usuario_id", usuario_id)
      .eq(
        "comercio_id",
        session.comercio_id
      );

    if (terminal_id) {
      query = query.eq(
        "terminal_id",
        terminal_id
      );
    }

    const { data, error } =
      await query
        .order("fecha", {
          ascending: false,
        })
        .limit(30);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      movimientos: data || [],
    });
  } catch (error: any) {
    console.error(
      "Error en /api/movimientos/cliente:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Error interno",
      },
      { status: 500 }
    );
  }
}