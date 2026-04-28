import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// 🔹 ACTUALIZAR PROMOCIÓN
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()

    const { error } = await supabaseAdmin
      .from("promociones")
      .update(body)
      .eq("id", id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error actualizando promoción:", error)
    return NextResponse.json(
      { error: "Error al actualizar la promoción" },
      { status: 500 }
    )
  }
}

// 🔹 ELIMINAR PROMOCIÓN (con validación de uso)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // 🔸 Verificar si la promo fue usada en movimientos
    const { count, error: countError } = await supabaseAdmin
      .from("movimientos_puntos")
      .select("*", { count: "exact", head: true })
      .eq("promocion_id", id)

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      )
    }

    // 🔸 Si tiene movimientos, no se elimina
    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          error:
            "No podés eliminar esta promoción porque ya fue utilizada. Podés desactivarla.",
        },
        { status: 400 }
      )
    }

    // 🔸 Si no tiene uso, se elimina
    const { error } = await supabaseAdmin
      .from("promociones")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error eliminando promoción:", error)
    return NextResponse.json(
      { error: "Ocurrió un error al eliminar la promoción" },
      { status: 500 }
    )
  }
}