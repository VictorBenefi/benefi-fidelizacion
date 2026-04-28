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
  const { data: authData, error } =
    await supabaseClient.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

  if (error || !authData.user) {
    setMensaje(error?.message || 'No se pudo iniciar sesión')
    setMensajeTipo('error')
    return
  }

  // 🔴 VALIDACIÓN CLAVE: verificar que el usuario pertenece al comercio
  const { data: relacion, error: relacionError } = await supabaseClient
    .from('usuarios_comercios')
    .select('id')
    .eq('usuario_id', authData.user.id)
    .eq('comercio_id', comercioId)
    .maybeSingle()

  if (relacionError || !relacion) {
    // cerramos sesión porque no corresponde a este comercio
    await supabaseClient.auth.signOut()

    setMensaje('Este usuario no está registrado en este comercio.')
    setMensajeTipo('error')
    return
  }

  // ✅ OK: pertenece al comercio
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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Cargando portal...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
        background: branding.colorFondo,
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: 22,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 28,
              padding: 36,
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              border: '1px solid #edf2f7',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 720,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: '#eff6ff',
                  color: branding.colorPrimario,
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 18,
                }}
              >
                Portal de usuarios
              </div>

              {branding.logo ? (
                <img
                  src={branding.logo}
                  alt={branding.titulo}
                  style={{
                    maxWidth: 280,
                    maxHeight: 100,
                    objectFit: 'contain',
                    marginBottom: 24,
                    display: 'block',
                  }}
                />
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: branding.colorPrimario,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    marginBottom: 20,
                  }}
                >
                  {branding.titulo}
                </p>
              )}

              <h1
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontSize: 44,
                  lineHeight: '48px',
                  color: '#0f172a',
                }}
              >
                {branding.titulo}
              </h1>

              <p
                style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: 16,
                  lineHeight: '25px',
                  maxWidth: 560,
                }}
              >
                {branding.descripcion}
              </p>

              
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
                gap: 14,
                marginTop: 28,
              }}
            >
              <BenefitBox
                title="Tus puntos"
                text="Consultá tu saldo actualizado en tiempo real."
              />
              <BenefitBox
                title="Tus movimientos"
                text="Revisá cargas, canjes y operaciones recientes."
              />
              <BenefitBox
                title="Tu comercio"
                text="Viví una experiencia con el branding del programa."
              />
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 28,
              padding: 30,
              boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              border: '1px solid #edf2f7',
              minHeight: 720,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 8,
                marginBottom: 22,
              }}
            >
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
                <div style={{ marginBottom: 22 }}>
                  <h2
                    style={{
                      margin: 0,
                      marginBottom: 8,
                      fontSize: 32,
                      color: '#0f172a',
                    }}
                  >
                    Ingresar
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: 15,
                      lineHeight: '22px',
                    }}
                  >
                    Accedé con tu email y contraseña para ver tus puntos y movimientos.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="tuemail@correo.com"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Contraseña</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Ingresá tu contraseña"
                      style={inputStyle}
                    />
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                      ...primaryButtonStyle(branding.colorBoton),
                      marginTop: 6,
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
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
                  style={{
                    alignSelf: 'center',
                    marginTop: 10,
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: 13,
                    textDecoration: 'underline',
                    cursor: 'pointer',          // 👈 clave
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.cursor = 'pointer')} // 👈 refuerzo
                >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            )}
            {tab === 'recover' && (
  <div>
    <div style={{ marginBottom: 22 }}>
      <h2
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 32,
          color: '#0f172a',
        }}
      >
        Recuperar contraseña
      </h2>
      <p
        style={{
          margin: 0,
          color: '#64748b',
          fontSize: 15,
          lineHeight: '22px',
        }}
      >
        Ingresá tu email y definí una nueva contraseña.
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={recoverEmail}
          onChange={(e) => setRecoverEmail(e.target.value)}
          placeholder="tuemail@correo.com"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Nueva contraseña</label>
        <input
          type="password"
          value={recoverPassword}
          onChange={(e) => setRecoverPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Confirmar contraseña</label>
        <input
          type="password"
          value={recoverConfirmPassword}
          onChange={(e) => setRecoverConfirmPassword(e.target.value)}
          placeholder="Repetí la nueva contraseña"
          style={inputStyle}
        />
      </div>

      <button
        type="button"
        onClick={handleRecoverPassword}
        disabled={loading}
        style={{
          ...primaryButtonStyle(branding.colorBoton),
          marginTop: 6,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
      </button>

      <button
        type="button"
        onClick={() => {
          limpiarMensaje()
          setTab('login')
        }}
        style={{
          alignSelf: 'center',
          marginTop: 8,
          background: 'transparent',
          border: 'none',
          color: '#2563eb',
          fontSize: 13,
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Volver al login
      </button>
    </div>
  </div>
)}

            {tab === 'register' && (
              <div>
                <div style={{ marginBottom: 22 }}>
                  <h2
                    style={{
                      margin: 0,
                      marginBottom: 8,
                      fontSize: 32,
                      color: '#0f172a',
                    }}
                  >
                    Crear cuenta
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: 15,
                      lineHeight: '22px',
                    }}
                  >
                    Registrate para poder consultar tus puntos y movimientos dentro del programa.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / span 2' }}>
                    <label style={labelStyle}>Nombre y apellido</label>
                    <input
                      type="text"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Juan Pérez"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>DNI</label>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="12345678"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Teléfono</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="3870000000"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / span 2' }}>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tuemail@correo.com"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Confirmar contraseña</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetí la contraseña"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={loading}
                  style={{
                    ...primaryButtonStyle(branding.colorBoton),
                    marginTop: 20,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </div>
            )}

            {mensaje && (
              <div
                style={{
                  marginTop: 20,
                  padding: '14px 16px',
                  borderRadius: 14,
                  fontWeight: 700,
                  background: mensajeTipo === 'ok' ? '#ecfdf5' : '#fef2f2',
                  color: mensajeTipo === 'ok' ? '#065f46' : '#991b1b',
                  border:
                    mensajeTipo === 'ok'
                      ? '1px solid #a7f3d0'
                      : '1px solid #fecaca',
                }}
              >
                {mensaje}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BenefitBox({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: '#64748b',
          lineHeight: '21px',
        }}
      >
        {text}
      </div>
    </div>
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
      onClick={onClick}
      style={{
        height: 48,
        borderRadius: 12,
        border: 'none',
        background: active ? color : 'transparent',
        color: active ? '#ffffff' : '#334155',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 14,
  border: '1px solid #d1d5db',
  padding: '0 14px',
  background: '#fff',
  fontSize: 15,
  boxSizing: 'border-box',
}

function primaryButtonStyle(color: string): React.CSSProperties {
  return {
    width: '100%',
    height: 50,
    borderRadius: 14,
    border: 'none',
    background: color,
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 15,
    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
  }
}

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
