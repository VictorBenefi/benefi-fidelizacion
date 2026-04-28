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

    const campaignId =
      body.campaign_id && body.campaign_id !== ""
        ? body.campaign_id
        : null;

    const { data, error } = await supabaseAdmin
      .from("comercios")
      .update({
        campaign_id: campaignId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error actualizando campaign_id:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al guardar la asignación" },
      { status: 500 }
    );
  }
}