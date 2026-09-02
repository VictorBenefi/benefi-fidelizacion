import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { usuario_id, comercio_id, terminal_id } = body

    if (!usuario_id) {
      return NextResponse.json(
        { ok: false, error: 'usuario_id es obligatorio' },
        { status: 400 }
      )
    }

    if (!comercio_id) {
      return NextResponse.json(
        { ok: false, error: 'comercio_id es obligatorio' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('movimientos_puntos')
      .select(`
        id,
        operacion_id,
        terminal_id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        observaciones,
        fecha,
        promocion_id,
        estado,
        es_reverso,
        movimiento_original_id,
        anulado_por_movimiento_id
      `)
      .eq('usuario_id', usuario_id)
      .eq('comercio_id', comercio_id)

    if (terminal_id) {
      query = query.eq('terminal_id', terminal_id)
    }

const { data, error } = await query
  .order('fecha', { ascending: false })
  .limit(30)

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      movimientos: data || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}