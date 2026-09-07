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
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    // Verificar que el comercio solicitado
    // sea el comercio autenticado
    if (session.comercio_id !== comercio_id) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    // Obtener únicamente el comercio autenticado
    const comercioRes =
      await supabaseAdmin
        .from("comercios")
        .select(
          "id, nombre_fantasia, razon_social, email"
        )
        .eq("id", session.comercio_id)
        .single();

    if (comercioRes.error) {
      return NextResponse.json(
        {
          error: comercioRes.error.message,
        },
        { status: 500 }
      );
    }

    // Obtener únicamente los usuarios
    // vinculados al comercio autenticado
    const usuariosRes =
      await supabaseAdmin
        .from("usuarios_comercios")
        .select(`
          usuario_id,
          usuarios (
            id,
            nombre_completo,
            email,
            dni
          )
        `)
        .eq(
          "comercio_id",
          session.comercio_id
        );

    if (usuariosRes.error) {
      return NextResponse.json(
        {
          error: usuariosRes.error.message,
        },
        { status: 500 }
      );
    }

    const usuarios =
      (usuariosRes.data || [])
        .map(
          (row: any) => row.usuarios
        )
        .filter(Boolean);

    return NextResponse.json({
      ok: true,
      comercio:
        comercioRes.data || null,
      usuarios,
    });
  } catch (error) {
    console.error(
      "Error cargando contexto de notificaciones:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error al cargar el contexto",
      },
      { status: 500 }
    );
  }
}