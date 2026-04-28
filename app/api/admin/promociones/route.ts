import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("promociones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error cargando promociones:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al cargar promociones" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      comercio_id: body.comercio_id,
      nombre: body.nombre || null,
      tipo: body.tipo || null,
      valor: body.valor ?? null,
      aplica_a: body.aplica_a || null,
      fecha_inicio: body.fecha_inicio || null,
      fecha_fin: body.fecha_fin || null,
      activa: body.activa ?? true,
      suma_puntos_en_descarga: body.suma_puntos_en_descarga ?? false,
      cada_monto: body.cada_monto ?? null,
      puntos_por_tramo: body.puntos_por_tramo ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("promociones")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creando promoción:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear la promoción" },
      { status: 500 }
    );
  }
}
