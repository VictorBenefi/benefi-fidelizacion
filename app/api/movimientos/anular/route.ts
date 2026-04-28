import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Movimiento = {
  id: string;
  usuario_id: string;
  comercio_id: string | null;
  tipo: "carga" | "canje";
  puntos: number;
  monto_compra: number | null;
  nro_ticket: string | null;
  observaciones: string | null;
  fecha: string;
  promocion_id: string | null;
  estado: "activo" | "anulado";
  movimiento_original_id: string | null;
  anulado_por_movimiento_id: string | null;
  es_reverso: boolean;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const movimientoId = String(body?.movimientoId || "").trim();
    const motivo = String(body?.motivo || "").trim();
    const usuarioAnulador = body?.usuarioAnulador
      ? String(body.usuarioAnulador)
      : null;

    if (!movimientoId) {
      return NextResponse.json(
        { ok: false, error: "ID de movimiento inválido." },
        { status: 400 }
      );
    }

    const { data: movimiento, error: movimientoError } = await supabase
      .from("movimientos_puntos")
      .select("*")
      .eq("id", movimientoId)
      .single<Movimiento>();

    if (movimientoError || !movimiento) {
      return NextResponse.json(
        { ok: false, error: "Movimiento no encontrado." },
        { status: 404 }
      );
    }

    if (movimiento.estado === "anulado") {
      return NextResponse.json(
        { ok: false, error: "El movimiento ya fue anulado." },
        { status: 400 }
      );
    }

    if (movimiento.es_reverso) {
      return NextResponse.json(
        { ok: false, error: "No se puede anular un movimiento reverso." },
        { status: 400 }
      );
    }

    if (movimiento.anulado_por_movimiento_id) {
      return NextResponse.json(
        { ok: false, error: "El movimiento ya tiene una anulación registrada." },
        { status: 400 }
      );
    }

    const { data: movimientosUsuario, error: saldoError } = await supabase
      .from("movimientos_puntos")
      .select("tipo, puntos, estado")
      .eq("usuario_id", movimiento.usuario_id);

    if (saldoError) {
      return NextResponse.json(
        { ok: false, error: "No se pudo calcular el saldo actual del cliente." },
        { status: 500 }
      );
    }

    const saldoActual = (movimientosUsuario || []).reduce((acc, item) => {
      if (item.estado !== "activo") return acc;
      if (item.tipo === "carga") return acc + Number(item.puntos || 0);
      if (item.tipo === "canje") return acc - Number(item.puntos || 0);
      return acc;
    }, 0);

    const tipoReverso: "carga" | "canje" =
      movimiento.tipo === "carga" ? "canje" : "carga";

    if (movimiento.tipo === "carga" && saldoActual < Number(movimiento.puntos || 0)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No se puede anular esta carga porque el cliente no tiene saldo suficiente para descontar esos puntos.",
        },
        { status: 400 }
      );
    }

    const fechaAhora = new Date().toISOString();

    const observacionesReverso = [
      `Reverso del movimiento ${movimiento.id}`,
      motivo ? `Motivo: ${motivo}` : null,
      movimiento.observaciones
        ? `Obs. original: ${movimiento.observaciones}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const nroTicketReverso = movimiento.nro_ticket
      ? `${movimiento.nro_ticket}-ANUL`
      : `ANUL-${movimiento.id.slice(0, 8)}`;

    const { data: reverso, error: reversoError } = await supabase
      .from("movimientos_puntos")
      .insert({
        usuario_id: movimiento.usuario_id,
        comercio_id: movimiento.comercio_id,
        tipo: tipoReverso,
        puntos: movimiento.puntos,
        monto_compra: movimiento.monto_compra,
        nro_ticket: nroTicketReverso,
        observaciones: observacionesReverso,
        fecha: fechaAhora,
        promocion_id: movimiento.promocion_id,
        estado: "activo",
        movimiento_original_id: movimiento.id,
        es_reverso: true,
      })
      .select()
      .single();

    if (reversoError || !reverso) {
      console.error("Error creando reverso:", reversoError);
      return NextResponse.json(
        { ok: false, error: "No se pudo crear el movimiento reverso." },
        { status: 500 }
      );
    }

    const { error: updateOriginalError } = await supabase
      .from("movimientos_puntos")
      .update({
        estado: "anulado",
        anulado_por_movimiento_id: reverso.id,
        anulado_en: fechaAhora,
        anulado_por: usuarioAnulador,
      })
      .eq("id", movimiento.id)
      .is("anulado_por_movimiento_id", null);

    if (updateOriginalError) {
      console.error("Error actualizando original:", updateOriginalError);

      await supabase.from("movimientos_puntos").delete().eq("id", reverso.id);

      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo marcar el movimiento original como anulado.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Movimiento anulado correctamente.",
      originalId: movimiento.id,
      reversoId: reverso.id,
    });
  } catch (error) {
    console.error("Error en /api/movimientos/anular:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}