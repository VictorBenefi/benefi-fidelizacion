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

    // 🔍 1. Obtener saldo actual
    const { data: saldoData, error: saldoError } = await supabaseAdmin
      .from('saldos')
      .select('saldo')
      .eq('usuario_id', usuario_id)
      .eq('comercio_id', comercio_id)
      .single()

    if (saldoError) throw saldoError

    const saldo = saldoData?.saldo || 0

    // 🚫 2. Validar saldo
    if (saldo < puntos) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      )
    }

    // 💰 3. Insertar canje
    const { error } = await supabaseAdmin
      .from('movimientos_puntos')
      .insert({
        usuario_id,
        comercio_id,
        tipo: 'canje',
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