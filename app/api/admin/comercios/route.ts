import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("comercios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error cargando comercios:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al cargar comercios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      nombre_fantasia: body.nombre_fantasia || null,
      razon_social: body.razon_social || null,
      email: body.email || null,
      telefono: body.telefono || null,
      cuit: body.cuit || null,
      slug: body.slug || null,
      campaign_id: body.campaign_id || null,
      activo: body.activo ?? true,
      password: body.password || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("comercios")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creando comercio:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el comercio" },
      { status: 500 }
    );
  }
}
