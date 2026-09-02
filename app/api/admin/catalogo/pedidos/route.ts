import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: pedidos, error: pedidosError } =
      await supabaseAdmin
        .from("catalogo_pedidos")
        .select(`
          *,
          comercios (
            id,
            nombre_fantasia
          )
        `)
        .order("created_at", { ascending: false });

    if (pedidosError) {
      console.error(
        "Error cargando pedidos globales:",
        pedidosError
      );

      return NextResponse.json(
        {
          error:
            pedidosError.message ||
            "No se pudieron cargar los pedidos",
        },
        { status: 500 }
      );
    }

    const usuarioIds = Array.from(
      new Set(
        (pedidos || [])
          .map((pedido: any) => pedido.usuario_id)
          .filter(Boolean)
      )
    );

    let usuarios: any[] = [];

    if (usuarioIds.length > 0) {
      const { data: usuariosData, error: usuariosError } =
        await supabaseAdmin
          .from("usuarios")
          .select("id, nombre_completo, dni, email")
          .in("id", usuarioIds);

      if (usuariosError) {
        console.error(
          "Error cargando usuarios de pedidos:",
          usuariosError
        );
      } else {
        usuarios = usuariosData || [];
      }
    }

    const pedidosCompletos = (pedidos || []).map(
      (pedido: any) => ({
        ...pedido,

        comercio: pedido.comercios
        ? {
            id: pedido.comercios.id,
            nombre: pedido.comercios.nombre_fantasia,
          }
        : null,

        usuario:
          usuarios.find(
            (usuario: any) =>
              usuario.id === pedido.usuario_id
          ) || null,

        comercios: undefined,
      })
    );

    return NextResponse.json({
      ok: true,
      pedidos: pedidosCompletos,
    });
  } catch (error) {
    console.error(
      "Error inesperado cargando pedidos globales:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}