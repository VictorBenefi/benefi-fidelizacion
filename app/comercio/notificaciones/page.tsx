'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentComercio } from '@/lib/getCurrentComercio'

type Comercio = {
  id: string
  nombre_fantasia?: string | null
  razon_social?: string | null
  email?: string | null
}

type Usuario = {
  id: string
  nombre_completo?: string | null
  email?: string | null
  dni?: string | null
}

type ModoEnvio = 'uno' | 'grupo' | 'todos'

export default function ComercioNotificacionesPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const [comercio, setComercio] = useState<Comercio | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [modoEnvio, setModoEnvio] = useState<ModoEnvio>('uno')
  const [busqueda, setBusqueda] = useState('')
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tipo, setTipo] = useState('promo')

  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState('')
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>([])

  const [feedback, setFeedback] = useState('')
  const [feedbackTipo, setFeedbackTipo] = useState<'ok' | 'error' | ''>('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)

        const comercioActual = await getCurrentComercio()

        if (!comercioActual?.id) {
          setFeedback('No se pudo identificar el comercio logueado.')
          setFeedbackTipo('error')
          return
        }

        const res = await fetch('/api/comercio/notificaciones/contexto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comercio_id: comercioActual.id }),
        })

        const data = await res.json()

        if (!res.ok || !data.ok) {
          setFeedback(data?.error || 'No se pudo cargar el contexto del comercio.')
          setFeedbackTipo('error')
          return
        }

        setComercio(data.comercio || null)
        setUsuarios(data.usuarios || [])
      } catch (error) {
        console.error(error)
        setFeedback('Ocurrió un error al cargar la pantalla.')
        setFeedbackTipo('error')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [router])

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return usuarios

    return usuarios.filter((u) => {
      const nombre = (u.nombre_completo || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const dni = String(u.dni || '').toLowerCase()
      return nombre.includes(q) || email.includes(q) || dni.includes(q)
    })
  }, [usuarios, busqueda])

  const cantidadDestinatarios = useMemo(() => {
    if (modoEnvio === 'uno') return usuarioSeleccionadoId ? 1 : 0
    if (modoEnvio === 'grupo') return usuariosSeleccionados.length
    return usuarios.length
  }, [modoEnvio, usuarioSeleccionadoId, usuariosSeleccionados, usuarios.length])

  const nombreComercio =
    comercio?.nombre_fantasia || comercio?.razon_social || 'Comercio'

  const limpiarFeedback = () => {
    setFeedback('')
    setFeedbackTipo('')
  }

  const toggleUsuarioGrupo = (id: string) => {
    setUsuariosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const seleccionarTodosVisibles = () => {
    const ids = usuariosFiltrados.map((u) => u.id)
    setUsuariosSeleccionados((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const limpiarSeleccionGrupo = () => {
    setUsuariosSeleccionados([])
  }

  const validar = () => {
    if (!comercio?.id) {
      setFeedback('No se identificó el comercio.')
      setFeedbackTipo('error')
      return false
    }

    if (!titulo.trim()) {
      setFeedback('Completá el título de la notificación.')
      setFeedbackTipo('error')
      return false
    }

    if (!mensaje.trim()) {
      setFeedback('Completá el mensaje.')
      setFeedbackTipo('error')
      return false
    }

    if (modoEnvio === 'uno' && !usuarioSeleccionadoId) {
      setFeedback('Seleccioná un usuario.')
      setFeedbackTipo('error')
      return false
    }

    if (modoEnvio === 'grupo' && usuariosSeleccionados.length === 0) {
      setFeedback('Seleccioná al menos un usuario para el grupo.')
      setFeedbackTipo('error')
      return false
    }

    if (modoEnvio === 'todos' && usuarios.length === 0) {
      setFeedback('No hay usuarios cargados en este comercio.')
      setFeedbackTipo('error')
      return false
    }

    return true
  }

  const handleEnviar = async () => {
    limpiarFeedback()

    if (!validar()) return

    try {
      setEnviando(true)

      const payload =
        modoEnvio === 'uno'
          ? {
              comercio_id: comercio?.id,
              titulo: titulo.trim(),
              mensaje: mensaje.trim(),
              tipo,
              modo_envio: modoEnvio,
              usuario_ids: [usuarioSeleccionadoId],
            }
          : modoEnvio === 'grupo'
            ? {
                comercio_id: comercio?.id,
                titulo: titulo.trim(),
                mensaje: mensaje.trim(),
                tipo,
                modo_envio: modoEnvio,
                usuario_ids: usuariosSeleccionados,
              }
            : {
                comercio_id: comercio?.id,
                titulo: titulo.trim(),
                mensaje: mensaje.trim(),
                tipo,
                modo_envio: modoEnvio,
              }

      const res = await fetch('/api/comercio/notificaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log('RESPUESTA ENVIO NOTIFICACION:', data)

      if (!res.ok || !data.ok) {
        setFeedback(data?.error || `Error HTTP ${res.status}`)
        setFeedbackTipo('error')
        return
      }

      setFeedback(`Notificación enviada correctamente a ${data.cantidad_destinatarios} usuario(s).`)
      setFeedbackTipo('ok')

      setTitulo('')
      setMensaje('')
      setTipo('promo')
      setUsuarioSeleccionadoId('')
      setUsuariosSeleccionados([])
      setBusqueda('')
      setModoEnvio('uno')
    } catch (error: any) {
      console.error('ERROR ENVIO NOTIFICACION:', error)
      setFeedback(error?.message || 'Ocurrió un error al enviar la notificación.')
      setFeedbackTipo('error')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Cargando módulo de notificaciones...</div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={headerRowStyle}>
          <div>
            <div style={eyebrowStyle}>COMERCIO</div>
            <h1 style={titleStyle}>Notificaciones</h1>
            <p style={subtitleStyle}>
              Enviá mensajes a un usuario, a un grupo o a todos los usuarios de {nombreComercio}.
            </p>
          </div>

          <button
            onClick={() => router.push('/comercio')}
            style={secondaryButtonStyle}
          >
            Volver
          </button>
        </div>

        <div style={mainGridStyle}>
          <div style={cardStyle}>
            <SectionTitle
              title='1. Tipo de envío'
              subtitle='Elegí cómo querés distribuir la notificación.'
            />

            <div style={modeGridStyle}>
              <ModeCard
                active={modoEnvio === 'uno'}
                title='Usuario individual'
                text='Seleccionás un solo usuario.'
                onClick={() => setModoEnvio('uno')}
              />
              <ModeCard
                active={modoEnvio === 'grupo'}
                title='Grupo de usuarios'
                text='Seleccionás varios usuarios.'
                onClick={() => setModoEnvio('grupo')}
              />
              <ModeCard
                active={modoEnvio === 'todos'}
                title='Todos los usuarios'
                text='Se envía a toda la base del comercio.'
                onClick={() => setModoEnvio('todos')}
              />
            </div>

            <div style={{ height: 24 }} />

            <SectionTitle
              title='2. Contenido'
              subtitle='Definí el mensaje que recibirán los usuarios.'
            />

            <div style={formGridStyle}>
              <div style={{ gridColumn: '1 / span 2' }}>
                <Label>Título</Label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder='Ej: Promo especial esta semana'
                  style={inputStyle}
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
                  <option value='promo'>Promo</option>
                  <option value='info'>Info</option>
                  <option value='puntos'>Puntos</option>
                  <option value='recordatorio'>Recordatorio</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / span 2' }}>
                <Label>Mensaje</Label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder='Escribí el mensaje que va a recibir el usuario.'
                  style={textareaStyle}
                />
              </div>
            </div>

            <div style={{ height: 24 }} />

            <SectionTitle
              title='3. Destinatarios'
              subtitle='Seleccioná a quién se le va a enviar.'
            />

            {modoEnvio !== 'todos' && (
              <div style={{ marginBottom: 14 }}>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder='Buscar por nombre, email o DNI'
                  style={inputStyle}
                />
              </div>
            )}

            {modoEnvio === 'uno' && (
              <div style={usersListStyle}>
                {usuariosFiltrados.length === 0 && (
                  <EmptyText>No hay usuarios para mostrar.</EmptyText>
                )}

                {usuariosFiltrados.map((usuario) => (
                  <div
                    key={usuario.id}
                    style={{
                      ...userRowStyle,
                      borderColor:
                        usuarioSeleccionadoId === usuario.id ? '#93c5fd' : '#e5e7eb',
                      background:
                        usuarioSeleccionadoId === usuario.id ? '#eff6ff' : '#ffffff',
                    }}
                    onClick={() => setUsuarioSeleccionadoId(usuario.id)}
                  >
                    <div>
                      <div style={userNameStyle}>{usuario.nombre_completo || 'Sin nombre'}</div>
                      <div style={userMetaStyle}>
                        {usuario.email || 'Sin email'} {usuario.dni ? `• DNI ${usuario.dni}` : ''}
                      </div>
                    </div>

                    <div style={radioStyle(usuarioSeleccionadoId === usuario.id)}>
                      {usuarioSeleccionadoId === usuario.id ? 'Seleccionado' : 'Elegir'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {modoEnvio === 'grupo' && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <button onClick={seleccionarTodosVisibles} style={secondaryButtonStyle} type='button'>
                    Seleccionar visibles
                  </button>
                  <button onClick={limpiarSeleccionGrupo} style={secondaryButtonStyle} type='button'>
                    Limpiar selección
                  </button>
                  <div style={badgeStyle}>{usuariosSeleccionados.length} seleccionados</div>
                </div>

                <div style={usersListStyle}>
                  {usuariosFiltrados.length === 0 && (
                    <EmptyText>No hay usuarios para mostrar.</EmptyText>
                  )}

                  {usuariosFiltrados.map((usuario) => {
                    const activo = usuariosSeleccionados.includes(usuario.id)

                    return (
                      <div
                        key={usuario.id}
                        style={{
                          ...userRowStyle,
                          borderColor: activo ? '#93c5fd' : '#e5e7eb',
                          background: activo ? '#eff6ff' : '#ffffff',
                        }}
                        onClick={() => toggleUsuarioGrupo(usuario.id)}
                      >
                        <div>
                          <div style={userNameStyle}>{usuario.nombre_completo || 'Sin nombre'}</div>
                          <div style={userMetaStyle}>
                            {usuario.email || 'Sin email'} {usuario.dni ? `• DNI ${usuario.dni}` : ''}
                          </div>
                        </div>

                        <div style={checkboxStyle(activo)}>{activo ? '✓' : ''}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {modoEnvio === 'todos' && (
              <div style={infoBoxStyle}>
                Esta notificación se enviará a <strong>todos los usuarios</strong> vinculados a este
                comercio.
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <SectionTitle
              title='Resumen'
              subtitle='Verificá antes de enviar.'
            />

            <div style={summaryBoxStyle}>
              <SummaryRow label='Comercio' value={nombreComercio} />
              <SummaryRow
                label='Modo'
                value={
                  modoEnvio === 'uno'
                    ? 'Usuario individual'
                    : modoEnvio === 'grupo'
                      ? 'Grupo de usuarios'
                      : 'Todos los usuarios'
                }
              />
              <SummaryRow label='Tipo' value={tipo.toUpperCase()} />
              <SummaryRow label='Título' value={titulo || '-'} />
              <SummaryRow label='Destinatarios' value={String(cantidadDestinatarios)} />
            </div>

            {feedback && (
              <div
                style={{
                  ...feedbackStyle,
                  background: feedbackTipo === 'ok' ? '#ecfdf5' : '#fef2f2',
                  color: feedbackTipo === 'ok' ? '#166534' : '#991b1b',
                  borderColor: feedbackTipo === 'ok' ? '#86efac' : '#fecaca',
                }}
              >
                {feedback}
              </div>
            )}

            <button
              onClick={handleEnviar}
              disabled={enviando}
              style={{
                ...primaryButtonStyle,
                opacity: enviando ? 0.7 : 1,
                cursor: enviando ? 'not-allowed' : 'pointer',
              }}
            >
              {enviando ? 'Enviando...' : 'Enviar notificación'}
            </button>

            <div style={{ height: 20 }} />

            <SectionTitle
              title='Vista rápida'
              subtitle='Así llega al portal del usuario.'
            />

            <div style={previewCardStyle}>
              <div style={previewTypeStyle}>{tipo.toUpperCase()}</div>
              <div style={previewTitleStyle}>{titulo || 'Título de ejemplo'}</div>
              <div style={previewTextStyle}>
                {mensaje || 'El mensaje de la notificación aparecerá acá.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 16, color: '#64748b', lineHeight: '24px' }}>{subtitle}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 15,
        fontWeight: 700,
        color: '#334155',
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div style={{ color: '#64748b', fontSize: 16, padding: 8 }}>{children}</div>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div style={{ color: '#64748b', fontSize: 15 }}>{label}</div>
      <div style={{ color: '#0f172a', fontSize: 15, fontWeight: 700, textAlign: 'right' }}>{value}</div>
    </div>
  )
}

function ModeCard({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type='button'
      style={{
        textAlign: 'left',
        padding: 20,
        borderRadius: 18,
        border: active ? '1px solid #93c5fd' : '1px solid #e5e7eb',
        background: active ? '#eff6ff' : '#ffffff',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 15, color: '#64748b', lineHeight: '22px' }}>{text}</div>
    </button>
  )
}

function radioStyle(active: boolean): React.CSSProperties {
  return {
    minWidth: 100,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 800,
    color: active ? '#1d4ed8' : '#64748b',
    background: active ? '#dbeafe' : '#f8fafc',
    border: active ? '1px solid #93c5fd' : '1px solid #e5e7eb',
    borderRadius: 999,
    padding: '9px 12px',
  }
}

function checkboxStyle(active: boolean): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
    background: active ? '#2563eb' : '#ffffff',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 15,
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: 28,
  fontFamily: 'Arial, sans-serif',
}

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 26,
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#2563eb',
  marginBottom: 10,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 54,
  lineHeight: '58px',
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  margin: '12px 0 0 0',
  color: '#64748b',
  fontSize: 18,
  lineHeight: '28px',
  maxWidth: 820,
}

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.45fr 0.85fr',
  gap: 22,
  alignItems: 'start',
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 24,
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
  padding: 24,
}

const modeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 50,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  padding: '0 16px',
  fontSize: 16,
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 150,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  padding: 16,
  fontSize: 16,
  boxSizing: 'border-box',
  resize: 'vertical',
}

const usersListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxHeight: 420,
  overflowY: 'auto',
  paddingRight: 4,
}

const userRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  borderRadius: 16,
  padding: 15,
  cursor: 'pointer',
}

const userNameStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 4,
}

const userMetaStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#64748b',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 42,
  borderRadius: 999,
  border: '1px solid #dbeafe',
  background: '#eff6ff',
  color: '#2563eb',
  padding: '0 14px',
  fontSize: 14,
  fontWeight: 800,
}

const infoBoxStyle: React.CSSProperties = {
  border: '1px solid #dbeafe',
  background: '#eff6ff',
  color: '#1e3a8a',
  borderRadius: 16,
  padding: 18,
  fontSize: 16,
  lineHeight: '24px',
}

const summaryBoxStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  borderRadius: 18,
  padding: '6px 16px',
  marginBottom: 18,
}

const feedbackStyle: React.CSSProperties = {
  border: '1px solid',
  borderRadius: 16,
  padding: 14,
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 18,
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  height: 56,
  borderRadius: 14,
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 17,
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#334155',
  fontWeight: 700,
  padding: '0 16px',
  cursor: 'pointer',
  fontSize: 16,
}

const previewCardStyle: React.CSSProperties = {
  border: '1px solid #dbeafe',
  background: '#eff6ff',
  borderRadius: 18,
  padding: 18,
}

const previewTypeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  background: '#fffbeb',
  color: '#a16207',
  marginBottom: 10,
}

const previewTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 8,
}

const previewTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#475569',
  lineHeight: '24px',
}
