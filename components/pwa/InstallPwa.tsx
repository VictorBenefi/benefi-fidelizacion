'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export default function InstallPwa({
  nombreComercio,
  modo = 'tarjeta',
  onContinuar,
}: {
  nombreComercio: string
  modo?: 'tarjeta' | 'bienvenida'
  onContinuar?: () => void
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [mostrarAyudaIos, setMostrarAyudaIos] = useState(false)

useEffect(() => {
  const userAgent = window.navigator.userAgent.toLowerCase()

  const ios = /iphone|ipad|ipod/.test(userAgent)

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true

  setIsIos(ios)
  setIsStandalone(standalone)

  const storageKey = `benefi-pwa-installed-${window.location.pathname.split('/')[2]}`

  const instaladaGuardada =
    window.localStorage.getItem(storageKey) === '1'

  if (standalone || instaladaGuardada) {
    setIsStandalone(true)
  }

  const promptGuardado = (window as any).__benefiPwaPrompt

  if (promptGuardado) {
    setDeferredPrompt(promptGuardado as BeforeInstallPromptEvent)
  }

  const handler = (event: Event) => {
    event.preventDefault()

    ;(window as any).__benefiPwaPrompt = event

    setDeferredPrompt(event as BeforeInstallPromptEvent)
  }

  const handlerPromptReady = () => {
    const prompt = (window as any).__benefiPwaPrompt

    if (prompt) {
      setDeferredPrompt(prompt as BeforeInstallPromptEvent)
    }
  }

  window.addEventListener('beforeinstallprompt', handler)

  window.addEventListener(
    'benefi-pwa-prompt-ready',
    handlerPromptReady
  )

  const handlerInstalled = () => {
  const storageKey = `benefi-pwa-installed-${window.location.pathname.split('/')[2]}`

  window.localStorage.setItem(storageKey, '1')
  setIsStandalone(true)
  }

  window.addEventListener('appinstalled', handlerInstalled)

  return () => {
    window.removeEventListener('beforeinstallprompt', handler)

    window.removeEventListener(
      'benefi-pwa-prompt-ready',
      handlerPromptReady
    )
  window.removeEventListener('appinstalled', handlerInstalled)
  }
}, [])

const instalar = async () => {
  
  if (isIos) {
    setMostrarAyudaIos(true)
    return
  }

  const prompt =
    deferredPrompt ||
    ((window as any).__benefiPwaPrompt as BeforeInstallPromptEvent | undefined)


if (!prompt) {
  console.log('NO HAY PROMPT DISPONIBLE')

  alert(
    'Para crear el acceso, abrí el menú del navegador y seleccioná "Instalar aplicación" o "Agregar a pantalla principal".'
  )

  return
}

  await prompt.prompt()

  const choice = await prompt.userChoice

  if (choice.outcome === 'accepted') {
    const storageKey = `benefi-pwa-installed-${window.location.pathname.split('/')[2]}`

    window.localStorage.setItem(storageKey, '1')

    setDeferredPrompt(null)
    setIsStandalone(true)

    ;(window as any).__benefiPwaPrompt = null

    onContinuar?.()
  }
}

  if (isStandalone) {
    return null
  }

  if (modo === 'bienvenida') {
    return (
      <>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="text-5xl">🎉</div>

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              ¡Tu cuenta ya está lista!
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Creá un acceso de <strong>{nombreComercio}</strong> en la
              pantalla principal de tu teléfono.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
              <p className="font-bold text-slate-900">
                📱 Entrá con un solo toque
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Vas a poder consultar tus puntos, movimientos y beneficios
                sin tener que buscar nuevamente la página.
              </p>
            </div>

            <button
              type="button"
              onClick={instalar}
              className="mt-6 w-full cursor-pointer rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-slate-800"
            >
              Crear acceso en mi teléfono
            </button>

            <button
              type="button"
              onClick={onContinuar}
              className="mt-3 cursor-pointer border-none bg-transparent text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Ahora no, continuar a mi cuenta
            </button>

            <p className="mt-4 text-xs text-slate-400">
              No necesitás descargar una app desde una tienda.
            </p>
          </div>
        </div>

        {mostrarAyudaIos && (
          <AyudaIos onCerrar={() => setMostrarAyudaIos(false)} />
        )}
      </>
    )
  }

  return (
    <>
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              📱 Acceso desde tu teléfono
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Agregá {nombreComercio} a tu pantalla principal
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Creá un acceso directo para entrar a tus puntos y beneficios
              con un solo toque.
            </p>
          </div>

          <button
            type="button"
            onClick={instalar}
            className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Crear acceso
          </button>
        </div>
      </div>

      {mostrarAyudaIos && (
        <AyudaIos onCerrar={() => setMostrarAyudaIos(false)} />
      )}
    </>
  )
}

function AyudaIos({
  onCerrar,
}: {
  onCerrar: () => void
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold text-slate-900">
          Agregar a pantalla de inicio
        </h3>

        <p className="mt-3 text-sm text-slate-600">
          En iPhone o iPad:
        </p>

        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <li>
            1. Tocá <strong>Compartir</strong> en Safari.
          </li>
          <li>
            2. Elegí <strong>Agregar a pantalla de inicio</strong>.
          </li>
          <li>
            3. Tocá <strong>Agregar</strong>.
          </li>
        </ol>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-6 w-full cursor-pointer rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}