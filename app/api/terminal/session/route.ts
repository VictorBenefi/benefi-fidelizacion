import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getTerminalSessionFromRequest } from '@/lib/auth/terminalSession'

export async function GET(req: Request) {
  try {
    const session = getTerminalSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Sesión de terminal no válida',
        },
        { status: 401 }
      )
    }

    const { data: terminal, error } = await supabaseAdmin
      .from('terminales')
      .select('id, comercio_id, nombre_sucursal, activa')
      .eq('id', session.terminal_id)
      .eq('comercio_id', session.comercio_id)
      .maybeSingle()

    if (error) {
      console.error('Error validando terminal:', error)

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo validar la terminal',
        },
        { status: 500 }
      )
    }

    if (!terminal || !terminal.activa) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Terminal no válida o inactiva',
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
    console.error('Error validando sesión de terminal:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Ocurrió un error al validar la sesión',
      },
      { status: 500 }
    )
  }
}