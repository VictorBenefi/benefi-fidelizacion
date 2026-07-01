'use client'

import { useState } from 'react'
import Image from 'next/image'




export default function PruebaGratisPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [promociones, setPromociones] = useState<any[]>([])
  const [promoAbierta, setPromoAbierta] = useState<number | null>(null)
  

  const [form, setForm] = useState({
    nombre_fantasia: '',
    razon_social: '',
    cuit: '',
    rubro: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    responsable_nombre: '',
    email: '',
    telefono: '',
    whatsapp: '',
    nombre_programa: '',
    
  })
    
  const guardar = async () => {
    setLoading(true)

    try {
      let logo_url = ''

if (logo) {
  if (logo.type !== 'image/png') {
    alert('El logo debe estar en formato PNG')
    setLoading(false)
    return
  }

  const formData = new FormData()
  formData.append('file', logo)

  const uploadResponse = await fetch('/api/upload-logo', {
    method: 'POST',
    body: formData,
  })

  const uploadResult = await uploadResponse.json()

  if (!uploadResponse.ok) {
    alert(uploadResult.error || 'Error al subir el logo')
    setLoading(false)
    return
  }

  logo_url = uploadResult.logo_url
}
    console.log('Promociones a enviar:', promociones)

      const response = await fetch('/api/solicitudes-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        ...form,
        logo_url,
        promociones_iniciales: promociones,
        }),
      })

      if (!response.ok) {
        alert('No se pudo enviar la solicitud')
        return
      }

      ;(window as any).dataLayer = (window as any).dataLayer || []

      ;(window as any).dataLayer.push({
        event: 'prueba_gratis_enviada',
        comercio: form.nombre_fantasia,
        rubro: form.rubro,
        provincia: form.provincia,
      })

      setSuccess(true)

      setForm({
        nombre_fantasia: '',
        razon_social: '',
        cuit: '',
        rubro: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        responsable_nombre: '',
        email: '',
        telefono: '',
        whatsapp: '',
        nombre_programa: '',
        
      })

    setPromociones([])
    setPromoAbierta(null)
    setLogo(null)

      setLogo(null)
    } catch (error) {
      alert('Ocurrió un error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

const agregarPromocion = () => {

  if (promociones.length >= 3) return

  const nuevaPromo = {
    titulo: '',
    tipo: 'porcentaje_puntos',
    porcentaje: 10,
    puntos: 100,
    monto_base: 5000,
    fecha_inicio: '',
    fecha_fin: '',
    condiciones: '',
  }

  setPromociones([
    ...promociones,
    nuevaPromo
  ])

  setPromoAbierta(promociones.length)
}

const actualizarPromocion = (
  index: number,
  campo: string,
  valor: any
) => {
  const nuevas = [...promociones]
  nuevas[index] = {
    ...nuevas[index],
    [campo]: valor,
  }
  setPromociones(nuevas)
}

if (success) {

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-5xl">🎉</div>

        <h1 className="mb-3 text-3xl font-bold">
          ¡Bienvenido a BENEFI!
        </h1>

        <p className="mb-4 text-slate-600">
          Recibimos tu solicitud correctamente.
        </p>

        <p className="mb-6 text-slate-600">
          En las próximas horas configuraremos tu programa de puntos y nos
          pondremos en contacto para activarlo.
        </p>

        <button
            type="button"
            onClick={() => {
                setSuccess(false)
                window.scrollTo({
                top: 0,
                behavior: 'smooth'
                })
            }}
            className="cursor-pointer rounded-xl bg-black px-6 py-3 text-white hover:bg-slate-800"
            >
            Crear otra solicitud
        </button>
      </div>
    </div>
  )
}

return (
  <div className="min-h-screen bg-slate-200 py-10">

    <div className="mx-auto max-w-7xl rounded-3xl bg-white/90 p-8 shadow-xl">

      <div className="mb-4 flex justify-center">

      <Image
        src="/benefi-logo.jpg"
        alt="BENEFI"
        width={220}
        height={69}
        priority
      />

    </div>

    <h1 className="mb-2 text-3xl font-bold">
      Probá BENEFI gratis durante 30 días
    </h1>

    <p className="mb-8 text-slate-600">
      Sin costo de implementación. Luego USD 39 por mes.
    </p>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          placeholder="Nombre de fantasía"
          className="rounded-lg border p-3"
          value={form.nombre_fantasia}
          onChange={(e) =>
            setForm({ ...form, nombre_fantasia: e.target.value })
          }
        />

        <input
          placeholder="Razón social"
          className="rounded-lg border p-3"
          value={form.razon_social}
          onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
        />

        <input
          placeholder="CUIT"
          className="rounded-lg border p-3"
          value={form.cuit}
          onChange={(e) => setForm({ ...form, cuit: e.target.value })}
        />

        <input
          placeholder="Rubro"
          className="rounded-lg border p-3"
          value={form.rubro}
          onChange={(e) => setForm({ ...form, rubro: e.target.value })}
        />

        <input
            placeholder="Dirección"
            className="rounded-lg border p-3"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />

        <input
          placeholder="Ciudad"
          className="rounded-lg border p-3"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
        />

        <input
          placeholder="Provincia"
          className="rounded-lg border p-3"
          value={form.provincia}
          onChange={(e) => setForm({ ...form, provincia: e.target.value })}
        />

        <input
          placeholder="Responsable"
          className="rounded-lg border p-3"
          value={form.responsable_nombre}
          onChange={(e) =>
            setForm({ ...form, responsable_nombre: e.target.value })
          }
        />

        <input
          placeholder="Email"
          className="rounded-lg border p-3"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          placeholder="Teléfono"
          className="rounded-lg border p-3"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />

        <input
          placeholder="WhatsApp"
          className="rounded-lg border p-3"
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
        />
      </div>

      <div className="mt-4">

          <label className="mb-2 block text-sm font-medium">
            Logo del comercio en formato PNG
          </label>

          <input
            id="logo"
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setLogo(file)
            }}
          />

          <label
            htmlFor="logo"
            className="
              inline-flex items-center gap-2
              cursor-pointer rounded-xl
              border border-slate-300
              bg-white px-4 py-2
              text-sm font-medium
              hover:bg-slate-50
            "
          >
            📁 Seleccionar logo (PNG)
          </label>

          {logo && (
            <>
              <p className="mt-2 text-sm font-medium text-green-600">
                ✅ {logo.name} seleccionado
              </p>

              <img
                src={URL.createObjectURL(logo)}
                alt="Vista previa"
                className="mt-3 h-24 rounded-lg border border-slate-300 bg-slate-800 p-2"
              />
            </>
          )}

        </div>

        <div className="mt-8 border-t pt-6">

            <h2 className="text-xl font-semibold mb-2">
                  Promociones iniciales <span className="text-slate-400 text-sm">(máximo 3)</span>

            </h2>

            <p className="text-sm text-slate-500 mb-4">
                Podés incluir hasta <strong>3 promociones iniciales</strong>
            </p>

            {promociones.length < 3 && (
                <button
                    type="button"
                    onClick={agregarPromocion}
                    className="cursor-pointer rounded-xl border border-[#C1121F] bg-white px-4 py-2 font-medium text-[#C1121F] transition hover:bg-red-50"
                >
                    + Agregar promoción
                </button>
                )}

           <div className="mt-4 space-y-3">
                {promociones.map((promo, index) => {
                    const abierta = promoAbierta === index

                    return (
                    <div key={index} className="rounded-xl border">
                        <button
                        type="button"
                        onClick={() => setPromoAbierta(abierta ? null : index)}
                        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                        >
                        <span className="font-semibold">
                            Promoción {index + 1}
                            {promo.titulo ? ` - ${promo.titulo}` : ''}
                        </span>

                        <span className="text-slate-500">{abierta ? '▼' : '►'}</span>
                        </button>

                        {abierta && (
                        <div className="border-t p-4">
                            <div className="mb-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                const nuevas = promociones.filter((_, i) => i !== index)
                                setPromociones(nuevas)
                                setPromoAbierta(null)
                                }}
                                className="cursor-pointer text-sm text-red-600 hover:underline"
                            >
                                Eliminar promoción
                            </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                            <input
                                placeholder="Nombre de la promoción"
                                className="rounded-lg border p-3"
                                value={promo.titulo}
                                onChange={(e) => {
                                const nuevas = [...promociones]
                                nuevas[index].titulo = e.target.value
                                setPromociones(nuevas)
                                }}
                            />

                            <select
                                className="cursor-pointer rounded-lg border p-3"
                                value={promo.tipo}
                                onChange={(e) => {
                                const nuevas = [...promociones]
                                nuevas[index].tipo = e.target.value
                                setPromociones(nuevas)
                                }}
                            >
                                <option value="porcentaje_puntos">
                                % de puntos sobre compra
                                </option>
                                <option value="puntos_por_monto">
                                Puntos por cada $X de compra
                                </option>
                                <option value="puntos_fijos">
                                Puntos fijos por compra
                                </option>
                            </select>

                            {promo.tipo === 'porcentaje_puntos' && (
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={promo.porcentaje}
                                    onChange={(e) =>
                                      actualizarPromocion(index, 'porcentaje', Number(e.target.value))
                                    }
                                    className="w-full rounded-lg border p-3 pr-10"
                                  />

                                  <span className="absolute right-3 top-3 text-slate-500">
                                    %
                                  </span>
                                </div>
                            )}

                            {promo.tipo === 'puntos_por_monto' && (
                                <>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={promo.puntos}
                                    onChange={(e)=>
                                      actualizarPromocion(index,'puntos',Number(e.target.value))
                                    }
                                    className="w-full rounded-lg border p-3 pr-12"
                                  />

                                  <span className="absolute right-3 top-3 text-slate-500">
                                    Pts
                                  </span>
                                </div>

                                <div className="relative">
                                  <input
                                    type="number"
                                    value={promo.monto_base}
                                    onChange={(e)=>
                                      actualizarPromocion(index,'monto_base',Number(e.target.value))
                                    }
                                    className="w-full rounded-lg border p-3 pl-8"
                                  />

                                  <span className="absolute left-3 top-3 text-slate-500">
                                    $
                                  </span>
                                </div>
                                </>
                            )}

                            {promo.tipo === 'puntos_fijos' && (
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={promo.puntos}
                                    onChange={(e)=>
                                      actualizarPromocion(index,'puntos',Number(e.target.value))
                                    }
                                    className="w-full rounded-lg border p-3 pr-12"
                                  />

                                  <span className="absolute right-3 top-3 text-slate-500">
                                    Pts
                                  </span>
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-slate-700">
                                Fecha de inicio
                              </label>

                              <input
                                type="date"
                                value={promo.fecha_inicio}
                                onChange={(e) =>
                                  actualizarPromocion(index, 'fecha_inicio', e.target.value)
                                }
                                className="h-[46px] w-full rounded-lg border bg-white px-3 text-sm"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-slate-700">
                                Fecha de finalización
                              </label>

                              <input
                                type="date"
                                value={promo.fecha_fin}
                                onChange={(e) =>
                                  actualizarPromocion(index, 'fecha_fin', e.target.value)
                                }
                                className="h-[46px] w-full rounded-lg border bg-white px-3 text-sm"
                              />
                            </div>
                            </div>

                            <textarea
                            placeholder="Condiciones"
                            className="mt-4 w-full rounded-lg border p-3"
                            rows={2}
                            value={promo.condiciones}
                            onChange={(e) => {
                                const nuevas = [...promociones]
                                nuevas[index].condiciones = e.target.value
                                setPromociones(nuevas)
                            }}
                            />
                        </div>
                        )}
                    </div>
                    )
                })}
            </div>

        </div>

      <button
        onClick={guardar}
        disabled={loading}
        className="mt-6 cursor-pointer rounded-xl bg-[#C1121F] px-6 py-3 text-white transition hover:bg-[#A10E1A] disabled:opacity-60"
        >
        {loading ? 'Enviando...' : 'Comenzar prueba gratuita'}
      </button>

          </div>

        </div>

    )
}