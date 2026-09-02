import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  'mailto:soporte@benefi.com.ar',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const usuarioId = body?.usuario_id
    const comercioId = body?.comercio_id

    if (!usuarioId || !comercioId) {
      return NextResponse.json(
        { error: 'Faltan usuario_id o comercio_id' },
        { status: 400 }
      )
    }

    const { data: subscriptions, error } =
      await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('comercio_id', comercioId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!subscriptions?.length) {
      return NextResponse.json(
        { error: 'No hay dispositivos registrados' },
        { status: 404 }
      )
    }

    const payload = JSON.stringify({
      title: 'BENEFI',
      body: 'Las notificaciones de BENEFI están funcionando.',
      url: `/usuarios/${comercioId}/dashboard`,
    })

    let enviadas = 0
    let fallidas = 0

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        )

        enviadas++
      } catch (error: any) {
        console.error(
          'Error enviando Push:',
          error?.statusCode,
          error?.body || error
        )

        fallidas++

        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      enviadas,
      fallidas,
    })
  } catch (error) {
    console.error('Error en Push test:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}