import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const comercioId = body?.comercio_id;
    const usuarioId = body?.usuario_id;
    const items = Array.isArray(body?.items) ? body.items : [];

    const modalidadEntrega = body?.modalidad_entrega;
    const formaPago = body?.forma_pago;
    const puntosSolicitados = Math.max(
      0,
      Math.floor(Number(body?.puntos_canjeados || 0))
    );

    const nombreReceptor = String(body?.nombre_receptor || "").trim();
    const direccionEntrega = String(body?.direccion_entrega || "").trim();
    const observacionGeneral = String(
      body?.observacion_general || ""
    ).trim();

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    if (!usuarioId) {
      return NextResponse.json(
        { error: "El pedido requiere un usuario registrado" },
        { status: 400 }
      );
    }

    const { data: usuarioComercio, error: usuarioComercioError } =
      await supabaseAdmin
        .from("usuarios_comercios")
        .select("usuario_id")
        .eq("usuario_id", usuarioId)
        .eq("comercio_id", comercioId)
        .maybeSingle();

    if (usuarioComercioError) {
      console.error(
        "Error validando usuario del comercio:",
        usuarioComercioError
      );

      return NextResponse.json(
        { error: "No se pudo validar el usuario" },
        { status: 500 }
      );
    }

    if (!usuarioComercio) {
      return NextResponse.json(
        {
          error:
            "El usuario no está registrado en el programa de este comercio",
        },
        { status: 403 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "El pedido no tiene productos" },
        { status: 400 }
      );
    }

    if (!["retiro", "domicilio"].includes(modalidadEntrega)) {
      return NextResponse.json(
        { error: "Modalidad de entrega inválida" },
        { status: 400 }
      );
    }

    if (!nombreReceptor) {
      return NextResponse.json(
        { error: "Falta el nombre de quien recibe o retira" },
        { status: 400 }
      );
    }

    if (modalidadEntrega === "domicilio" && !direccionEntrega) {
      return NextResponse.json(
        { error: "Falta la dirección de entrega" },
        { status: 400 }
      );
    }

    const { data: configuracion, error: configError } =
      await supabaseAdmin
        .from("catalogo_configuracion")
        .select(
          `
            permite_retiro,
            permite_envio_domicilio,
            costo_envio,
            permite_pago_al_recibir,
            permite_transferencia,
            permite_canje_puntos,
            genera_puntos_con_canje,
            banco_transferencia,
            titular_transferencia,
            cbu_transferencia,
            alias_transferencia,
            cuit_cuil_titular_transferencia
          `
        )
        .eq("comercio_id", comercioId)
        .maybeSingle();

    if (configError) {
      console.error(
        "Error leyendo configuración de entrega:",
        configError
      );

      return NextResponse.json(
        { error: "No se pudo validar la entrega" },
        { status: 500 }
      );
    }

    const permiteRetiro =
      configuracion?.permite_retiro !== false;

    const permiteEnvio =
      !!configuracion?.permite_envio_domicilio;
      const permitePagoAlRecibir =
      configuracion?.permite_pago_al_recibir !== false;

      const permiteTransferencia =
        !!configuracion?.permite_transferencia;

      const permiteCanjePuntos =
        configuracion?.permite_canje_puntos !== false;

      if (puntosSolicitados > 0 && !permiteCanjePuntos) {
        return NextResponse.json(
          { error: "El comercio no permite canje de puntos en el catálogo" },
          { status: 400 }
        );
      }

    if (modalidadEntrega === "retiro" && !permiteRetiro) {
      return NextResponse.json(
        { error: "El comercio no permite retiro" },
        { status: 400 }
      );
    }

    if (modalidadEntrega === "domicilio" && !permiteEnvio) {
      return NextResponse.json(
        { error: "El comercio no permite envío a domicilio" },
        { status: 400 }
      );
    }

    if (!["al_recibir", "transferencia"].includes(formaPago)) {
      return NextResponse.json(
        { error: "Forma de pago inválida" },
        { status: 400 }
      );
    }

    if (formaPago === "al_recibir" && !permitePagoAlRecibir) {
      return NextResponse.json(
        { error: "El comercio no permite pago al recibir" },
        { status: 400 }
      );
    }

    if (formaPago === "transferencia" && !permiteTransferencia) {
      return NextResponse.json(
        { error: "El comercio no permite transferencia bancaria" },
        { status: 400 }
      );
    }

    const productoIds = items.map(
      (item: any) => item.producto_id
    );

    const { data: productos, error: productosError } =
      await supabaseAdmin
        .from("catalogo_productos")
        .select(
          "id, comercio_id, categoria_id, nombre, imagen_url, precio_pesos, precio_puntos, activo, controla_stock, stock"
        )
        .in("id", productoIds);

    if (productosError) {
      console.error(
        "Error leyendo productos del pedido:",
        productosError
      );

      return NextResponse.json(
        { error: "No se pudieron validar los productos" },
        { status: 500 }
      );
    }

    if (!productos || productos.length !== productoIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no existen" },
        { status: 400 }
      );
    }

    let subtotalPesos = 0;
    let subtotalPuntos = 0;

    const detalle = [];

    for (const item of items) {
      const producto = productos.find(
        (p) => p.id === item.producto_id
      );

      if (!producto) {
        return NextResponse.json(
          { error: "Producto inválido" },
          { status: 400 }
        );
      }

      if (producto.comercio_id !== comercioId) {
        return NextResponse.json(
          { error: "Producto perteneciente a otro comercio" },
          { status: 400 }
        );
      }

      if (!producto.activo) {
        return NextResponse.json(
          {
            error: `El producto "${producto.nombre}" no está disponible`,
          },
          { status: 400 }
        );
      }

      const cantidad = Number(item.cantidad || 0);

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        return NextResponse.json(
          { error: "Cantidad de producto inválida" },
          { status: 400 }
        );
      }

      if (producto.controla_stock) {
        const stockDisponible = Number(producto.stock || 0);

        if (stockDisponible < cantidad) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}`,
            },
            { status: 400 }
          );
        }
      }

      const precioPesos = Number(producto.precio_pesos || 0);
      const precioPuntos = Number(producto.precio_puntos || 0);

      const itemSubtotalPesos =
        precioPesos * cantidad;

      const itemSubtotalPuntos =
        precioPuntos * cantidad;

      subtotalPesos += itemSubtotalPesos;
      subtotalPuntos += itemSubtotalPuntos;

      detalle.push({
        producto_id: producto.id,
        categoria_id: producto.categoria_id || null,
        producto_nombre: producto.nombre,
        producto_imagen_url: producto.imagen_url || null,
        cantidad,
        precio_pesos_unitario: precioPesos,
        precio_puntos_unitario: precioPuntos,
        subtotal_pesos: itemSubtotalPesos,
        subtotal_puntos: itemSubtotalPuntos,
        observacion:
          String(item.observacion || "").trim() || null,
      });
    }

    const costoEnvio =
      modalidadEntrega === "domicilio"
        ? Number(configuracion?.costo_envio || 0)
        : 0;

    const totalPesos =
      subtotalPesos + costoEnvio;

      const totalPuntos = subtotalPuntos;
      let puntosCanjeados = 0;
let montoCanjePuntos = 0;

if (puntosSolicitados > 0) {
  const { data: movimientosSaldo, error: saldoError } =
    await supabaseAdmin
      .from("movimientos_puntos")
      .select("tipo, puntos, estado")
      .eq("usuario_id", usuarioId)
      .eq("comercio_id", comercioId);

  if (saldoError) {
    console.error(
      "Error calculando saldo de puntos:",
      saldoError
    );

    return NextResponse.json(
      { error: "No se pudo validar el saldo de puntos" },
      { status: 500 }
    );
  }

  const saldoDisponible = (movimientosSaldo || [])
    .filter((movimiento: any) => movimiento.estado !== "anulado")
    .reduce((total: number, movimiento: any) => {
      const puntos = Number(movimiento.puntos || 0);

      if (movimiento.tipo === "carga") {
        return total + puntos;
      }

      if (movimiento.tipo === "canje") {
        return total - puntos;
      }

      if (movimiento.tipo === "reversion") {
        return total + puntos;
      }

      return total;
    }, 0);

  if (puntosSolicitados > saldoDisponible) {
    return NextResponse.json(
      {
        error: `Saldo de puntos insuficiente. Disponible: ${saldoDisponible}`,
      },
      { status: 400 }
    );
  }

  if (puntosSolicitados > totalPuntos) {
    return NextResponse.json(
      {
        error:
          "Los puntos a utilizar superan el valor en puntos de los productos",
      },
      { status: 400 }
    );
  }

  puntosCanjeados = puntosSolicitados;

  montoCanjePuntos = Math.min(
    puntosCanjeados,
    subtotalPesos
  );
}

const totalAPagarPesos = Math.max(
  subtotalPesos - montoCanjePuntos,
  0
) + costoEnvio;

    const { data: pedido, error: pedidoError } =
      await supabaseAdmin
        .from("catalogo_pedidos")
        .insert({
          comercio_id: comercioId,
          usuario_id: usuarioId,
          estado: "nuevo",
          modalidad_entrega: modalidadEntrega,
          nombre_receptor: nombreReceptor,
          direccion_entrega:
            modalidadEntrega === "domicilio"
              ? direccionEntrega
              : null,
          observacion_general:
            observacionGeneral || null,
          subtotal_pesos: subtotalPesos,
          costo_envio: costoEnvio,
          total_pesos: totalPesos,
          total_puntos: totalPuntos,

          uso_puntos: puntosCanjeados > 0,
          puntos_canjeados: puntosCanjeados,
          monto_canje_puntos: montoCanjePuntos,
          total_a_pagar_pesos: totalAPagarPesos,         
          forma_pago: formaPago,
          estado_pago: "pendiente",

          banco_transferencia:
            formaPago === "transferencia"
              ? configuracion?.banco_transferencia || null
              : null,

          titular_transferencia:
            formaPago === "transferencia"
              ? configuracion?.titular_transferencia || null
              : null,

          cbu_transferencia:
            formaPago === "transferencia"
              ? configuracion?.cbu_transferencia || null
              : null,

          alias_transferencia:
            formaPago === "transferencia"
              ? configuracion?.alias_transferencia || null
              : null,

          cuit_cuil_titular_transferencia:
            formaPago === "transferencia"
              ? configuracion?.cuit_cuil_titular_transferencia || null
              : null,
        })
        .select()
        .single();

    if (pedidoError || !pedido) {
      console.error(
        "Error creando pedido:",
        pedidoError
      );

      return NextResponse.json(
        {
          error:
            pedidoError?.message ||
            "No se pudo crear el pedido",
        },
        { status: 500 }
      );
    }

    const detalleConPedido = detalle.map((item) => ({
      ...item,
      pedido_id: pedido.id,
    }));

    const { error: itemsError } =
      await supabaseAdmin
        .from("catalogo_pedido_items")
        .insert(detalleConPedido);

    if (itemsError) {
    console.error(
        "Error creando detalle del pedido:",
        itemsError
    );

    await supabaseAdmin
        .from("catalogo_pedidos")
        .delete()
        .eq("id", pedido.id);

    return NextResponse.json(
        {
        error:
            itemsError.message ||
            "No se pudo guardar el detalle del pedido",
        },
        { status: 500 }
    );
    }

    if (puntosCanjeados > 0) {
    const { error: canjeError } =
      await supabaseAdmin
        .from("movimientos_puntos")
        .insert({
          usuario_id: usuarioId,
          comercio_id: comercioId,
          tipo: "canje",
          puntos: puntosCanjeados,
          monto_compra: subtotalPesos,
          nro_ticket: `PED-${pedido.numero_pedido}`,
          observaciones: `Canje de puntos en pedido #${pedido.numero_pedido}`,
          origen: "catalogo",
          estado: "activo",
          catalogo_pedido_id: pedido.id,
        });

    if (canjeError) {
      console.error(
        "Error registrando canje de puntos:",
        canjeError
      );

      await supabaseAdmin
        .from("catalogo_pedido_items")
        .delete()
        .eq("pedido_id", pedido.id);

      await supabaseAdmin
        .from("catalogo_pedidos")
        .delete()
        .eq("id", pedido.id);

      return NextResponse.json(
        {
          error:
            "No se pudo registrar el canje de puntos",
        },
        { status: 500 }
      );
    }
  }

    for (const item of detalle) {
  const producto = productos.find(
    (p) => p.id === item.producto_id
  );

  if (!producto?.controla_stock) {
    continue;
  }

  const stockActual = Number(producto.stock || 0);
  const nuevoStock = stockActual - Number(item.cantidad || 0);

  const { error: stockError } =
      await supabaseAdmin
        .from("catalogo_productos")
        .update({
          stock: nuevoStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", producto.id)
        .eq("comercio_id", comercioId);

    if (stockError) {
      console.error(
        `Error actualizando stock del producto ${producto.id}:`,
        stockError
      );

      return NextResponse.json(
        {
          error:
            "El pedido fue creado, pero ocurrió un error al actualizar el stock",
        },
        { status: 500 }
      );
    }
  }

    return NextResponse.json({
      ok: true,
      pedido: {
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        estado: pedido.estado,
        total_pesos: pedido.total_pesos,
        total_puntos: pedido.total_puntos,
        uso_puntos: pedido.uso_puntos,
        puntos_canjeados: pedido.puntos_canjeados,
        monto_canje_puntos: pedido.monto_canje_puntos,
        total_a_pagar_pesos: pedido.total_a_pagar_pesos,
        forma_pago: pedido.forma_pago,
        estado_pago: pedido.estado_pago,
      },
    });
  } catch (error) {
    console.error(
      "Error inesperado creando pedido:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}