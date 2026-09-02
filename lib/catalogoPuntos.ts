import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ItemPedido = {
  producto_id: string | null;
  categoria_id: string | null;
  subtotal_pesos: number | string | null;
};

type ResultadoPuntos = {
  puntos: number;
  detalle: string;
};

export async function calcularPuntosPedido({
  comercioId,
  pedidoId,
  subtotalPesos,
  formaPago,
  puntosCanjeados,
  items,
}: {
  comercioId: string;
  pedidoId: string;
  subtotalPesos: number;
  formaPago: string | null;
  puntosCanjeados: number;
  items: ItemPedido[];
}): Promise<ResultadoPuntos> {

  const { data: configuracion, error: configError } =
    await supabaseAdmin
      .from("catalogo_configuracion")
      .select(`
        modo_generacion_puntos,
        tipo_generacion_puntos,
        valor_generacion_puntos,
        cada_monto_generacion_puntos,
        puntos_por_tramo_generacion,
        genera_puntos_con_canje
      `)
      .eq("comercio_id", comercioId)
      .maybeSingle();

  if (configError || !configuracion) {
    return {
      puntos: 0,
      detalle: "Sin configuración de puntos",
    };
  }

  if (
    puntosCanjeados > 0 &&
    !configuracion.genera_puntos_con_canje
  ) {
    return {
      puntos: 0,
      detalle: "Pedido con canje de puntos",
    };
  }

  const modo =
    configuracion.modo_generacion_puntos || "ninguno";

  if (modo === "ninguno") {
    return {
      puntos: 0,
      detalle: "El catálogo no genera puntos",
    };
  }

  if (modo === "todo_catalogo") {
    const tipo = configuracion.tipo_generacion_puntos;

    if (tipo === "porcentaje") {
      const porcentaje = Number(
        configuracion.valor_generacion_puntos || 0
      );

      return {
        puntos: Math.floor(
          subtotalPesos * porcentaje / 100
        ),
        detalle: `${porcentaje}% sobre subtotal`,
      };
    }

    if (tipo === "tramo") {
      const cadaMonto = Number(
        configuracion.cada_monto_generacion_puntos || 0
      );

      const puntosPorTramo = Number(
        configuracion.puntos_por_tramo_generacion || 0
      );

      if (cadaMonto <= 0) {
        return {
          puntos: 0,
          detalle: "Configuración por tramo inválida",
        };
      }

      return {
        puntos:
          Math.floor(subtotalPesos / cadaMonto) *
          puntosPorTramo,
        detalle: "Puntos por tramo sobre subtotal",
      };
    }

    if (tipo === "puntos_fijos") {
      return {
        puntos: Math.floor(
          Number(
            configuracion.valor_generacion_puntos || 0
          )
        ),
        detalle: "Puntos fijos por pedido",
      };
    }

    return {
      puntos: 0,
      detalle: "Tipo de generación inválido",
    };
  }

  if (modo === "por_categoria") {
    const itemsConCategoria = [];

    for (const item of items) {
      let categoriaId = item.categoria_id;

      if (!categoriaId && item.producto_id) {
        const { data: producto } =
          await supabaseAdmin
            .from("catalogo_productos")
            .select("categoria_id")
            .eq("id", item.producto_id)
            .maybeSingle();

        categoriaId =
          producto?.categoria_id || null;
      }

      itemsConCategoria.push({
        ...item,
        categoria_id: categoriaId,
      });
    }

    const subtotalesPorCategoria =
      new Map<string, number>();

    for (const item of itemsConCategoria) {
      if (!item.categoria_id) continue;

      const subtotal =
        Number(item.subtotal_pesos || 0);

      subtotalesPorCategoria.set(
        item.categoria_id,
        (subtotalesPorCategoria.get(
          item.categoria_id
        ) || 0) + subtotal
      );
    }

    if (subtotalesPorCategoria.size === 0) {
      return {
        puntos: 0,
        detalle: "Sin categorías aplicables",
      };
    }

    const categoriaIds =
      Array.from(subtotalesPorCategoria.keys());

    const { data: reglas, error: reglasError } =
      await supabaseAdmin
        .from(
          "catalogo_configuracion_puntos_categoria"
        )
        .select(`
          categoria_id,
          activa,
          tipo_generacion_puntos,
          valor_generacion_puntos,
          cada_monto_generacion_puntos,
          puntos_por_tramo_generacion
        `)
        .eq("comercio_id", comercioId)
        .in("categoria_id", categoriaIds);

    if (reglasError) {
      return {
        puntos: 0,
        detalle:
          "No se pudieron leer reglas por categoría",
      };
    }

    let totalPuntos = 0;

    for (const regla of reglas || []) {
      if (!regla.activa) continue;

      const subtotalCategoria =
        subtotalesPorCategoria.get(
          regla.categoria_id
        ) || 0;

      if (
        regla.tipo_generacion_puntos ===
        "porcentaje"
      ) {
        const porcentaje = Number(
          regla.valor_generacion_puntos || 0
        );

        totalPuntos += Math.floor(
          subtotalCategoria * porcentaje / 100
        );
      }

      if (
        regla.tipo_generacion_puntos ===
        "tramo"
      ) {
        const cadaMonto = Number(
          regla.cada_monto_generacion_puntos || 0
        );

        const puntosPorTramo = Number(
          regla.puntos_por_tramo_generacion || 0
        );

        if (cadaMonto > 0) {
          totalPuntos +=
            Math.floor(
              subtotalCategoria / cadaMonto
            ) * puntosPorTramo;
        }
      }

      if (
        regla.tipo_generacion_puntos ===
        "puntos_fijos"
      ) {
        totalPuntos += Math.floor(
          Number(
            regla.valor_generacion_puntos || 0
          )
        );
      }
    }

    return {
      puntos: totalPuntos,
      detalle: "Puntos calculados por categoría",
    };
  }

  return {
    puntos: 0,
    detalle: "Modo de puntos no reconocido",
  };
}