import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  'mailto:soporte@benefi.com.ar',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

type EnviarPushParams = {
  usuarioId: string
  comercioId: string
  titulo: string
  mensaje: string
  url?: string
}

export async function enviarPushUsuario({
  usuarioId,
  comercioId,
  titulo,
  mensaje,
  url,
}: EnviarPushParams) {
  const { data: subscriptions, error } =
    await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('comercio_id', comercioId)

  if (error) {
    console.error(
      'Error buscando suscripciones Push:',
      error
    )

    return {
      enviadas: 0,
      fallidas: 0,
    }
  }

  if (!subscriptions?.length) {
    return {
      enviadas: 0,
      fallidas: 0,
    }
  }

  const payload = JSON.stringify({
    title: titulo,
    body: mensaje,
    url:
      url ||
      `/usuarios/${comercioId}/dashboard`,
    icon: `/api/pwa/icon/${comercioId}`,
    badge: `/api/pwa/icon/${comercioId}`,
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
      fallidas++

      console.error(
        'Error enviando Push:',
        error?.statusCode,
        error?.body || error
      )

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

  return {
    enviadas,
    fallidas,
  }
}