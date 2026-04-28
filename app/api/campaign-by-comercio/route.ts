import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const comercio_id = searchParams.get("comercio_id");

    if (!comercio_id) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    const { data: comercio, error: comercioError } = await supabaseAdmin
      .from("comercios")
      .select("campaign_id")
      .eq("id", comercio_id)
      .single();

    if (comercioError || !comercio) {
      return NextResponse.json(
        { error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    if (!comercio.campaign_id) {
      return NextResponse.json(
        { error: "El comercio no tiene campaña asignada" },
        { status: 400 }
      );
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaign_settings")
      .select("*")
      .eq("id", comercio.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      campaign,
    });
  } catch (error) {
    console.error("Error en /api/campaign-by-comercio:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}