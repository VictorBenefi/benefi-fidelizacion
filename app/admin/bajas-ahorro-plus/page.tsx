'use client'

import { useEffect, useState } from 'react'

type BajaAhorroPlus = {
  id: string
  programa_slug: string
  programa_nombre: string
  nombre_apellido: string
  dni: string
  email: string
  estado: 'pendiente' | 'procesada'
  created_at: string
  processed_at: string | null
}

export default function BajasAhorroPlusPage() {
  const [solicitudes, setSolicitudes] = useState<BajaAhorroPlus[]>([])
  const [loading, setLoading] = useState(true)

  const cargarSolicitudes = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/bajas-ahorro-plus')
      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'No se pudieron cargar las solicitudes')
        return
      }

      setSolicitudes(result.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const cambiarEstado = async (
  id: string,
  estado: 'pendiente' | 'procesada'
) => {
  const response = await fetch(
    '/api/admin/bajas-ahorro-plus/estado',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, estado }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    alert(result.error || 'No se pudo actualizar la solicitud')
    return
  }

  await cargarSolicitudes()
}

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Bajas Ahorro Plus
          </h1>

          <p className="mt-1 text-slate-500">
            Solicitudes de baja recibidas desde las aplicaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarSolicitudes}
          className="cursor-pointer rounded-xl border bg-white px-4 py-2 hover:bg-slate-50"
        >
          Actualizar
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        {loading ? (
          <div className="p-6 text-slate-500">
            Cargando solicitudes...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-6 text-slate-500">
            Todavía no hay solicitudes de baja.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Programa</th>
                  <th className="px-4 py-3">DNI</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr
                    key={solicitud.id}
                    className="border-t"
                  >
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatearFecha(solicitud.created_at)}
                    </td>

                    <td className="px-4 py-4 font-semibold">
                      {solicitud.programa_nombre}
                    </td>

                    <td className="px-4 py-4">
                      {solicitud.dni}
                    </td>

                    <td className="px-4 py-4">
                      {solicitud.nombre_apellido || '-'}
                    </td>

                    <td className="px-4 py-4">
                      {solicitud.email || '-'}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          solicitud.estado === 'procesada'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {solicitud.estado === 'procesada'
                          ? 'Procesada'
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                    {solicitud.estado === 'pendiente' ? (
                        <button
                        type="button"
                        onClick={() =>
                            cambiarEstado(solicitud.id, 'procesada')
                        }
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
                        >
                        Marcar procesada
                        </button>
                    ) : (
                        <button
                        type="button"
                        onClick={() =>
                            cambiarEstado(solicitud.id, 'pendiente')
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                        Volver a pendiente
                        </button>
                    )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}