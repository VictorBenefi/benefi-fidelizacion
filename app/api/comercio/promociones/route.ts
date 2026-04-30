import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const comercio_id = searchParams.get("comercio_id");
    const solo_activas = searchParams.get("solo_activas") === "true";

    if (!comercio_id) {
      return NextResponse.json({ error: "Falta comercio_id" }, { status: 400 });
    }

    const hoy = new Date().toISOString().split("T")[0];

    let query = supabaseAdmin
      .from("promociones")
      .select("*")
      .eq("comercio_id", comercio_id)
      .order("created_at", { ascending: false });

    if (solo_activas) {
      query = query
        .eq("activa", true)
        .lte("fecha_inicio", hoy)
        .gte("fecha_fin", hoy);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error servidor" }, { status: 500 });
  }
}