import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = String(body?.id || '').trim()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Falta el id del registro.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios_notificaciones')
      .update({
        leida: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, leida, read_at')
      .single()

    if (error) {
      console.error('Error marcar-leida:', error)

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      registro: data,
    })
  } catch (error: any) {
    console.error('Error interno marcar-leida:', error)

    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}