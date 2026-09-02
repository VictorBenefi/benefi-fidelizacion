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

    const {
      categoria_id,
      nombre,
      descripcion,
      imagen_url,
      precio_pesos,
      precio_puntos,
      tipo_producto,
      controla_stock,
      stock,
      requiere_preparacion,
      tiempo_preparacion_minutos,
      destacado,
      activo,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Falta id del producto" },
        { status: 400 }
      );
    }

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: "Falta el nombre del producto" },
        { status: 400 }
      );
    }

    if (!imagen_url) {
      return NextResponse.json(
        { error: "La imagen es obligatoria" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("catalogo_productos")
      .update({
        categoria_id: categoria_id || null,
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        imagen_url,
        precio_pesos: Number(precio_pesos),
        precio_puntos: Number(precio_puntos),
        tipo_producto: tipo_producto || "producto",
        controla_stock: !!controla_stock,
        stock: controla_stock ? Number(stock ?? 0) : null,
        requiere_preparacion: !!requiere_preparacion,
        tiempo_preparacion_minutos:
          requiere_preparacion
            ? Number(tiempo_preparacion_minutos ?? 0)
            : null,
        destacado: !!destacado,
        activo: activo !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando producto:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      producto: data,
    });
  } catch (error) {
    console.error("Error inesperado actualizando producto:", error);

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
        { error: "Falta id del producto" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("catalogo_productos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error eliminando producto:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Error inesperado eliminando producto:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}