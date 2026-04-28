import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { movimiento } = await req.json();

    if (!movimiento?.id) {
      return NextResponse.json({ error: "Falta movimiento" }, { status: 400 });
    }

    const { data: original, error: errorOriginal } = await supabaseAdmin
      .from("movimientos_puntos")
      .select("*")
      .eq("id", movimiento.id)
      .single();

    if (errorOriginal || !original) {
      return NextResponse.json(
        { error: "No se encontró el movimiento original" },
        { status: 404 }
      );
    }

    if (original.estado === "anulado") {
      return NextResponse.json(
        { error: "El movimiento ya está anulado" },
        { status: 400 }
      );
    }

    let puntosARevertir = 0;

    if (original.tipo === "carga") {
      puntosARevertir = -Number(original.puntos || 0);
    }

    if (original.tipo === "canje") {
      puntosARevertir = Number(original.puntos || 0);
    }

    const { error: errorAnular } = await supabaseAdmin
      .from("movimientos_puntos")
      .update({ estado: "anulado" })
      .eq("id", original.id);

    if (errorAnular) {
      return NextResponse.json({ error: errorAnular.message }, { status: 500 });
    }

    const { error: errorReversion } = await supabaseAdmin
      .from("movimientos_puntos")
      .insert({
        usuario_id: original.usuario_id,
        comercio_id: original.comercio_id,
        promocion_id: original.promocion_id || null,
        tipo: "reversion",
        puntos: puntosARevertir,
        monto_compra: 0,
        nro_ticket: `REV-${original.nro_ticket || original.id}`,
        estado: "activo",
        origen: "admin",
        observaciones: "Reversión automática por anulación",
      });

    if (errorReversion) {
      return NextResponse.json({ error: errorReversion.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error anulando movimiento:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}