import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const comercio_id = body?.comercio_id;

    if (!comercio_id) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
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
      .eq("comercio_id", comercio_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const usuarios = (data || [])
      .map((row: any) => row.usuarios)
      .filter(Boolean);

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error listando usuarios del comercio:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al listar usuarios del comercio" },
      { status: 500 }
    );
  }
}