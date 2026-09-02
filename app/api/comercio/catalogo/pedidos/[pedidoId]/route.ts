import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarPushUsuario } from '@/lib/push'
import { calcularPuntosPedido } from '@/lib/catalogoPuntos'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ESTADOS_VALIDOS = [
  "nuevo",
  "preparando",
  "listo",
  "en_envio",
  "entregado",
  "cancelado",
];

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  try {
    const { pedidoId } = await context.params;

    const { searchParams } = new URL(req.url);
    const comercioId = searchParams.get("comercio_id");

    if (!pedidoId || !comercioId) {
      return NextResponse.json(
        { error: "Faltan datos del pedido" },
        { status: 400 }
      );
    }

    const { data: pedido, error: pedidoError } =
      await supabaseAdmin
        .from("catalogo_pedidos")
        .select("*")
        .eq("id", pedidoId)
        .eq("comercio_id", comercioId)
        .maybeSingle();

    if (pedidoError) {
      return NextResponse.json(
        { error: pedidoError.message },
        { status: 500 }
      );
    }

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const { data: items, error: itemsError } =
      await supabaseAdmin
        .from("catalogo_pedido_items")
        .select("*")
        .eq("pedido_id", pedidoId)
        .order("created_at", { ascending: true });

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    let usuario = null;

    if (pedido.usuario_id) {
      const { data: usuarioData } =
        await supabaseAdmin
          .from("usuarios")
          .select("id, nombre_completo, dni, email")
          .eq("id", pedido.usuario_id)
          .maybeSingle();

      usuario = usuarioData || null;
    }

    return NextResponse.json({
      ok: true,
      pedido: {
        ...pedido,
        usuario,
        items: items || [],
      },
    });
  } catch (error) {
    console.error("Error cargando pedido:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  try {
    const { pedidoId } = await context.params;
    const body = await req.json();

    const comercioId = body?.comercio_id;
    const estado = body?.estado;
    const confirmarPago = body?.confirmar_pago === true;
    const marcarVisto = body?.marcar_visto === true;

    if (
      !pedidoId ||
      !comercioId ||
      (!estado && !confirmarPago && !marcarVisto)
    ) {
      return NextResponse.json(
        { error: "Faltan datos para actualizar el pedido" },
        { status: 400 }
      );
    }

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    const { data: pedidoActual } =
      await supabaseAdmin
        .from("catalogo_pedidos")
        .select("id, estado, forma_pago, estado_pago")
        .eq("id", pedidoId)
        .eq("comercio_id", comercioId)
        .maybeSingle();

    if (!pedidoActual) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (marcarVisto) {
      const { data: pedidoVisto, error: vistoError } =
        await supabaseAdmin
          .from("catalogo_pedidos")
          .update({
            visto_comercio: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pedidoId)
          .eq("comercio_id", comercioId)
          .select()
          .single();

      if (vistoError) {
        return NextResponse.json(
          { error: vistoError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        pedido: pedidoVisto,
      });
    }

    if (confirmarPago) {
    if (pedidoActual.forma_pago !== "transferencia") {
      return NextResponse.json(
        { error: "Solo se puede confirmar manualmente un pago por transferencia" },
        { status: 400 }
      );
    }

  if (pedidoActual.estado_pago === "pagado") {
    return NextResponse.json({
      ok: true,
      mensaje: "El pago ya estaba confirmado",
    });
  }

  const { data: pedidoPagado, error: pagoError } =
    await supabaseAdmin
      .from("catalogo_pedidos")
      .update({
        estado_pago: "pagado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedidoId)
      .eq("comercio_id", comercioId)
      .select()
      .single();

  if (pagoError) {
    return NextResponse.json(
      { error: pagoError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    pedido: pedidoPagado,
  });
}

    if (
  pedidoActual.estado === "entregado" ||
  pedidoActual.estado === "cancelado"
) {
  return NextResponse.json(
    {
      error:
        pedidoActual.estado === "entregado"
          ? "El pedido ya fue entregado y no puede modificarse"
          : "El pedido está cancelado y no puede modificarse",
    },
    { status: 400 }
  );
}

    const { data: pedido, error } =
      await supabaseAdmin
        .from("catalogo_pedidos")
        .update({
          estado,
          ...(estado === "entregado" &&
          pedidoActual.forma_pago === "al_recibir"
            ? { estado_pago: "pagado" }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", pedidoId)
        .eq("comercio_id", comercioId)
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const { data: items } =
      await supabaseAdmin
        .from("catalogo_pedido_items")
        .select("*")
        .eq("pedido_id", pedidoId)
        .order("created_at", { ascending: true });

    let usuario = null;

    if (pedido.usuario_id) {
      const { data: usuarioData } =
        await supabaseAdmin
          .from("usuarios")
          .select("id, nombre_completo, dni, email")
          .eq("id", pedido.usuario_id)
          .maybeSingle();

      usuario = usuarioData || null;
    }

    if (
  estado === "listo" &&
  pedidoActual.estado !== "listo" &&
  pedido.usuario_id
) {
  const esDomicilio =
    pedido.modalidad_entrega === "domicilio";

  const titulo = "Tu pedido está listo";

  const mensaje = esDomicilio
    ? `Tu pedido #${pedido.numero_pedido} ya está listo y pronto será enviado.`
    : `Tu pedido #${pedido.numero_pedido} ya está listo para retirar.`;

  const { data: notificacion, error: notificacionError } =
    await supabaseAdmin
      .from("notificaciones")
      .insert({
        comercio_id: comercioId,
        titulo,
        mensaje,
        tipo: "pedido",
        activa: true,
      })
      .select("id")
      .single();

  if (!notificacionError && notificacion) {
    await supabaseAdmin
      .from("usuarios_notificaciones")
      .insert({
        notificacion_id: notificacion.id,
        usuario_id: pedido.usuario_id,
        leida: false,
      });
  }
    await enviarPushUsuario({
    usuarioId: pedido.usuario_id,
    comercioId,
    titulo,
    mensaje,
    url: `/usuarios/${comercioId}/dashboard`,
  })
}

if (
  estado === "en_envio" &&
  pedidoActual.estado !== "en_envio" &&
  pedido.usuario_id
) {
  const titulo = "Tu pedido está en camino";

  const mensaje =
    `Tu pedido #${pedido.numero_pedido} salió del comercio y está en camino a tu domicilio.`;

  const { data: notificacion, error: notificacionError } =
    await supabaseAdmin
      .from("notificaciones")
      .insert({
        comercio_id: comercioId,
        titulo,
        mensaje,
        tipo: "pedido",
        activa: true,
      })
      .select("id")
      .single();

  if (!notificacionError && notificacion) {
    await supabaseAdmin
      .from("usuarios_notificaciones")
      .insert({
        notificacion_id: notificacion.id,
        usuario_id: pedido.usuario_id,
        leida: false,
      });
  }
  await enviarPushUsuario({
  usuarioId: pedido.usuario_id,
  comercioId,
  titulo,
  mensaje,
  url: `/usuarios/${comercioId}/dashboard`,
});
}

if (
  estado === "entregado" &&
  pedidoActual.estado !== "entregado" &&
  pedido.usuario_id
) {
    const resultadoPuntos = await calcularPuntosPedido({
      comercioId,
      pedidoId,
      subtotalPesos: Number(pedido.subtotal_pesos || 0),
      formaPago: pedido.forma_pago || null,
      puntosCanjeados: Number(pedido.puntos_canjeados || 0),
      items: (items || []).map((item: any) => ({
      producto_id: item.producto_id || null,
      categoria_id: item.categoria_id || null,
      subtotal_pesos: item.subtotal_pesos || 0,
    })),
  });

  let puntosAcreditados = 0;

  if (resultadoPuntos.puntos > 0) {
    const { error: movimientoError } =
      await supabaseAdmin
        .from("movimientos_puntos")
        .insert({
          usuario_id: pedido.usuario_id,
          comercio_id: comercioId,
          tipo: "carga",
          puntos: resultadoPuntos.puntos,
          monto_compra: Number(
            pedido.subtotal_pesos || 0
          ),
          nro_ticket: `PED-${pedido.numero_pedido}`,
          observaciones:
            `Puntos por pedido #${pedido.numero_pedido}`,
          origen: "catalogo",
          estado: "activo",
          catalogo_pedido_id: pedido.id,
          fecha: new Date().toISOString(),
        });

    if (!movimientoError) {
      puntosAcreditados =
        resultadoPuntos.puntos;
    } else if (movimientoError.code !== "23505") {
      console.error(
        "Error acreditando puntos del pedido:",
        movimientoError
      );
    }
  }

  const titulo = "Pedido entregado";

  const mensaje =
    puntosAcreditados > 0
      ? `Tu pedido #${pedido.numero_pedido} fue entregado. Ganaste ${puntosAcreditados.toLocaleString("es-AR")} puntos.`
      : `Tu pedido #${pedido.numero_pedido} fue entregado correctamente.`;

  const { data: notificacion, error: notificacionError } =
    await supabaseAdmin
      .from("notificaciones")
      .insert({
        comercio_id: comercioId,
        titulo,
        mensaje,
        tipo: "pedido",
        activa: true,
      })
      .select("id")
      .single();

  if (!notificacionError && notificacion) {
    await supabaseAdmin
      .from("usuarios_notificaciones")
      .insert({
        notificacion_id: notificacion.id,
        usuario_id: pedido.usuario_id,
        leida: false,
      });
  }

  await enviarPushUsuario({
    usuarioId: pedido.usuario_id,
    comercioId,
    titulo,
    mensaje,
    url: `/usuarios/${comercioId}/dashboard`,
  });
}

    return NextResponse.json({
      ok: true,
      pedido: {
        ...pedido,
        usuario,
        items: items || [],
      },
    });
  } catch (error) {
    console.error(
      "Error actualizando pedido:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}