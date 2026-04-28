import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const comercio_id = body?.comercio_id;

    if (!comercio_id) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("movimientos_puntos")
      .select(`
        id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        created_at,
        estado,
        usuarios (
          nombre_completo,
          dni
        )
      `)
      .eq("comercio_id", comercio_id)
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