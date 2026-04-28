import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Completá email y contraseña." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("comercios")
      .select("*")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    if (data.activo === false) {
      return NextResponse.json(
        { error: "El comercio está inactivo." },
        { status: 400 }
      );
    }

    const savedPassword = String(data.password || "").trim();

    if (savedPassword !== password) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      comercio: {
        id: data.id,
        nombre_fantasia: data.nombre_fantasia,
        razon_social: data.razon_social,
        email: data.email,
        slug: data.slug,
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