import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const comercioId = searchParams.get("comercio_id");

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id." },
        { status: 400 }
      );
    }

    // Validar sesión segura del comercio
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

    // Impedir que un comercio consulte datos de otro
    if (session.comercio_id !== comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error: "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("comercios")
      .select("*")
      .eq("id", comercioId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "No se encontró el comercio." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error obteniendo comercio actual:", error);

    return NextResponse.json(
      {
        error: "Ocurrió un error al obtener el comercio.",
      },
      { status: 500 }
    );
  }
}