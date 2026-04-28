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
        { error: "No se recibió el id de la campaña" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("campaign_settings")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error actualizando campaña:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al actualizar la campaña" },
      { status: 500 }
    );
  }
}