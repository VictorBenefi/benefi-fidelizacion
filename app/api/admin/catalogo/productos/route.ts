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
      .from("catalogo_productos")
      .select("*")
      .eq("comercio_id", comercioId)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      productos: data || [],
    });
  } catch (error) {
    console.error("Error cargando productos:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      comercio_id,
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

    if (!comercio_id) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
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

    if (Number(precio_pesos) < 0) {
      return NextResponse.json(
        { error: "El precio en pesos no puede ser negativo" },
        { status: 400 }
      );
    }

    if (Number(precio_puntos) < 0) {
      return NextResponse.json(
        { error: "El precio en puntos no puede ser negativo" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("catalogo_productos")
      .insert({
        comercio_id,
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
      })
      .select()
      .single();

    if (error) {
      console.error("Error guardando producto:", error);

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
    console.error("Error inesperado guardando producto:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}