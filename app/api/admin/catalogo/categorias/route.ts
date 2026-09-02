import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const comercioId = searchParams.get("comercio_id");

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("catalogo_categorias")
      .select("*")
      .eq("comercio_id", comercioId)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      categorias: data || [],
    });
  } catch (error) {
    console.error("Error cargando categorías:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const comercioId = body?.comercio_id;
    const nombre = String(body?.nombre || "").trim();
    const descripcion = String(body?.descripcion || "").trim();

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: "Completá el nombre de la categoría" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("catalogo_categorias")
      .insert({
        comercio_id: comercioId,
        nombre,
        descripcion: descripcion || null,
        activa: true,
        orden: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      categoria: data,
    });
  } catch (error) {
    console.error("Error creando categoría:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}