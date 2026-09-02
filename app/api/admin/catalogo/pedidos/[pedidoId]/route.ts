import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  context: {
    params: Promise<{ pedidoId: string }>;
  }
) {
  try {
    const { pedidoId } = await context.params;

    if (!pedidoId) {
      return NextResponse.json(
        { error: "Falta el identificador del pedido" },
        { status: 400 }
      );
    }

    const { data: pedido, error: pedidoError } =
      await supabaseAdmin
        .from("catalogo_pedidos")
        .select(`
          *,
          comercios (
            id,
            nombre_fantasia
            )
        `)
        .eq("id", pedidoId)
        .maybeSingle();

    if (pedidoError) {
      console.error(
        "Error cargando detalle del pedido:",
        pedidoError
      );

      return NextResponse.json(
        {
          error:
            pedidoError.message ||
            "No se pudo cargar el pedido",
        },
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
      console.error(
        "Error cargando productos del pedido:",
        itemsError
      );

      return NextResponse.json(
        {
          error:
            itemsError.message ||
            "No se pudieron cargar los productos",
        },
        { status: 500 }
      );
    }

    let usuario = null;

    if (pedido.usuario_id) {
      const { data: usuarioData, error: usuarioError } =
        await supabaseAdmin
          .from("usuarios")
          .select(
            "id, nombre_completo, dni, email"
          )
          .eq("id", pedido.usuario_id)
          .maybeSingle();

      if (usuarioError) {
        console.error(
          "Error cargando usuario del pedido:",
          usuarioError
        );
      } else {
        usuario = usuarioData;
      }
    }

    const pedidoCompleto = {
      ...pedido,

      comercio: pedido.comercios
        ? {
            id: pedido.comercios.id,
            nombre: pedido.comercios.nombre_fantasia,
            }
        : null,

      usuario,

      items: items || [],

      comercios: undefined,
    };

    return NextResponse.json({
      ok: true,
      pedido: pedidoCompleto,
    });
  } catch (error) {
    console.error(
      "Error inesperado cargando detalle del pedido:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}