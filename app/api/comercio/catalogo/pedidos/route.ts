import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComercioSessionFromRequest } from "@/lib/auth/comercioSession";

export async function GET(
  req: NextRequest
) {
  try {
    // Validar sesión segura del comercio
    const session =
      getComercioSessionFromRequest(req);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Sesión de comercio no válida.",
        },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const comercioId =
      searchParams.get("comercio_id");

    if (!comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta comercio_id",
        },
        { status: 400 }
      );
    }

    // Verificar que coincida con
    // el comercio autenticado
    if (
      session.comercio_id !==
      comercioId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tenés permiso para acceder a este comercio.",
        },
        { status: 403 }
      );
    }

    // Obtener únicamente pedidos
    // del comercio autenticado
    const {
      data: pedidos,
      error: pedidosError,
    } = await supabaseAdmin
      .from("catalogo_pedidos")
      .select("*")
      .eq(
        "comercio_id",
        session.comercio_id
      )
      .order("created_at", {
        ascending: false,
      });

    if (pedidosError) {
      console.error(
        "Error cargando pedidos:",
        pedidosError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            pedidosError.message,
        },
        { status: 500 }
      );
    }

    const pedidoIds =
      (pedidos || []).map(
        (pedido) => pedido.id
      );

    let items: any[] = [];

    if (pedidoIds.length > 0) {
      const {
        data: itemsData,
        error: itemsError,
      } = await supabaseAdmin
        .from(
          "catalogo_pedido_items"
        )
        .select("*")
        .in(
          "pedido_id",
          pedidoIds
        )
        .order("created_at", {
          ascending: true,
        });

      if (itemsError) {
        console.error(
          "Error cargando items de pedidos:",
          itemsError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              itemsError.message,
          },
          { status: 500 }
        );
      }

      items =
        itemsData || [];
    }

    const usuarioIds = [
      ...new Set(
        (pedidos || [])
          .map(
            (pedido) =>
              pedido.usuario_id
          )
          .filter(Boolean)
      ),
    ];

    let usuarios: any[] = [];

    if (usuarioIds.length > 0) {
      const {
        data: usuariosData,
        error: usuariosError,
      } = await supabaseAdmin
        .from("usuarios")
        .select(
          "id, nombre_completo, dni, email"
        )
        .in(
          "id",
          usuarioIds
        );

      if (usuariosError) {
        console.error(
          "Error cargando usuarios de pedidos:",
          usuariosError
        );
      } else {
        usuarios =
          usuariosData || [];
      }
    }

    const resultado =
      (pedidos || []).map(
        (pedido) => {
          const usuario =
            usuarios.find(
              (item) =>
                item.id ===
                pedido.usuario_id
            ) || null;

          const pedidoItems =
            items.filter(
              (item) =>
                item.pedido_id ===
                pedido.id
            );

          return {
            ...pedido,
            usuario,
            items:
              pedidoItems,
          };
        }
      );

    return NextResponse.json({
      ok: true,
      pedidos: resultado,
    });
  } catch (error) {
    console.error(
      "Error inesperado cargando pedidos:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}