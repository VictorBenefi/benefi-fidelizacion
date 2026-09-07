import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export async function GET(req: Request) {
  try {
    // 1. Validar usuario autenticado mediante su token
    const { user, error: authError } =
      await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: authError || "Usuario no autenticado",
        },
        { status: 401 }
      );
    }

    // 2. Buscar usuario interno usando el usuario
    // realmente autenticado en Supabase
    const { data: usuario, error: userError } =
      await supabaseAdmin
        .from("usuarios")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

    if (userError || !usuario) {
      return NextResponse.json(
        {
          ok: false,
          error: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    // 3. Buscar únicamente los comercios
    // vinculados a ese usuario
    const { data: relaciones, error: relError } =
      await supabaseAdmin
        .from("usuarios_comercios")
        .select("comercio_id")
        .eq("usuario_id", usuario.id);

    if (relError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Error buscando relaciones",
        },
        { status: 500 }
      );
    }

    const comercioIds =
      relaciones?.map(
        (relacion) => relacion.comercio_id
      ) || [];

    if (comercioIds.length === 0) {
      return NextResponse.json({
        ok: true,
        usuario,
        comercios: [],
      });
    }

    // 4. Obtener solamente esos comercios
    const { data: comercios, error: comError } =
      await supabaseAdmin
        .from("comercios")
        .select("*")
        .in("id", comercioIds);

    if (comError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Error buscando comercios",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      usuario,
      comercios: comercios || [],
    });
  } catch (error) {
    console.error(
      "ERROR API comercios-por-auth:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Error interno",
      },
      { status: 500 }
    );
  }
}