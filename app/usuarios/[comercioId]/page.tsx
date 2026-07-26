'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

type TabKey = 'login' | 'register' | 'recover'

export default function UsuariosPage() {
  const params = useParams()
  const router = useRouter()

  const comercioId = Array.isArray(params?.comercioId)
    ? params.comercioId[0]
    : (params?.comercioId as string) || ''

  const [tab, setTab] = useState<TabKey>('login')
  const [loading, setLoading] = useState(false)
  const [loadingBranding, setLoadingBranding] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [mensajeTipo, setMensajeTipo] = useState<'ok' | 'error' | ''>('')

  const [comercio, setComercio] = useState<any>(null)
  const [campaign, setCampaign] = useState<any>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverPassword, setRecoverPassword] = useState('')
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState('')

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [showRecoverPassword, setShowRecoverPassword] = useState(false)
  const [showRecoverConfirmPassword, setShowRecoverConfirmPassword] = useState(false)

  useEffect(() => {
    const cargarBranding = async () => {
      try {
        setLoadingBranding(true)

        if (!comercioId) return

        const { data: comercioData } = await supabaseClient
          .from('comercios')
          .select('*')
          .eq('id', comercioId)
          .single()

        setComercio(comercioData)

        if (comercioData?.campaign_id) {
          const { data: campaignData } = await supabaseClient
            .from('campaign_settings')
            .select('*')
            .eq('id', comercioData.campaign_id)
            .single()

          setCampaign(campaignData)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingBranding(false)
      }
    }

    cargarBranding()
  }, [comercioId])

  const branding = useMemo(() => {
    const titulo =
      campaign?.nombre_campania ||
      campaign?.portal_titulo ||
      comercio?.nombre_fantasia ||
      comercio?.razon_social ||
      'Programa de beneficios'

    const descripcionOriginal = campaign?.portal_descripcion || ''

    const descripcion =
      descripcionOriginal &&
      !descripcionOriginal.toLowerCase().includes('terminal') &&
      !descripcionOriginal.toLowerCase().includes('dashboard') &&
      !descripcionOriginal.toLowerCase().includes('herramientas operativas')
        ? descripcionOriginal
        : 'Ingresá o registrate para consultar tus puntos y movimientos.'

    const logo = campaign?.logo_comercio_url || ''

    const colorPrimarioOriginal = campaign?.color_sidebar || '#2563eb'
    const colorSecundarioOriginal = campaign?.color_activo || '#1e40af'
    const colorFondoOriginal = campaign?.color_fondo || '#f8fafc'

    const colorPrimario = esColorClaro(colorPrimarioOriginal)
      ? '#1d4ed8'
      : colorPrimarioOriginal

    const colorSecundario = esColorClaro(colorSecundarioOriginal)
      ? '#1e3a8a'
      : colorSecundarioOriginal

    const colorFondo = esColorClaro(colorFondoOriginal)
      ? '#f8fafc'
      : colorFondoOriginal

    const colorBoton = esColorClaro(colorPrimarioOriginal)
      ? '#2563eb'
      : colorPrimarioOriginal

    return {
      titulo,
      descripcion,
      logo,
      colorPrimario,
      colorSecundario,
      colorFondo,
      colorBoton,
    }
  }, [campaign, comercio])

  const limpiarMensaje = () => {
    setMensaje('')
    setMensajeTipo('')
  }

  const validarRegistro = () => {
    if (!comercioId) {
      setMensaje('No se identificó el comercio del portal')
      setMensajeTipo('error')
      return false
    }

    if (!nombreCompleto.trim()) {
      setMensaje('Completá tu nombre y apellido')
      setMensajeTipo('error')
      return false
    }

    if (!dni.trim()) {
      setMensaje('Completá tu DNI')
      setMensajeTipo('error')
      return false
    }

    if (!email.trim()) {
      setMensaje('Completá tu email')
      setMensajeTipo('error')
      return false
    }

    if (!telefono.trim()) {
      setMensaje('Completá tu teléfono')
      setMensajeTipo('error')
      return false
    }

    if (!password.trim()) {
      setMensaje('Completá la contraseña')
      setMensajeTipo('error')
      return false
    }

    if (password.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres')
      setMensajeTipo('error')
      return false
    }

    if (password !== confirmPassword) {
      setMensaje('Las contraseñas no coinciden')
      setMensajeTipo('error')
      return false
    }

    return true
  }

  const handleLogin = async () => {
    limpiarMensaje()

    if (!comercioId) {
      setMensaje('No se identificó el comercio del portal')
      setMensajeTipo('error')
      return
    }

    if (!loginEmail.trim()) {
      setMensaje('Ingresá tu email')
      setMensajeTipo('error')
      return
    }

    if (!loginPassword.trim()) {
      setMensaje('Ingresá tu contraseña')
      setMensajeTipo('error')
      return
    }

    setLoading(true)

    try {
      const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })

      if (error || !authData.user) {
        setMensaje(error?.message || 'No se pudo iniciar sesión')
        setMensajeTipo('error')
        return
      }

      const { data: relacion, error: relacionError } = await supabaseClient
        .from('usuarios_comercios')
        .select('id')
        .eq('usuario_id', authData.user.id)
        .eq('comercio_id', comercioId)
        .maybeSingle()

      if (relacionError || !relacion) {
        await supabaseClient.auth.signOut()
        setMensaje('Este usuario no está registrado en este comercio.')
        setMensajeTipo('error')
        return
      }

      router.push(`/usuarios/${comercioId}/dashboard`)
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al iniciar sesión')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverPassword = async () => {
    limpiarMensaje()

    if (!recoverEmail.trim()) {
      setMensaje('Ingresá tu email')
      setMensajeTipo('error')
      return
    }

    if (!recoverPassword.trim()) {
      setMensaje('Ingresá la nueva contraseña')
      setMensajeTipo('error')
      return
    }

    if (recoverPassword.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres')
      setMensajeTipo('error')
      return
    }

    if (recoverPassword !== recoverConfirmPassword) {
      setMensaje('Las contraseñas no coinciden')
      setMensajeTipo('error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/usuarios/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoverEmail.trim().toLowerCase(),
          password: recoverPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setMensaje(data.error || 'No se pudo actualizar la contraseña')
        setMensajeTipo('error')
        return
      }

      setMensaje('Contraseña actualizada correctamente. Ya podés ingresar.')
      setMensajeTipo('ok')
      setLoginEmail(recoverEmail.trim().toLowerCase())
      setLoginPassword('')
      setRecoverEmail('')
      setRecoverPassword('')
      setRecoverConfirmPassword('')
      setTab('login')
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al recuperar la contraseña')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    limpiarMensaje()

    if (!validarRegistro()) return

    setLoading(true)

    try {
      const res = await fetch('/api/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: nombreCompleto.trim(),
          dni: dni.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          password,
          comercio_id: comercioId,
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        setMensaje(data.error || 'No se pudo crear la cuenta')
        setMensajeTipo('error')
        return
      }

      if (data.usuario_existente) {
        setMensaje(
          'Ya tenías una cuenta registrada. Te vinculamos a este comercio. Ingresá con tu email y contraseña habitual.'
        )
        setMensajeTipo('ok')

        setLoginEmail(email.trim())
        setLoginPassword('')
        setPassword('')
        setConfirmPassword('')
        setTab('login')

        return
      }

      const { error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (loginError) {
        setMensaje(
          'La cuenta fue creada, pero no se pudo iniciar sesión automáticamente. Probá ingresar manualmente.'
        )
        setMensajeTipo('error')
        setTab('login')
        setLoginEmail(email.trim())
        setLoginPassword('')
        return
      }

      router.push(`/usuarios/${comercioId}/dashboard`)
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al registrarte')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  if (loadingBranding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          Cargando portal...
        </div>
      </div>
    )
  }

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 sm:py-10"
      style={{ background: branding.colorFondo }}
    >
      <div className="mx-auto w-full max-w-xl">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-100 px-5 pb-6 pt-7 text-center sm:px-8 sm:pt-9">
            <div
              className="mx-auto mb-4 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold"
              style={{
                background: `${branding.colorPrimario}12`,
                color: branding.colorPrimario,
              }}
            >
              Programa de Beneficios
            </div>

            {branding.logo ? (
              <img
                src={branding.logo}
                alt={branding.titulo}
                className="mx-auto mb-4 max-h-24 w-auto max-w-[220px] object-contain"
              />
            ) : (
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black text-white"
                style={{ background: branding.colorBoton }}
              >
                {branding.titulo.slice(0, 2).toUpperCase()}
              </div>
            )}

            <h1 className="text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              {branding.titulo}
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
              {branding.descripcion}
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <TabButton
                active={tab === 'login'}
                label="Ingresar"
                onClick={() => {
                  limpiarMensaje()
                  setTab('login')
                }}
                color={branding.colorBoton}
              />

              <TabButton
                active={tab === 'register'}
                label="Registrarme"
                onClick={() => {
                  limpiarMensaje()
                  setTab('register')
                }}
                color={branding.colorBoton}
              />
            </div>

            {tab === 'login' && (
              <div>
                <div className="mb-5">
                  
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Ingresá con tu email y contraseña para consultar tus puntos y movimientos.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="tuemail@correo.com"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Ingresá tu contraseña"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-sm text-slate-500 transition hover:bg-slate-100"
                        aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showLoginPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="mt-1 h-12 w-full rounded-xl text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: branding.colorBoton }}
                  >
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      limpiarMensaje()
                      setRecoverEmail(loginEmail.trim())
                      setRecoverPassword('')
                      setRecoverConfirmPassword('')
                      setTab('recover')
                    }}
                    className="mx-auto mt-1 text-sm font-semibold text-blue-600 underline underline-offset-4"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            )}

            {tab === 'recover' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-950">
                    Recuperar contraseña
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Ingresá tu email y definí una nueva contraseña.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder="tuemail@correo.com"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoverPassword ? 'text' : 'password'}
                        value={recoverPassword}
                        onChange={(e) => setRecoverPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoverPassword(!showRecoverPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-sm text-slate-500 transition hover:bg-slate-100"
                        aria-label={showRecoverPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showRecoverPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoverConfirmPassword ? 'text' : 'password'}
                        value={recoverConfirmPassword}
                        onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                        placeholder="Repetí la nueva contraseña"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRecoverConfirmPassword(!showRecoverConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-sm text-slate-500 transition hover:bg-slate-100"
                        aria-label={
                          showRecoverConfirmPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                      >
                        {showRecoverConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRecoverPassword}
                    disabled={loading}
                    className="mt-1 h-12 w-full rounded-xl text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: branding.colorBoton }}
                  >
                    {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      limpiarMensaje()
                      setTab('login')
                    }}
                    className="mx-auto mt-1 text-sm font-semibold text-blue-600 underline underline-offset-4"
                  >
                    Volver al ingreso
                  </button>
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-950">
                    Crear cuenta
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Registrate para consultar tus puntos, canjes y movimientos.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Nombre y apellido
                    </label>
                    <input
                      type="text"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Juan Pérez"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      DNI
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="12345678"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="3870000000"
                      className={inputClassName}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tuemail@correo.com"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-sm text-slate-500 transition hover:bg-slate-100"
                        aria-label={
                          showRegisterPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                        }
                      >
                        {showRegisterPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRegisterConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repetí la contraseña"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterConfirmPassword(!showRegisterConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-sm text-slate-500 transition hover:bg-slate-100"
                        aria-label={
                          showRegisterConfirmPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                      >
                        {showRegisterConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleRegister}
                      disabled={loading}
                      className="mt-1 h-12 w-full rounded-xl text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ background: branding.colorBoton }}
                    >
                      {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mensaje && (
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  mensajeTipo === 'ok'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {mensaje}
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-slate-500">
          Programa de beneficios administrado por BENEFI
        </p>
      </div>
    </main>
  )
}

function TabButton({
  active,
  label,
  onClick,
  color,
}: {
  active: boolean
  label: string
  onClick: () => void
  color: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-xl text-sm font-extrabold transition"
      style={{
        background: active ? color : 'transparent',
        color: active ? '#ffffff' : '#334155',
        boxShadow: active ? '0 8px 18px rgba(15, 23, 42, 0.12)' : 'none',
      }}
    >
      {label}
    </button>
  )
}

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

function esColorClaro(color?: string) {
  if (!color || typeof color !== 'string') return true

  const hex = color.replace('#', '').trim()

  if (hex.length !== 6) return true

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  if ([r, g, b].some((v) => Number.isNaN(v))) return true

  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.7
}