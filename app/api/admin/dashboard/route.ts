import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("movimientos_puntos")
      .select(`
        id,
        tipo,
        puntos,
        monto_compra,
        estado,
        created_at,
        comercio_id,
        usuario_id,
        comercios (nombre_fantasia),
        usuarios (nombre_completo, dni)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error supabase:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Error dashboard:", err);
    return NextResponse.json([], { status: 200 });
  }
}