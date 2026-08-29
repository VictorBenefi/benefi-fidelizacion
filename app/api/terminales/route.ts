import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const comercioId = searchParams.get('comercio_id')

    if (!comercioId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'comercio_id es obligatorio',
        },
        { status: 400 }
      )
    }

    const { data: terminales, error } = await supabaseAdmin
      .from('terminales')
      .select(
        'id, comercio_id, nombre_sucursal, pin, activa, created_at'
      )
      .eq('comercio_id', comercioId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error cargando terminales:', error)

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudieron cargar las terminales',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      terminales: terminales || [],
    })
  } catch (error) {
    console.error('Error API terminales:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Ocurrió un error al cargar las terminales',
      },
      { status: 500 }
    )
  }
}
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const comercioId = String(body.comercio_id || '').trim()
    const nombreSucursal = String(body.nombre_sucursal || '').trim()
    const pin = String(body.pin || '').trim()

    if (!comercioId) {
      return NextResponse.json(
        { ok: false, error: 'comercio_id es obligatorio' },
        { status: 400 }
      )
    }

    if (!nombreSucursal) {
      return NextResponse.json(
        { ok: false, error: 'Ingresá el nombre de la sucursal' },
        { status: 400 }
      )
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'El PIN debe contener entre 4 y 6 números',
        },
        { status: 400 }
      )
    }

    const { data: terminalExistente, error: buscarError } =
      await supabaseAdmin
        .from('terminales')
        .select('id')
        .eq('comercio_id', comercioId)
        .eq('pin', pin)
        .maybeSingle()

    if (buscarError) {
      console.error('Error verificando PIN:', buscarError)

      return NextResponse.json(
        { ok: false, error: 'No se pudo verificar el PIN' },
        { status: 500 }
      )
    }

    if (terminalExistente) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Este PIN ya está utilizado por otra terminal del comercio',
        },
        { status: 409 }
      )
    }

    const { data: terminal, error } = await supabaseAdmin
      .from('terminales')
      .insert({
        comercio_id: comercioId,
        nombre_sucursal: nombreSucursal,
        pin,
        activa: true,
      })
      .select(
        'id, comercio_id, nombre_sucursal, pin, activa, created_at'
      )
      .single()

    if (error) {
      console.error('Error creando terminal:', error)

      return NextResponse.json(
        { ok: false, error: 'No se pudo crear la terminal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      terminal,
    })
  } catch (error) {
    console.error('Error creando terminal:', error)

    return NextResponse.json(
      { ok: false, error: 'Ocurrió un error al crear la terminal' },
      { status: 500 }
    )
  }
}
export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const terminalId = String(body.id || '').trim()
    const comercioId = String(body.comercio_id || '').trim()
    const nombreSucursal = String(body.nombre_sucursal || '').trim()
    const pin = String(body.pin || '').trim()
    const activa = body.activa === true

    if (!terminalId || !comercioId) {
      return NextResponse.json(
        { ok: false, error: 'Faltan datos de la terminal' },
        { status: 400 }
      )
    }

    if (!nombreSucursal) {
      return NextResponse.json(
        { ok: false, error: 'Ingresá el nombre de la sucursal' },
        { status: 400 }
      )
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'El PIN debe contener entre 4 y 6 números',
        },
        { status: 400 }
      )
    }

    const { data: pinExistente, error: buscarError } =
      await supabaseAdmin
        .from('terminales')
        .select('id')
        .eq('comercio_id', comercioId)
        .eq('pin', pin)
        .neq('id', terminalId)
        .maybeSingle()

    if (buscarError) {
      console.error('Error verificando PIN:', buscarError)

      return NextResponse.json(
        { ok: false, error: 'No se pudo verificar el PIN' },
        { status: 500 }
      )
    }

    if (pinExistente) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Este PIN ya está utilizado por otra terminal del comercio',
        },
        { status: 409 }
      )
    }

    const { data: terminal, error } = await supabaseAdmin
      .from('terminales')
      .update({
        nombre_sucursal: nombreSucursal,
        pin,
        activa,
      })
      .eq('id', terminalId)
      .eq('comercio_id', comercioId)
      .select(
        'id, comercio_id, nombre_sucursal, pin, activa, created_at'
      )
      .single()

    if (error) {
      console.error('Error actualizando terminal:', error)

      return NextResponse.json(
        { ok: false, error: 'No se pudo actualizar la terminal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      terminal,
    })
  } catch (error) {
    console.error('Error actualizando terminal:', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Ocurrió un error al actualizar la terminal',
      },
      { status: 500 }
    )
  }
}