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

    const { data, error } = await supabaseAdmin
      .from("comercios")
      .select("id, slug, nombre_fantasia, razon_social, activo")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "No se encontró el comercio" },
        { status: 404 }
      );
    }

    if (data.activo === false) {
      return NextResponse.json(
        { error: "El comercio está inactivo" },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error resolviendo slug:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al resolver el slug" },
      { status: 500 }
    );
  }
}