import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const nombre = String(body?.nombre || "").trim();
    const descripcion = String(body?.descripcion || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Falta id de la categoría" },
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
      .update({
        nombre,
        descripcion: descripcion || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando categoría:", error);

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
    console.error("Error inesperado actualizando categoría:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Falta id de la categoría" },
        { status: 400 }
      );
    }

    const { count, error: countError } = await supabaseAdmin
      .from("catalogo_productos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", id);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la categoría porque tiene productos asociados.",
        },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from("catalogo_categorias")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error eliminando categoría:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}