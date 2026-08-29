import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const comercioId = String(body.comercio_id || '').trim()
    const pin = String(body.pin || '').trim()

    if (!comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No se informó el comercio',
        },
        { status: 400 }
      )
    }

    if (!pin) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Ingresá el PIN',
        },
        { status: 400 }
      )
    }

    const { data: terminal, error } = await supabaseAdmin
      .from('terminales')
      .select('id, comercio_id, nombre_sucursal, activa')
      .eq('comercio_id', comercioId)
      .eq('pin', pin)
      .eq('activa', true)
      .maybeSingle()

    if (error) {
      console.error('Error buscando terminal:', error)

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo validar la terminal',
        },
        { status: 500 }
      )
    }

    if (!terminal) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PIN incorrecto o terminal inactiva',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      terminal: {
        id: terminal.id,
        comercio_id: terminal.comercio_id,
        nombre_sucursal: terminal.nombre_sucursal,
      },
    })
  } catch (error) {
    console.error('Error login terminal:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Ocurrió un error al validar la terminal',
      },
      { status: 500 }
    )
  }
}