import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      usuario_id,
      comercio_id,
      endpoint,
      p256dh,
      auth,
    } = body

    if (
      !usuario_id ||
      !comercio_id ||
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        { error: 'Faltan datos de la suscripción' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          usuario_id,
          comercio_id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
        }
      )

    if (error) {
      console.error(
        'Error guardando suscripción Push:',
        error
      )

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      'Error en /api/push/subscribe:',
      error
    )

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}