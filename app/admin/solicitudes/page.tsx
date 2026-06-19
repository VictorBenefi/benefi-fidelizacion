'use client'

import { useEffect, useState } from 'react'

type SolicitudDemo = {
  id: string
  created_at: string
  nombre_fantasia: string
  razon_social: string | null
  cuit: string | null
  rubro: string | null
  direccion: string | null
  ciudad: string | null
  provincia: string | null
  responsable_nombre: string
  email: string
  telefono: string | null
  whatsapp: string | null
  nombre_programa: string | null
  logo_url: string | null
  promociones_iniciales: any[]
  estado: string
  plan: string
  precio_mensual: number
  fecha_inicio_trial: string | null
  fecha_fin_trial: string | null
  convertido_pago: boolean
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudDemo[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState<SolicitudDemo | null>(null)

  const cargarSolicitudes = async () => {
    setLoading(true)

    const response = await fetch('/api/admin/solicitudes-demo')
    const result = await response.json()

    if (response.ok) {
      setSolicitudes(result.data || [])
    } else {
      alert(result.error || 'No se pudieron cargar las solicitudes')
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarSolicitudes()
  }, [])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  const cambiarEstado = async (id: string, estado: string) => {
  const response = await fetch('/api/admin/solicitudes-demo/estado', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, estado }),
  })

  const result = await response.json()

  if (!response.ok) {
    alert(result.error || 'No se pudo cambiar el estado')
    return
  }

  await cargarSolicitudes()
  setSeleccionada(result.data)
}

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de prueba</h1>
          <p className="text-slate-500">
            Comercios que solicitaron activar el sistema de puntos BENEFI.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarSolicitudes}
          className="cursor-pointer rounded-xl border px-4 py-2 hover:bg-slate-50"
        >
          Actualizar
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando solicitudes...</div>
        ) : solicitudes.length === 0 ? (
          <div className="p-6 text-slate-500">
            Todavía no hay solicitudes cargadas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Logo</th>
                  <th className="px-4 py-3">Comercio</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Promos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>

              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="border-t">
                    <td className="px-4 py-3">
                      {formatearFecha(solicitud.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      {solicitud.logo_url ? (

                        <div className="flex flex-col items-center">

                          <div className="h-24 w-24 rounded-xl border border-slate-300 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-2">
                            <img
                              src={solicitud.logo_url}
                              alt="Logo comercio"
                              className="h-full w-full object-contain"

                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />

                          </div>

                          <a
                            href={solicitud.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                              className="mt-3 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100"

                          >
                            Descargar logo
                          </a>

                        </div>

                        ) : (

                        <div className="h-32 w-32 rounded-xl border border-slate-300 bg-slate-100 flex items-center justify-center">

                          <span className="text-xs text-slate-400">
                            Sin logo
                          </span>

                        </div>

                        )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        {solicitud.nombre_fantasia}
                      </div>
                      <div className="text-xs text-slate-500">
                        {solicitud.rubro || 'Sin rubro'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {solicitud.responsable_nombre}
                    </td>

                    <td className="px-4 py-3">
                      <div>{solicitud.email}</div>
                      <div className="text-xs text-slate-500">
                        {solicitud.whatsapp || solicitud.telefono || 'Sin teléfono'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {solicitud.promociones_iniciales?.length || 0}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        {solicitud.estado}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div>{solicitud.plan}</div>
                      <div className="text-xs text-slate-500">
                        USD {solicitud.precio_mensual}/mes
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSeleccionada(solicitud)}
                        className="cursor-pointer rounded-lg bg-black px-4 py-2 text-white hover:bg-slate-800"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {seleccionada.nombre_fantasia}
                </h2>
                <p className="text-slate-500">
                  Solicitud recibida el {formatearFecha(seleccionada.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSeleccionada(null)}
                className="cursor-pointer rounded-lg border px-3 py-1 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[160px_1fr]">
              <div>
                {seleccionada.logo_url ? (
                  <img
                    src={seleccionada.logo_url}
                    alt={seleccionada.nombre_fantasia}
                    className="h-32 w-32 rounded-xl border object-contain"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-xl border text-slate-400">
                    Sin logo
                  </div>
                )}
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-slate-500">Razón social</p>
                  <p className="font-medium">{seleccionada.razon_social || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-500">CUIT</p>
                  <p className="font-medium">{seleccionada.cuit || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-500">Rubro</p>
                  <p className="font-medium">{seleccionada.rubro || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-500">Dirección</p>
                  <p className="font-medium">{seleccionada.direccion || '-'}</p>
                </div>

                <div>
                  <p className="text-slate-500">Ciudad / Provincia</p>
                  <p className="font-medium">
                    {seleccionada.ciudad || '-'} / {seleccionada.provincia || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Responsable</p>
                  <p className="font-medium">
                    {seleccionada.responsable_nombre}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium">{seleccionada.email}</p>
                </div>

                <div>
                  <p className="text-slate-500">WhatsApp</p>
                  <p className="font-medium">
                    {seleccionada.whatsapp || seleccionada.telefono || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-5">
              <h3 className="mb-3 text-lg font-semibold">
                Promociones iniciales
              </h3>

              {seleccionada.promociones_iniciales?.length ? (
                <div className="space-y-3">
                  {seleccionada.promociones_iniciales.map((promo, index) => (
                    <div key={index} className="rounded-xl border p-4">
                      <div className="font-semibold">
                        Promoción {index + 1} - {promo.titulo || 'Sin título'}
                      </div>

                      <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                        <p>
                          <span className="text-slate-500">Tipo:</span>{' '}
                          {promo.tipo}
                        </p>

                        {promo.tipo === 'porcentaje_puntos' && (
                          <p>
                            <span className="text-slate-500">Porcentaje:</span>{' '}
                            {promo.porcentaje}%
                          </p>
                        )}

                        {promo.tipo === 'puntos_por_monto' && (
                          <>
                            <p>
                              <span className="text-slate-500">Puntos:</span>{' '}
                              {promo.puntos}
                            </p>
                            <p>
                              <span className="text-slate-500">
                                Monto base:
                              </span>{' '}
                              ${promo.monto_base}
                            </p>
                          </>
                        )}

                        {promo.tipo === 'puntos_fijos' && (
                          <p>
                            <span className="text-slate-500">Puntos:</span>{' '}
                            {promo.puntos}
                          </p>
                        )}

                        <p>
                          <span className="text-slate-500">Desde:</span>{' '}
                          {promo.fecha_inicio || '-'}
                        </p>

                        <p>
                          <span className="text-slate-500">Hasta:</span>{' '}
                          {promo.fecha_fin || '-'}
                        </p>
                      </div>

                      {promo.condiciones && (
                        <p className="mt-2 text-sm text-slate-600">
                          {promo.condiciones}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No se cargaron promociones iniciales.
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => cambiarEstado(seleccionada.id, 'pendiente')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                seleccionada.estado === 'pendiente'
                  ? 'bg-yellow-500 text-white border border-yellow-500'
                  : 'border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Pendiente
            </button>

            <button
              type="button"
              onClick={() => cambiarEstado(seleccionada.id, 'produccion_prueba')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                seleccionada.estado === 'produccion_prueba'
                  ? 'bg-blue-600 text-white border border-blue-600'
                  : 'border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Producción prueba
            </button>

            <button
              type="button"
              onClick={() => cambiarEstado(seleccionada.id, 'produccion_definitiva')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                seleccionada.estado === 'produccion_definitiva'
                  ? 'bg-green-600 text-white border border-green-600'
                  : 'border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Producción definitiva
            </button>

            <button
              type="button"
              onClick={() => cambiarEstado(seleccionada.id, 'vencido')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                seleccionada.estado === 'vencido'
                  ? 'bg-red-600 text-white border border-red-600'
                  : 'border border-slate-300 hover:bg-slate-100'
              }`}
            >
              Vencido
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}