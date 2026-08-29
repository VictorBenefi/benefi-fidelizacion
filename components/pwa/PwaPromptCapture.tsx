'use client'

import { useEffect } from 'react'

export default function PwaPromptCapture() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log(
            'Service Worker registrado:',
            registration.scope
          )
        })
        .catch((error) => {
          console.error(
            'Error registrando Service Worker:',
            error
          )
        })
    }

    const handler = (event: Event) => {
      event.preventDefault()

      ;(window as any).__benefiPwaPrompt = event

      window.dispatchEvent(
        new CustomEvent('benefi-pwa-prompt-ready')
      )
    }

    window.addEventListener(
      'beforeinstallprompt',
      handler
    )

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handler
      )
    }
  }, [])

  return null
}