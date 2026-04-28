'use client'

import { useMemo, useState } from 'react'
import { usePortalCampaign } from '@/hooks/usePortalCampaign'

type TabKey = 'login' | 'register' | 'recover'

export default function UsuariosPage() {
  const campaign = usePortalCampaign()

  const [tab, setTab] = useState<TabKey>('login')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [mensajeTipo, setMensajeTipo] = useState<'ok' | 'error' | ''>('')

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

  const branding = useMemo(() => {
    return {
      titulo: campaign.portal_titulo || 'Club de Beneficios',
      descripcion:
        campaign.portal_descripcion ||
        'Ingresá o registrate para consultar tus puntos y movimientos.',
      logo: campaign.logo_comercio_url || '',
      colorPrimario: campaign.color_activo || '#2563eb',
      colorSecundario: campaign.color_sidebar || '#0f172a',
    }
  }, [campaign])

  const limpiarMensaje = () => {
    setMensaje('')
    setMensajeTipo('')
  }

  const irARecover = () => {
    console.log('IR A RECUPERAR')
    limpiarMensaje()
    setRecoverEmail(loginEmail || '')
    setRecoverPassword('')
    setRecoverConfirmPassword('')
    setTab('recover')
  }

  async function handleRecoverPassword() {
    console.log('RECOVER CLICK')

    limpiarMensaje()

    if (!recoverEmail.trim()) {
      setMensaje('Ingresá tu email.')
      setMensajeTipo('error')
      return
    }

    if (!recoverPassword || !recoverConfirmPassword) {
      setMensaje('Completá la nueva contraseña y la confirmación.')
      setMensajeTipo('error')
      return
    }

    if (recoverPassword.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.')
      setMensajeTipo('error')
      return
    }

    if (recoverPassword !== recoverConfirmPassword) {
      setMensaje('Las contraseñas no coinciden.')
      setMensajeTipo('error')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/usuarios/recover-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recoverEmail.trim().toLowerCase(),
          password: recoverPassword,
        }),
      })

      const data = await res.json()

      console.log('RECOVER RESPONSE:', data)

      if (!res.ok || !data.ok) {
        setMensaje(data.error || 'No se pudo actualizar la contraseña.')
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
      setMensaje('Ocurrió un error al recuperar la contraseña.')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  const validarRegistro = () => {
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
      // TODO: conectar endpoint real de login.
      setMensaje('Base visual lista. Falta conectar el login al backend.')
      setMensajeTipo('ok')
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al iniciar sesión')
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
      // TODO: conectar endpoint real de registro.
      setMensaje('Base visual lista. Falta conectar el registro al backend.')
      setMensajeTipo('ok')
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al registrarte')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
        background:
          'linear-gradient(180deg, #f8fafc 0%, #eef4ff 45%, #ffffff 100%)',
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
                <div
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: 18,
                    background: branding.colorPrimario,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 24,
                  }}
                >
                  B
                </div>
              )}

              <h1
                style={{
                  margin: 0,
                  marginBottom: 10,
                  fontSize: 44,
                  lineHeight: '48px',
                  color: branding.colorSecundario,
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
              <BenefitBox title="Tus puntos" text="Consultá tu saldo actualizado en tiempo real." />
              <BenefitBox title="Tus movimientos" text="Revisá cargas, canjes y operaciones recientes." />
              <BenefitBox title="Tu comercio" text="Viví una experiencia con el branding del programa." />
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
                color={branding.colorPrimario}
              />

              <TabButton
                active={tab === 'register'}
                label="Registrarme"
                onClick={() => {
                  limpiarMensaje()
                  setTab('register')
                }}
                color={branding.colorPrimario}
              />
            </div>

            {tab === 'login' && (
              <div>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ margin: 0, marginBottom: 8, fontSize: 32, color: '#0f172a' }}>
                    Ingresar
                  </h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 15, lineHeight: '22px' }}>
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
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                      ...primaryButtonStyle(branding.colorPrimario),
                      marginTop: 6,
                      opacity: loading ? 0.7 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>

                  <button
                    type="button"
                    onClick={irARecover}
                    style={{
                      alignSelf: 'center',
                      marginTop: 2,
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            )}

            {tab === 'recover' && (
              <div>
                <h2 style={{ fontSize: 32, marginBottom: 8, color: '#0f172a' }}>
                  Recuperar contraseña
                </h2>

                <p style={{ color: '#64748b', marginBottom: 24, lineHeight: '22px' }}>
                  Ingresá tu email y definí una nueva contraseña.
                </p>

                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder="Ingresá tu email"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Nueva contraseña</label>
                    <input
                      type="password"
                      value={recoverPassword}
                      onChange={(e) => setRecoverPassword(e.target.value)}
                      placeholder="Ingresá nueva contraseña"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Confirmar contraseña</label>
                    <input
                      type="password"
                      value={recoverConfirmPassword}
                      onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                      placeholder="Confirmá la nueva contraseña"
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRecoverPassword}
                    disabled={loading}
                    style={{
                      ...primaryButtonStyle(branding.colorPrimario),
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
                  <h2 style={{ margin: 0, marginBottom: 8, fontSize: 32, color: '#0f172a' }}>
                    Crear cuenta
                  </h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 15, lineHeight: '22px' }}>
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
                  type="button"
                  onClick={handleRegister}
                  disabled={loading}
                  style={{
                    ...primaryButtonStyle(branding.colorPrimario),
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

            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: '1px solid #edf2f7',
                fontSize: 13,
                color: '#94a3b8',
                lineHeight: '20px',
              }}
            >
              Esta pantalla ya queda lista como base visual. El próximo paso es conectar
              el login y el registro a Supabase y luego armar <strong>/usuarios/dashboard</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BenefitBox({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: '#64748b', lineHeight: '21px' }}>
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
      type="button"
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
