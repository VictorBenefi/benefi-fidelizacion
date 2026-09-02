'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

function urlBase64ToUint8Array(base64String: string) {
  const padding =
    '='.repeat((4 - (base64String.length % 4)) % 4)

  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  )
}

export default function ActivarNotificaciones() {
  const params = useParams()
  const comercioId = params?.comercioId as string

  const [permiso, setPermiso] =
    useState<NotificationPermission>('default')

  const [compatible, setCompatible] =
    useState(false)

  const registrarSuscripcion = async () => {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (!user) return

      const { data: usuario } = await supabaseClient
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!usuario?.id) return

      const registration =
        await navigator.serviceWorker.ready

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        const publicKey =
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!publicKey) {
          console.error(
            'Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY'
          )
          return
        }

        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(publicKey),
          })
      }

      const subscriptionJson =
        subscription.toJSON()

      const response = await fetch(
        '/api/push/subscribe',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario_id: usuario.id,
            comercio_id: comercioId,
            endpoint: subscription.endpoint,
            p256dh:
              subscriptionJson.keys?.p256dh,
            auth:
              subscriptionJson.keys?.auth,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.ok) {
        console.error(
          'No se pudo guardar la suscripción Push:',
          data?.error
        )
      }
    } catch (error) {
      console.error(
        'Error registrando suscripción Push:',
        error
      )
    }
  }

  useEffect(() => {
    if (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setCompatible(true)
      setPermiso(Notification.permission)

      if (Notification.permission === 'granted') {
        registrarSuscripcion()
      }
    }
  }, [])

  async function activarNotificaciones() {
    try {
      const resultado =
        await Notification.requestPermission()

      setPermiso(resultado)

      if (resultado === 'granted') {
        await registrarSuscripcion()
      }
    } catch (error) {
      console.error(
        'Error solicitando permiso de notificaciones:',
        error
      )
    }
  }

  if (!compatible) {
    return null
  }

  if (permiso === 'granted') {
    return null
  }

  if (permiso === 'denied') {
    return null
  }

  return (
    <button
      type="button"
      onClick={activarNotificaciones}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      🔔 Activar notificaciones
    </button>
  )
}