import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createTerminalSessionToken,
  terminalSessionCookieName,
  terminalSessionDuration,
} from '@/lib/auth/terminalSession'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const terminalId = String(body.terminal_id || '').trim()
    const pin = String(body.pin || '').trim()

    if (!terminalId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No se informó la terminal',
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
    .eq('id', terminalId)
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

    const sessionToken = createTerminalSessionToken({
      terminal_id: terminal.id,
      comercio_id: terminal.comercio_id,
    })

    const response = NextResponse.json({
      ok: true,
      terminal: {
        id: terminal.id,
        comercio_id: terminal.comercio_id,
        nombre_sucursal: terminal.nombre_sucursal,
      },
    })

    response.cookies.set({
      name: terminalSessionCookieName,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: terminalSessionDuration,
    })

    return response
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