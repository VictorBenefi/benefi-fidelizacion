import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("movimientos_puntos")
      .select(`
        id,
        operacion_id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        created_at,
        estado,
        terminal_id,
        es_reverso,
        usuarios (
          nombre_completo,
          dni
        ),
        comercios (
          nombre_fantasia
        ),
        terminales (
          nombre_sucursal
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}