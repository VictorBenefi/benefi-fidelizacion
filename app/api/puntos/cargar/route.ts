import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      usuario_id,
      comercio_id,
      puntos,
      monto_compra,
      nro_ticket
    } = body

    const { error } = await supabaseAdmin
      .from('movimientos_puntos')
      .insert({
        usuario_id,
        comercio_id,
        tipo: 'carga',
        puntos,
        monto_compra,
        nro_ticket
      })

    if (error) throw error

    return NextResponse.json({ ok: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}