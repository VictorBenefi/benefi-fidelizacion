import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = String(body.email || '').trim().toLowerCase()
    const comercioId = String(body.comercio_id || '').trim()
    const codigo = String(body.codigo || '').trim()

    if (!email || !comercioId || !codigo) {
      return NextResponse.json(
        { ok: false, error: 'Completá el código de verificación.' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(codigo)) {
      return NextResponse.json(
        { ok: false, error: 'El código debe tener 6 dígitos.' },
        { status: 400 }
      )
    }

    const { data: verificacion, error } = await supabaseAdmin
      .from('verificaciones_email')
      .select('id, codigo, expira_en, intentos')
      .eq('email', email)
      .eq('comercio_id', comercioId)
      .eq('verificado', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error consultando verificación:', error)

      return NextResponse.json(
        { ok: false, error: 'No se pudo verificar el código.' },
        { status: 500 }
      )
    }

    if (!verificacion) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No encontramos un código pendiente. Solicitá uno nuevo.',
        },
        { status: 400 }
      )
    }

    if (new Date(verificacion.expira_en).getTime() < Date.now()) {
      await supabaseAdmin
        .from('verificaciones_email')
        .update({ verificado: true })
        .eq('id', verificacion.id)

      return NextResponse.json(
        {
          ok: false,
          error: 'El código venció. Solicitá uno nuevo.',
          codigo: 'CODIGO_VENCIDO',
        },
        { status: 400 }
      )
    }

    const intentosActuales = Number(verificacion.intentos || 0)

    if (intentosActuales >= 5) {
      await supabaseAdmin
        .from('verificaciones_email')
        .update({ verificado: true })
        .eq('id', verificacion.id)

      return NextResponse.json(
        {
          ok: false,
          error: 'Superaste la cantidad de intentos. Solicitá un código nuevo.',
          codigo: 'MAX_INTENTOS',
        },
        { status: 429 }
      )
    }

    if (verificacion.codigo !== codigo) {
      const nuevosIntentos = intentosActuales + 1

      await supabaseAdmin
        .from('verificaciones_email')
        .update({
          intentos: nuevosIntentos,
          verificado: nuevosIntentos >= 5,
        })
        .eq('id', verificacion.id)

      return NextResponse.json(
        {
          ok: false,
          error:
            nuevosIntentos >= 5
              ? 'Superaste la cantidad de intentos. Solicitá un código nuevo.'
              : `Código incorrecto. Te quedan ${5 - nuevosIntentos} intento(s).`,
        },
        { status: 400 }
      )
    }

    const { error: actualizarError } = await supabaseAdmin
      .from('verificaciones_email')
      .update({ verificado: true })
      .eq('id', verificacion.id)

    if (actualizarError) {
      console.error('Error marcando código como verificado:', actualizarError)

      return NextResponse.json(
        { ok: false, error: 'No se pudo completar la verificación.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Email verificado correctamente.',
    })
  } catch (error) {
    console.error('Error verificando código:', error)

    return NextResponse.json(
      { ok: false, error: 'Ocurrió un error al verificar el código.' },
      { status: 500 }
    )
  }
}