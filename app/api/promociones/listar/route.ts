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
      .from("promociones")
      .select("*")
      .eq("comercio_id", comercio_id)
      .eq("activa", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
    ok: true,
    promociones: data || [],
  });
  } catch (error) {
    console.error("Error listando promociones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al listar promociones" },
      { status: 500 }
    );
  }
}
