'use client'

import { FormEvent, useState, use } from 'react'

const PROGRAMAS: Record<string, string> = {
  petrasol: 'PETRASOL',
  clubdiez: 'CLUB DIEZ',
  bocata: 'BOCATA',
  laslomas: 'LAS LOMAS',
  octano: 'OCTANO',
  hiperunico: 'HIPER ÚNICO',
}

export default function BajaProgramaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const programaSlug = slug.toLowerCase()
  const programaNombre = PROGRAMAS[programaSlug]

  const [nombreApellido, setNombreApellido] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setEnviando(true)
    setError('')

    try {
      const response = await fetch('/api/baja-programa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programa_slug: programaSlug,
          nombre_apellido: nombreApellido,
          dni,
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar la solicitud.')
      }

      setEnviado(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar la solicitud.'
      )
    } finally {
      setEnviando(false)
    }
  }

  if (!programaNombre) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Programa no encontrado
          </h1>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center">
          <p className="mb-2 text-sm font-medium text-slate-500">
            {programaNombre}
          </p>

          <h1 className="text-2xl font-bold text-slate-900">
            Solicitud de baja
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Completá tus datos para solicitar la baja del programa.
          </p>
        </div>

        {enviado ? (
          <div className="rounded-xl bg-green-50 p-5 text-center">
            <h2 className="font-semibold text-green-800">
              Solicitud recibida
            </h2>

            <p className="mt-1 text-sm text-green-700">
              Tu solicitud fue recibida correctamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre y apellido
              </label>

              <input
                type="text"
                value={nombreApellido}
                onChange={(e) => setNombreApellido(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                DNI
              </label>

              <input
                type="text"
                inputMode="numeric"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email asociado a la cuenta
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Solicitar baja'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}