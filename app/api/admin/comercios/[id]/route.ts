import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "No se recibió el id del comercio" },
        { status: 400 }
      );
    }

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
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error actualizando comercio:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al actualizar el comercio" },
      { status: 500 }
    );
  }
}
