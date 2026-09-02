import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIPOS_VALIDOS = [
  "porcentaje",
  "tramo",
  "puntos_fijos",
];

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
      .from("catalogo_configuracion_puntos_categoria")
      .select("*")
      .eq("comercio_id", comercioId);

    if (error) {
      console.error(
        "Error cargando puntos por categoría:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      configuraciones: data || [],
    });
  } catch (error) {
    console.error(
      "Error inesperado cargando puntos por categoría:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const comercioId = body?.comercio_id;
    const categoriaId = body?.categoria_id;
    const activa = body?.activa !== false;

    const tipoGeneracionPuntos =
      body?.tipo_generacion_puntos || null;

    const valorGeneracionPuntos =
      body?.valor_generacion_puntos != null
        ? Number(body.valor_generacion_puntos)
        : null;

    const cadaMontoGeneracionPuntos =
      body?.cada_monto_generacion_puntos != null
        ? Number(body.cada_monto_generacion_puntos)
        : null;

    const puntosPorTramoGeneracion =
      body?.puntos_por_tramo_generacion != null
        ? Number(body.puntos_por_tramo_generacion)
        : null;

    if (!comercioId || !categoriaId) {
      return NextResponse.json(
        {
          error:
            "Faltan comercio_id o categoria_id",
        },
        { status: 400 }
      );
    }

    if (
      !tipoGeneracionPuntos ||
      !TIPOS_VALIDOS.includes(tipoGeneracionPuntos)
    ) {
      return NextResponse.json(
        {
          error:
            "Tipo de generación de puntos inválido",
        },
        { status: 400 }
      );
    }

    // Verificamos que la categoría realmente pertenezca
    // al comercio que estamos configurando.
    const { data: categoria, error: categoriaError } =
      await supabaseAdmin
        .from("catalogo_categorias")
        .select("id")
        .eq("id", categoriaId)
        .eq("comercio_id", comercioId)
        .maybeSingle();

    if (categoriaError) {
      return NextResponse.json(
        { error: categoriaError.message },
        { status: 500 }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        {
          error:
            "La categoría no pertenece al comercio",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("catalogo_configuracion_puntos_categoria")
      .upsert(
        {
          comercio_id: comercioId,
          categoria_id: categoriaId,
          tipo_generacion_puntos:
            tipoGeneracionPuntos,

          valor_generacion_puntos:
            tipoGeneracionPuntos === "tramo"
              ? null
              : valorGeneracionPuntos,

          cada_monto_generacion_puntos:
            tipoGeneracionPuntos === "tramo"
              ? cadaMontoGeneracionPuntos
              : null,

          puntos_por_tramo_generacion:
            tipoGeneracionPuntos === "tramo"
              ? puntosPorTramoGeneracion
              : null,

          activa,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "comercio_id,categoria_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error(
        "Error guardando puntos por categoría:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      configuracion: data,
    });
  } catch (error) {
    console.error(
      "Error inesperado guardando puntos por categoría:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}