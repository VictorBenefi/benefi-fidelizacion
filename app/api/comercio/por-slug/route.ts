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

    const { data: comercio, error } = await supabaseAdmin
      .from("comercios")
      .select("id, nombre_fantasia, razon_social, slug, activo, campaign_id")
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

    if (comercio.activo === false) {
      return NextResponse.json(
        { error: "El comercio está inactivo" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: comercio.id,
      comercio,
    });
  } catch (error) {
    console.error("Error resolviendo comercio por slug:", error);

    return NextResponse.json(
      { error: "Ocurrió un error al resolver el comercio" },
      { status: 500 }
    );
  }
}