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

    const { data: comercio, error } = await supabaseAdmin
      .from("comercios")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: "Error al buscar comercio" },
          { status: 500 }
        );
      }

      if (!comercio) {
        return NextResponse.json(
          { error: "No se encontró el comercio" },
          { status: 404 }
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