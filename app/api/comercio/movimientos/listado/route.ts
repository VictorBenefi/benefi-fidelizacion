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
          error: "Sesión de comercio no válida.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const comercio_id = body?.comercio_id;

    if (!comercio_id) {
      return NextResponse.json(
        {
          error: "Falta comercio_id",
        },
        { status: 400 }
      );
    }

    // Verificar que el comercio solicitado
    // coincida con el comercio autenticado
    if (session.comercio_id !== comercio_id) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    // Consultar únicamente movimientos
    // del comercio autenticado
    const { data, error } =
      await supabaseAdmin
        .from("movimientos_puntos")
        .select(`
          id,
          tipo,
          puntos,
          monto_compra,
          nro_ticket,
          created_at,
          estado,
          terminal_id,
          es_reverso,
          usuarios (
            nombre_completo,
            dni
          ),
          terminales (
            nombre_sucursal
          )
        `)
        .eq(
          "comercio_id",
          session.comercio_id
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error(
      "Error listando movimientos:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno",
      },
      { status: 500 }
    );
  }
}