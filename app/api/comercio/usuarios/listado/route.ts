import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";

export async function POST(req: Request) {
  try {
    // 1. Validar sesión segura del comercio
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

    // 2. Obtener comercio solicitado por el frontend
    const body = await req.json();
    const comercio_id = body?.comercio_id;

    if (!comercio_id) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    // 3. Verificar que coincida con el comercio autenticado
    if (session.comercio_id !== comercio_id) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    // 4. Consultar únicamente los usuarios del comercio autorizado
    const { data, error } =
      await supabaseAdmin
        .from("usuarios_comercios")
        .select(`
          usuario_id,
          created_at,
          usuarios (
            id,
            nombre_completo,
            dni,
            email,
            telefono,
            created_at,
            activo
          )
        `)
        .eq("comercio_id", session.comercio_id)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 5. Obtener el nombre del comercio autenticado
    const { data: comercioData } =
      await supabaseAdmin
        .from("comercios")
        .select(
          "nombre_fantasia, razon_social"
        )
        .eq("id", session.comercio_id)
        .single();

    const nombreComercio =
      comercioData?.nombre_fantasia ||
      comercioData?.razon_social ||
      "Sin comercio";

    const usuarios = (data || [])
      .map((row: any) => {
        if (!row.usuarios) return null;

        return {
          ...row.usuarios,
          comercio_nombre: nombreComercio,
        };
      })
      .filter(Boolean);

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error(
      "Error listando usuarios del comercio:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error al listar usuarios del comercio",
      },
      { status: 500 }
    );
  }
}