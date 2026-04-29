import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Completá email y contraseña." },
        { status: 400 }
      );
    }

    // 1. Buscar comercio por email
    const query = supabaseAdmin
      .from("comercios")
      .select("*")
      .ilike("email", email);

    if (slug) {
      query.eq("slug", slug);
    }

    const { data: comercio, error } = await query
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!comercio) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    if (comercio.activo === false) {
      return NextResponse.json(
        { error: "El comercio está inactivo." },
        { status: 400 }
      );
    }

    // 2. Validar contraseña
    const savedPassword = String(comercio.password || "").trim();

    if (savedPassword !== password) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      comercio: {
        id: comercio.id,
        nombre_fantasia: comercio.nombre_fantasia,
        razon_social: comercio.razon_social,
        email: comercio.email,
        slug: comercio.slug,
      },
    });

  } catch (error) {
    console.error("Error en login comercio:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al iniciar sesión." },
      { status: 500 }
    );
  }
}