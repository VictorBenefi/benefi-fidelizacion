import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("terminales")
      .select(`
        id,
        comercio_id,
        nombre_sucursal,
        pin,
        activa,
        created_at,
        comercios (
          nombre_fantasia
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando terminales:", error);

      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      terminales: data || [],
    });
  } catch (error) {
    console.error("Error inesperado cargando terminales:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}