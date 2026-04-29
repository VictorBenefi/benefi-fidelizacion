import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body?.slug || "").trim().toLowerCase();

    if (!slug) {
      return NextResponse.json(
        { error: "Falta slug" },
        { status: 400 }
      );
    }

    const { data: campania, error: campaniaError } = await supabaseAdmin
      .from("campaign_settings")
      .select("id, slug, activa")
      .eq("slug", slug)
      .eq("activa", true)
      .single();

    if (campaniaError || !campania) {
      return NextResponse.json(
        { error: "No se encontró la campaña" },
        { status: 404 }
      );
    }

    const { data: comercio, error: comercioError } = await supabaseAdmin
      .from("comercios")
      .select("id, nombre_fantasia, razon_social, activo, campaign_id")
      .eq("campaign_id", campania.id)
      .single();

    if (comercioError || !comercio) {
      return NextResponse.json(
        { error: "No se encontró el comercio asociado" },
        { status: 404 }
      );
    }

    if (comercio.activo === false) {
      return NextResponse.json(
        { error: "El comercio está inactivo" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: comercio.id,
      nombre_fantasia: comercio.nombre_fantasia,
      razon_social: comercio.razon_social,
      slug,
    });
  } catch (error) {
    console.error("Error resolviendo slug:", error);

    return NextResponse.json(
      { error: "Ocurrió un error al resolver el slug" },
      { status: 500 }
    );
  }
}