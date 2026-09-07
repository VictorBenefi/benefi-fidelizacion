import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getComercioSessionFromRequest } from '@/lib/auth/comercioSession'

export async function POST(req: Request) {
  try {
    const session =
      getComercioSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Sesión de comercio no válida.',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    const {
      usuario_id,
      comercio_id,
      puntos,
      monto_compra,
      nro_ticket,
    } = body

    if (!usuario_id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'usuario_id es obligatorio.',
        },
        { status: 400 }
      )
    }

    if (!comercio_id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'comercio_id es obligatorio.',
        },
        { status: 400 }
      )
    }

    if (session.comercio_id !== comercio_id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'No tenés permiso para operar sobre este comercio.',
        },
        { status: 403 }
      )
    }

    const puntosNumericos = Number(puntos)

    if (
      !Number.isFinite(puntosNumericos) ||
      puntosNumericos <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'La cantidad de puntos debe ser mayor a 0.',
        },
        { status: 400 }
      )
    }

    // Validar que el usuario pertenezca al comercio.
    const {
      data: vinculoUsuario,
      error: vinculoError,
    } = await supabaseAdmin
      .from('usuarios_comercios')
      .select('usuario_id')
      .eq('usuario_id', usuario_id)
      .eq(
        'comercio_id',
        session.comercio_id
      )
      .maybeSingle()

    if (vinculoError) {
      return NextResponse.json(
        {
          ok: false,
          error: vinculoError.message,
        },
        { status: 500 }
      )
    }

    if (!vinculoUsuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'El usuario no pertenece a este comercio.',
        },
        { status: 403 }
      )
    }

    // Obtener saldo únicamente dentro del comercio autenticado.
    const {
      data: saldoData,
      error: saldoError,
    } = await supabaseAdmin
      .from('saldos')
      .select('saldo')
      .eq('usuario_id', usuario_id)
      .eq(
        'comercio_id',
        session.comercio_id
      )
      .maybeSingle()

    if (saldoError) {
      throw saldoError
    }

    const saldo = Number(
      saldoData?.saldo || 0
    )

    if (saldo < puntosNumericos) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Saldo insuficiente',
        },
        { status: 400 }
      )
    }

    // Registrar el canje.
    const { error } = await supabaseAdmin
      .from('movimientos_puntos')
      .insert({
        usuario_id,
        comercio_id:
          session.comercio_id,
        tipo: 'canje',
        puntos: puntosNumericos,
        monto_compra,
        nro_ticket,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error.message ||
          'Error interno',
      },
      { status: 500 }
    )
  }
}