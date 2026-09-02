import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const comercioId = searchParams.get("comercio_id");

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("catalogo_configuracion")
      .select("*")
      .eq("comercio_id", comercioId)
      .maybeSingle();

    if (error) {
      console.error("Error leyendo configuración catálogo:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      configuracion:
        data || {
          comercio_id: comercioId,
          habilitado: false,
          gestion_modo: "ambos",
          permite_puntos: true,
          permite_dinero: false,
          permite_mixto: false,
          permite_pedidos: true,
          permite_retiro: true,
          permite_envio_domicilio: false,
          costo_envio: 0,
          permite_pago_al_recibir: true,
          permite_transferencia: false,
          banco_transferencia: "",
          titular_transferencia: "",
          cbu_transferencia: "",
          alias_transferencia: "",
          cuit_cuil_titular_transferencia: "",
          permite_canje_puntos: true,
          genera_puntos_con_canje: false,

          modo_generacion_puntos: "ninguno",
          tipo_generacion_puntos: null,
          valor_generacion_puntos: null,
          cada_monto_generacion_puntos: null,
          puntos_por_tramo_generacion: null,
        },
    });
  } catch (error) {
    console.error("Error inesperado GET catálogo:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const comercioId = body?.comercio_id;
    const habilitado = !!body?.habilitado;
    const gestionModo = body?.gestion_modo || "ambos";

    const permiteRetiro =
      body?.permite_retiro !== false;

    const permiteEnvioDomicilio =
      !!body?.permite_envio_domicilio;

    const costoEnvio = Number(body?.costo_envio || 0);
    const permitePagoAlRecibir =
    body?.permite_pago_al_recibir !== false;

  const permiteTransferencia =
    !!body?.permite_transferencia;

  const bancoTransferencia =
    String(body?.banco_transferencia || "").trim();

  const titularTransferencia =
    String(body?.titular_transferencia || "").trim();

  const cbuTransferencia =
    String(body?.cbu_transferencia || "").trim();

    const aliasTransferencia =
      String(body?.alias_transferencia || "").trim();

    const cuitCuilTitularTransferencia =
      String(body?.cuit_cuil_titular_transferencia || "").trim();

    const permiteCanjePuntos =
      body?.permite_canje_puntos !== false;

    const generaPuntosConCanje =
      !!body?.genera_puntos_con_canje;
      const modoGeneracionPuntos =
    body?.modo_generacion_puntos || "ninguno";

  const tipoGeneracionPuntos =
    body?.tipo_generacion_puntos || null;

  const valorGeneracionPuntos =
    body?.valor_generacion_puntos != null
      ? Number(body.valor_generacion_puntos)
      : null;

  const cadaMontoGeneracionPuntos =
    body?.cada_monto_generacion_puntos != null
      ? Number(body.cada_monto_generacion_puntos)
      : null;

  const puntosPorTramoGeneracion =
    body?.puntos_por_tramo_generacion != null
      ? Number(body.puntos_por_tramo_generacion)
      : null;

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    if (
      !["benefi", "comercio", "ambos"].includes(gestionModo)
    ) {
      return NextResponse.json(
        { error: "Modo de gestión inválido" },
        { status: 400 }
      );
    }

    if (
  !["ninguno", "todo_catalogo", "por_categoria"].includes(
    modoGeneracionPuntos
  )
) {
  return NextResponse.json(
    { error: "Modo de generación de puntos inválido" },
    { status: 400 }
  );
}

  if (
    tipoGeneracionPuntos &&
    !["porcentaje", "tramo", "puntos_fijos"].includes(
      tipoGeneracionPuntos
    )
  ) {
    return NextResponse.json(
      { error: "Tipo de generación de puntos inválido" },
      { status: 400 }
    );
  }

    const { data, error } = await supabaseAdmin
      .from("catalogo_configuracion")
      .upsert(
        {
          comercio_id: comercioId,
          habilitado,
          gestion_modo: gestionModo,
          permite_puntos: true,
          permite_dinero: false,
          permite_mixto: false,
          permite_pedidos: true,
          permite_retiro: permiteRetiro,
          permite_envio_domicilio: permiteEnvioDomicilio,
          costo_envio: costoEnvio,
          permite_pago_al_recibir: permitePagoAlRecibir,
          permite_transferencia: permiteTransferencia,
          banco_transferencia: bancoTransferencia || null,
          titular_transferencia: titularTransferencia || null,
          cbu_transferencia: cbuTransferencia || null,
          alias_transferencia: aliasTransferencia || null,
          cuit_cuil_titular_transferencia:
            cuitCuilTitularTransferencia || null,
          permite_canje_puntos: permiteCanjePuntos,
          genera_puntos_con_canje: generaPuntosConCanje,

          modo_generacion_puntos: modoGeneracionPuntos,

          tipo_generacion_puntos:
            modoGeneracionPuntos === "todo_catalogo"
              ? tipoGeneracionPuntos
              : null,

          valor_generacion_puntos:
            modoGeneracionPuntos === "todo_catalogo"
              ? valorGeneracionPuntos
              : null,

          cada_monto_generacion_puntos:
            modoGeneracionPuntos === "todo_catalogo"
              ? cadaMontoGeneracionPuntos
              : null,

          puntos_por_tramo_generacion:
            modoGeneracionPuntos === "todo_catalogo"
              ? puntosPorTramoGeneracion
              : null,

          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "comercio_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error guardando configuración catálogo:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      configuracion: data,
    });
  } catch (error) {
    console.error("Error inesperado PUT catálogo:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}