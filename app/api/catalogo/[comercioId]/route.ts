import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ comercioId: string }> }
) {
  try {
    const { comercioId } = await context.params;

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercioId" },
        { status: 400 }
      );
    }

    const { data: comercio, error: comercioError } =
    await supabaseAdmin
      .from("comercios")
      .select("id, nombre_fantasia, razon_social, campaign_id")
      .eq("id", comercioId)
      .single();

  if (comercioError || !comercio) {
    return NextResponse.json(
      { error: "No se pudo cargar el comercio" },
      { status: 404 }
    );
  }

  let campaign = null;

  if (comercio.campaign_id) {
    const { data: campaignData } =
      await supabaseAdmin
        .from("campaign_settings")
        .select("portal_titulo, color_activo")
        .eq("id", comercio.campaign_id)
        .maybeSingle();

    campaign = campaignData;
  }

    const { data: categorias, error: categoriasError } =
      await supabaseAdmin
        .from("catalogo_categorias")
        .select("*")
        .eq("comercio_id", comercioId)
        .eq("activa", true)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: true });

    if (categoriasError) {
      return NextResponse.json(
        { error: categoriasError.message },
        { status: 500 }
      );
    }

    const { data: productos, error: productosError } =
      await supabaseAdmin
        .from("catalogo_productos")
        .select("*")
        .eq("comercio_id", comercioId)
        .eq("activo", true)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: false });

    if (productosError) {
      return NextResponse.json(
        { error: productosError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
    ok: true,

    comercio: {
      id: comercio.id,
      nombre:
        campaign?.portal_titulo ||
        comercio.nombre_fantasia ||
        comercio.razon_social ||
        "Catálogo",
      color_activo:
        campaign?.color_activo || "#1E3A5F",
    },

    categorias: categorias || [],
    productos: productos || [],
  });
  } catch (error) {
    console.error("Error cargando catálogo público:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}