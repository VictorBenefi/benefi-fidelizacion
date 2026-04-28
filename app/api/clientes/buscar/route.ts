import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dni = String(body?.dni || "").trim();
    const comercio_id = body?.comercio_id;

    if (!dni) {
      return NextResponse.json({ error: "Falta DNI" }, { status: 400 });
    }

    if (!comercio_id) {
      return NextResponse.json({ error: "Falta comercio_id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("usuarios_comercios")
      .select(`
        usuario_id,
        usuarios (
          id,
          nombre_completo,
          email,
          dni,
          telefono,
          provincia
        )
      `)
      .eq("comercio_id", comercio_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const usuarioVinculado = (data || []).find((row: any) => {
      const u = row?.usuarios;
      return u && String(u.dni || "").trim() === dni;
    });

    if (!usuarioVinculado?.usuarios) {
      return NextResponse.json(
        { error: "Cliente no encontrado para este comercio" },
        { status: 404 }
      );
    }

    const usuario: any = usuarioVinculado.usuarios;

    const { data: movimientos, error: errorMovimientos } = await supabaseAdmin
      .from("movimientos_puntos")
      .select("tipo, puntos, estado")
      .eq("usuario_id", usuario.id)
      .eq("comercio_id", comercio_id);

    if (errorMovimientos) {
      return NextResponse.json(
        { error: errorMovimientos.message },
        { status: 500 }
      );
    }

const saldo = (movimientos || [])
  .filter((m: any) => m.estado !== "anulado")
  .reduce((acc: number, m: any) => {
    const puntos = Number(m.puntos || 0);

    if (m.tipo === "carga") return acc + puntos;
    if (m.tipo === "canje") return acc - puntos;
    if (m.tipo === "reversion") return acc + puntos;

    return acc;
  }, 0);

    return NextResponse.json({
      ok: true,
      cliente: {
        ...usuario,
        saldo,
      },
    });
  } catch (error) {
    console.error("Error buscando cliente:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al buscar cliente" },
      { status: 500 }
    );
  }
}