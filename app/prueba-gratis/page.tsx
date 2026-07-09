'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function PruebaGratisPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    nombre_fantasia: '',
    razon_social: '',
    cuit: '',
    rubro: '',
    ciudad: '',
    provincia: '',
    responsable_nombre: '',
    email: '',
    whatsapp: '',
  })

  const irAlFormulario = () => {
    document.getElementById('formulario')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  const guardar = async () => {
    if (
      !form.nombre_fantasia.trim() ||
      !form.razon_social.trim() ||
      !form.cuit.trim() ||
      !form.rubro.trim() ||
      !form.ciudad.trim() ||
      !form.provincia.trim() ||
      !form.responsable_nombre.trim() ||
      !form.email.trim() ||
      !form.whatsapp.trim()
    ) {
      setError('Completá todos los campos obligatorios para solicitar tu prueba gratuita.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/solicitudes-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_fantasia: form.nombre_fantasia,
          razon_social: form.razon_social,
          cuit: form.cuit,
          rubro: form.rubro,
          ciudad: form.ciudad,
          provincia: form.provincia,
          responsable_nombre: form.responsable_nombre,
          email: form.email,
          whatsapp: form.whatsapp,

          direccion: '',
          telefono: form.whatsapp,
          nombre_programa: '',
          comentarios: '',
          logo_url: '',
          promociones_iniciales: [],
        }),
      })

      if (!response.ok) {
        setError('No se pudo enviar la solicitud. Intentá nuevamente.')
        return
      }

      ;(window as any).dataLayer = (window as any).dataLayer || []

      ;(window as any).dataLayer.push({
        event: 'prueba_gratis_enviada',
        comercio: form.nombre_fantasia,
        rubro: form.rubro,
        provincia: form.provincia,
        ciudad: form.ciudad,
      })

      setSuccess(true)

      setForm({
        nombre_fantasia: '',
        razon_social: '',
        cuit: '',
        rubro: '',
        ciudad: '',
        provincia: '',
        responsable_nombre: '',
        email: '',
        whatsapp: '',
      })
    } catch (error) {
      setError('Ocurrió un error al enviar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-200 px-6">
        <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">🎉</div>

          <h1 className="mb-3 text-3xl font-bold text-slate-950">
            ¡Solicitud recibida!
          </h1>

          <p className="mb-6 text-slate-600">
            En las próximas horas nos pondremos en contacto para configurar tu
            programa de puntos y ayudarte a comenzar.
          </p>

          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="cursor-pointer rounded-xl bg-[#C1121F] px-6 py-3 font-semibold text-white transition hover:bg-[#A10E1A]"
          >
            Cargar otra solicitud
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <Image
              src="/landing/logo-benefi-blanco.png"
              alt="BENEFI"
              width={160}
              height={60}
              className="mb-8"
            />

            <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              Programa de puntos para comercios
            </p>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Hacé que tus clientes vuelvan a comprar.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Implementá tu propio programa de fidelización en menos de 48
              horas. Sin desarrollar una app y sin grandes inversiones.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5">
              <div className="text-2xl font-black">30 días GRATIS</div>
              <div className="mt-1 text-slate-300">
                Luego solo <strong>USD 39 / mes</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={irAlFormulario}
              className="mt-8 cursor-pointer rounded-xl bg-[#C1121F] px-7 py-4 text-base font-bold text-white shadow-lg transition hover:bg-[#A10E1A]"
            >
              🚀 Probar gratis durante 30 días
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-3xl" />
            <Image
              src="/landing/backoffice-terminal.png"
              alt="Portal comercio BENEFI"
              width={800}
              height={600}
              className="relative rounded-3xl shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black md:text-4xl">
            Más que un programa de puntos.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            BENEFI te ayuda a fidelizar clientes, aumentar la frecuencia de
            compra y ofrecer una experiencia moderna desde la web.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <div className="text-4xl">❤️</div>
              <h3 className="mt-4 text-xl font-bold">Fidelizá clientes</h3>
              <p className="mt-3 text-slate-600">
                Premiá cada compra y generá un motivo para que vuelvan.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <div className="text-4xl">📈</div>
              <h3 className="mt-4 text-xl font-bold">Incrementá ventas</h3>
              <p className="mt-3 text-slate-600">
                Los puntos incentivan nuevas compras y aumentan la recurrencia.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <div className="text-4xl">⚡</div>
              <h3 className="mt-4 text-xl font-bold">Implementación rápida</h3>
              <p className="mt-3 text-slate-600">
                En menos de 48 horas podés comenzar a operar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black md:text-4xl">
              ¿Qué recibe tu comercio?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Una plataforma completa para administrar puntos, clientes,
              movimientos y beneficios desde cualquier lugar.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
              <Image
                src="/landing/backoffice-terminal.png"
                alt="Portal comercio"
                width={600}
                height={400}
                className="rounded-2xl"
              />
              <h3 className="mt-5 text-xl font-bold">Portal Comercio</h3>
              <p className="mt-2 text-slate-600">
                Gestioná clientes, puntos, promociones y movimientos desde un
                único panel.
              </p>
            </div>

            <div className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
              <Image
                src="/landing/portal-cliente-celular.png"
                alt="Portal cliente móvil"
                width={600}
                height={400}
                className="rounded-2xl"
              />
              <h3 className="mt-5 text-xl font-bold">Portal Cliente</h3>
              <p className="mt-2 text-slate-600">
                Tus clientes consultan saldo, movimientos y beneficios desde su
                celular.
              </p>
            </div>

            <div className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
              <Image
                src="/landing/portal-cliente-web.png"
                alt="Portal web cliente"
                width={600}
                height={400}
                className="rounded-2xl"
              />
              <h3 className="mt-5 text-xl font-bold">Todo desde la web</h3>
              <p className="mt-2 text-slate-600">
                Sin descargar aplicaciones. Todo funciona desde el navegador.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black">¿Qué incluye?</h2>

            <div className="mt-6 grid gap-3 text-slate-700 md:grid-cols-2">
              {[
                'Programa de puntos',
                'Portal Comercio',
                'Portal Cliente',
                'Promociones',
                'Historial de movimientos',
                'Dashboard y reportes',
                'Notificaciones',
                'Hosting incluido',
                'Soporte y actualizaciones',
                'Configuración inicial',
              ].map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="text-[#C1121F]">✔</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
            <h2 className="text-3xl font-black">¿Cómo funciona?</h2>

            <div className="mt-8 space-y-5">
              {[
                'Completás el formulario.',
                'Configuramos tu comercio.',
                'Recibís tus accesos.',
                'Comenzás a fidelizar clientes.',
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C1121F] font-bold">
                    {index + 1}
                  </div>
                  <p className="text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-slate-50 p-8 text-center shadow-sm">
          <h2 className="text-3xl font-black">
            Probalo gratis durante 30 días
          </h2>

          <p className="mt-4 text-slate-600">
            Durante la prueba no pagás nada. Si decidís continuar, pagas de forma mensual:
          </p>

          <div className="mt-6 text-5xl font-black text-[#C1121F]">
            USD 39
            <span className="text-lg font-semibold text-slate-500"> / mes</span>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Sin costo de implementación, sin permanencia y sin costos ocultos.
          </p>

          <button
            type="button"
            onClick={irAlFormulario}
            className="mt-8 cursor-pointer rounded-xl bg-[#C1121F] px-7 py-4 font-bold text-white transition hover:bg-[#A10E1A]"
          >
            Comenzar ahora
          </button>
        </div>
      </section>

      <section id="formulario" className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-3xl font-black">Solicitá tu prueba gratuita</h2>

          <p className="mt-3 text-slate-600">
            Completá tus datos y nos pondremos en contacto para configurar tu
            programa.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              placeholder="Nombre de fantasía"
              className="rounded-xl border p-3"
              value={form.nombre_fantasia}
              onChange={(e) =>
                setForm({ ...form, nombre_fantasia: e.target.value })
              }
            />

            <input
              placeholder="Razón social"
              className="rounded-xl border p-3"
              value={form.razon_social}
              onChange={(e) =>
                setForm({ ...form, razon_social: e.target.value })
              }
            />

            <input
              placeholder="CUIT"
              className="rounded-xl border p-3"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            />

            <input
              placeholder="Rubro"
              className="rounded-xl border p-3"
              value={form.rubro}
              onChange={(e) => setForm({ ...form, rubro: e.target.value })}
            />

            <input
              placeholder="Ciudad"
              className="rounded-xl border p-3"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            />

            <input
              placeholder="Provincia"
              className="rounded-xl border p-3"
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
            />

            <input
              placeholder="Nombre y apellido"
              className="rounded-xl border p-3"
              value={form.responsable_nombre}
              onChange={(e) =>
                setForm({ ...form, responsable_nombre: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="rounded-xl border p-3"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="tel"
              placeholder="WhatsApp"
              className="rounded-xl border p-3 md:col-span-2"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ⚠️ {error}
            </div>
          )}

          <button
            type="button"
            onClick={guardar}
            disabled={loading}
            className="mt-6 w-full cursor-pointer rounded-xl bg-[#C1121F] px-6 py-4 font-bold text-white transition hover:bg-[#A10E1A] disabled:opacity-60"
          >
            {loading ? 'Enviando...' : '🚀 Comenzar prueba gratuita'}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            En las próximas horas te contactaremos para configurar tu programa.
          </p>
        </div>
      </section>
    </main>
  )
}