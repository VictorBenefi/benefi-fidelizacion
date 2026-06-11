'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

type NotificacionRelacion = {
  id: string
  usuario_id?: string
  notificacion_id?: string
  leida: boolean
  created_at?: string
  read_at?: string | null
  notificacion?: {
    id: string
    titulo: string
    mensaje: string
    tipo: string
    activa: boolean
    created_at?: string
  } | null
}

export default function DashboardUsuario() {
  const params = useParams()
  const router = useRouter()
  const comercioId = params?.comercioId as string

  const panelRef = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [marcandoId, setMarcandoId] = useState<string | null>(null)
  const [panelNotificacionesAbierto, setPanelNotificacionesAbierto] = useState(false)

  const [usuario, setUsuario] = useState<any>(null)
  const [comercio, setComercio] = useState<any>(null)
  const [campaign, setCampaign] = useState<any>(null)
  const [saldo, setSaldo] = useState(0)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [notificaciones, setNotificaciones] = useState<NotificacionRelacion[]>([])
  const [beneficios, setBeneficios] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)

        const {
          data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
          router.push(`/usuarios/${comercioId}`)
          return
        }
        const resBeneficios = await fetch("/api/promociones/listar", {
          method: "POST",
          body: JSON.stringify({ comercio_id: comercioId }),
        });

        const dataBeneficios = await resBeneficios.json();

        if (dataBeneficios?.ok) {
          setBeneficios(dataBeneficios.promociones || []);
        }

        const { data: usuarioData } = await supabaseClient
          .from('usuarios')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()

        if (!usuarioData) {
          router.push(`/usuarios/${comercioId}`)
          return
        }

        const { data: relacion, error: relacionError } = await supabaseClient
          .from('usuarios_comercios')
          .select('id')
          .eq('usuario_id', usuarioData.id)
          .eq('comercio_id', comercioId)
          .maybeSingle()

        if (relacionError || !relacion) {
          await supabaseClient.auth.signOut()
          router.push(`/usuarios/${comercioId}`)
          return
        }

        setUsuario(usuarioData)

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

        const { data: movimientosSaldo } = await supabaseClient
          .from('movimientos_puntos')
          .select('tipo, puntos, estado')
          .eq('usuario_id', usuarioData.id)
          .eq('comercio_id', comercioId)

        const saldoCalculado = (movimientosSaldo || [])
          .filter((m: any) => m.estado !== 'anulado')
          .reduce((acc: number, m: any) => {
            const puntos = Number(m.puntos || 0)

            if (m.tipo === 'carga') return acc + puntos
            if (m.tipo === 'canje') return acc - puntos
            if (m.tipo === 'reversion') return acc + puntos

            return acc
          }, 0)

        setSaldo(saldoCalculado)

        const { data: movimientosData } = await supabaseClient
          .from('movimientos_puntos')
          .select('*')
          .eq('usuario_id', usuarioData.id)
          .eq('comercio_id', comercioId)
          .order('created_at', { ascending: false })
          .limit(10)

        setMovimientos(movimientosData || [])

        const { data: notificacionesUsuario, error: errorUN } = await supabaseClient
          .from('usuarios_notificaciones')
          .select(`
            id,
            usuario_id,
            notificacion_id,
            leida,
            created_at,
            read_at,
            notificacion:notificaciones (
              id,
              titulo,
              mensaje,
              tipo,
              activa,
              created_at
            )
          `)
          .eq('usuario_id', usuarioData.id)
          .order('created_at', { ascending: false })

       if (errorUN) {
          console.error('Error cargando notificaciones:', errorUN)
          setNotificaciones([])
        } else {
          const notificacionesNormalizadas = (notificacionesUsuario || []).map((item: any) => ({
            ...item,
            notificacion: Array.isArray(item.notificacion)
              ? item.notificacion[0] || null
              : item.notificacion || null,
          }))

          setNotificaciones(notificacionesNormalizadas as NotificacionRelacion[])
        }
      } catch (error) {
        console.error(error)
        router.push(`/usuarios/${comercioId}`)
      } finally {
        setLoading(false)
      }
    }

    if (comercioId) {
      cargarDatos()
    }
  }, [comercioId, router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setPanelNotificacionesAbierto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const branding = useMemo(() => {
    const nombre =
      campaign?.portal_titulo ||
      comercio?.nombre_fantasia ||
      comercio?.razon_social ||
      'Programa de beneficios'

    return {
      nombrePrograma: nombre,
      descripcion:
        campaign?.portal_descripcion ||
        'Consultá tus puntos, movimientos y notificaciones desde tu cuenta.',
      logoComercio:
        campaign?.logo_comercio_url ||
        comercio?.logo_url ||
        '',
      colorActivo: campaign?.color_activo || '#2563eb',
      colorFondo: campaign?.color_fondo || '#f3f4f6',
    }
  }, [campaign, comercio])

  const notificacionesPendientes = notificaciones.filter((n) => !n.leida)
  const notificacionesVisibles = notificaciones.slice(0, 3)
  const ultimosMovimientos = movimientos.slice(0, 6)

  const marcarLeida = async (item: NotificacionRelacion) => {
    if (item.leida || marcandoId) return

    try {
      setMarcandoId(item.id)

      const res = await fetch('/api/usuarios/notificaciones/marcar-leida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        id: item.id,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        console.error('No se pudo marcar leída:', data?.error)
        return
      }

      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? { ...n, leida: true, read_at: new Date().toISOString() }
            : n
        )
      )
    } catch (error) {
      console.error(error)
    } finally {
      setMarcandoId(null)
    }
  }

  const cerrarSesion = async () => {
    try {
      setCerrandoSesion(true)
      await supabaseClient.auth.signOut()
      router.push(`/usuarios/${comercioId}`)
    } catch (error) {
      console.error(error)
      setCerrandoSesion(false)
    }
  }

  if (loading) {
    return (
      <div style={{ ...pageStyle, background: '#f8fafc' }}>
        <div style={loadingCardStyle}>Cargando tu cuenta...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        ...pageStyle,
        background: branding.colorFondo,
      }}
    >
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div style={{ minWidth: 0 }}>
            {branding.logoComercio ? (
              <img
                src={branding.logoComercio}
                alt={branding.nombrePrograma}
                style={logoStyle}
              />
            ) : (
              <div style={logoFallbackStyle}>
                {branding.nombrePrograma?.charAt(0) || 'B'}
              </div>
            )}

            <div style={eyebrowStyle}>Hola</div>

            <h1 style={titleStyle}>
              {usuario?.nombre_completo || 'Usuario'}
            </h1>

            <p style={subtitleStyle}>
              {branding.descripcion}
            </p>
          </div>

          <div style={headerActionsStyle} ref={panelRef}>
            <button
              type="button"
              onClick={() => setPanelNotificacionesAbierto((v) => !v)}
              style={bellButtonStyle}
              aria-label="Notificaciones"
            >
              🔔
              {notificacionesPendientes.length > 0 && (
                <span style={bellBadgeStyle}>
                  {notificacionesPendientes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={cerrarSesion}
              disabled={cerrandoSesion}
              style={logoutButtonStyle}
            >
              {cerrandoSesion ? 'Cerrando...' : 'Cerrar sesión'}
            </button>

            {panelNotificacionesAbierto && (
              <div style={notificationPanelStyle}>
                <div style={notificationPanelHeaderStyle}>
                  <strong>Notificaciones</strong>
                  <span style={pillStyle}>
                    {notificacionesPendientes.length === 0
                      ? 'Sin pendientes'
                      : `${notificacionesPendientes.length} nuevas`}
                  </span>
                </div>

                {notificaciones.length === 0 ? (
                  <div style={emptyMiniStyle}>No tenés notificaciones.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {notificaciones.slice(0, 5).map((item) => {
                      const notif = item.notificacion
                      if (!notif) return null

                     return (
  <button
    key={item.id}
    type="button"
    onClick={() => marcarLeida(item)}
    style={{
      ...notificationMiniStyle,
      background: item.leida ? '#ffffff' : '#eff6ff',
      borderColor: item.leida ? '#e5e7eb' : '#bfdbfe',
      textAlign: 'left',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <strong>{notif.titulo}</strong>

      {!item.leida && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#2563eb',
          }}
        >
          Marcar leída
        </span>
      )}
    </div>

    <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
      {notif.mensaje}
    </div>
  </button>
)
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <section
          style={{
            ...heroStyle,
            background: branding.colorActivo,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, opacity: 0.92 }}>
            Tenés disponibles
          </div>

          <div style={heroPointsStyle}>
            {saldo} pts
          </div>

          <div style={{ fontSize: 14, opacity: 0.9 }}>
            = ${saldo} en beneficios
          </div>

          <div style={{ fontSize: 15, opacity: 0.92 }}>
            Usalos en {branding.nombrePrograma}
          </div>
        </section>
        {beneficios.length > 0 && (
          <div className="mt-6">
            <h3
              id="beneficios-disponibles"
              className="text-lg font-semibold text-slate-800 mb-3"
            >
              🎁 Beneficios disponibles hoy
            </h3>

            <div className="grid gap-3">
              {beneficios.map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-white"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {b.nombre}
                    </div>
                    <div className="text-sm text-slate-500">
                      {b.tipo === "porcentaje"
                        ? `${b.valor}% de descuento`
                        : b.tipo === "tramo"
                        ? `+${b.puntos_por_tramo} pts cada $${b.cada_monto}`
                        : `${b.valor} pts`}
                    </div>
                  </div>

                  <button className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">
                    Usar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <section style={cardsGridStyle}>
          <InfoCard
            title="Saldo disponible"
            value={`${saldo} pts`}
            subtitle="Saldo actual disponible"
          />

          <InfoCard
            title="Movimientos recientes"
            value={String(movimientos.filter((m) => m.estado !== 'anulado').length)}
            subtitle="Registros activos"
          />
        </section>

        <section style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Notificaciones</h2>
            <span style={pillStyle}>
              {notificacionesPendientes.length === 0
                ? 'Sin pendientes'
                : `${notificacionesPendientes.length} nuevas`}
            </span>
          </div>

          {notificacionesVisibles.length === 0 ? (
            <div style={emptyStateStyle}>No tenés notificaciones para mostrar.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notificacionesVisibles.map((item) => {
                const notif = item.notificacion
                if (!notif) return null

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => marcarLeida(item)}
                    style={{
                      ...notificationCardStyle,
                      background: item.leida ? '#f8fafc' : '#eff6ff',
                      opacity: item.leida ? 0.86 : 1,
                    }}
                  >
                    <div style={notificationTopStyle}>
                      <span style={typeBadgeStyle}>{notif.tipo?.toUpperCase() || 'INFO'}</span>
                      <span style={readBadgeStyle}>
                        {item.leida ? 'Leída' : 'Nueva'}
                      </span>
                    </div>

                    <div style={notificationTitleStyle}>{notif.titulo}</div>
                    <div style={notificationTextStyle}>{notif.mensaje}</div>
                    {!item.leida && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#2563eb',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            marcarLeida(item)
                            document.getElementById('beneficios-disponibles')?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            })
                          }}
                                                  >
                          Ver beneficio →
                        </button>
                      </div>
                    )}

                    <div style={notificationDateStyle}>
                      {notif.created_at
                        ? new Date(notif.created_at).toLocaleString('es-AR')
                        : ''}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Tus últimos movimientos</h2>
            <span style={pillStyle}>{ultimosMovimientos.length} visibles</span>
          </div>

          {ultimosMovimientos.length === 0 ? (
            <div style={emptyStateStyle}>Aún no tenés movimientos.</div>
          ) : (
            <div style={movementListStyle}>
              {ultimosMovimientos.map((mov) => {
                const esCarga = mov.tipo === 'carga'
                const esCanje = mov.tipo === 'canje'
                const esAnulado = mov.estado === 'anulado'

                const titulo = esCarga
                  ? 'Ganaste puntos'
                  : esCanje
                  ? 'Usaste puntos'
                  : 'Movimiento'

                const icono = esCarga ? '⬆️' : esCanje ? '⬇️' : '🔄'
                const color = esCarga ? '#16a34a' : esCanje ? '#dc2626' : '#2563eb'

                return (
                  <div
                    key={mov.id}
                    style={{
                      ...movementItemStyle,
                      opacity: esAnulado ? 0.55 : 1,
                      background: esAnulado ? '#f8fafc' : '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          background: esCarga ? '#dcfce7' : esCanje ? '#fee2e2' : '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          flexShrink: 0,
                        }}
                      >
                        {icono}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={movementTitleStyle}>
                          {titulo}
                          {esAnulado && (
                            <span style={anuladoBadgeStyle}>ANULADO</span>
                          )}
                        </div>

                        <div style={movementDateStyle}>
                          {mov.created_at
                            ? new Date(mov.created_at).toLocaleString('es-AR')
                            : ''}
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: '#64748b',
                            fontSize: 12,
                            lineHeight: '18px',
                          }}
                        >
                          {mov.nro_ticket ? `Ticket: ${mov.nro_ticket}` : 'Operación del programa'}
                          {mov.monto_compra ? ` · Compra: $${Number(mov.monto_compra).toLocaleString('es-AR')}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          ...movementPointsStyle,
                          color,
                        }}
                      >
                        {esCarga ? '+' : esCanje ? '-' : ''}
                        {Number(mov.puntos || 0)}
                      </div>

                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        {Number(mov.puntos || 0) === 1 ? 'punto' : 'puntos'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function InfoCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div style={infoCardStyle}>
      <div style={infoTitleStyle}>{title}</div>
      <div style={infoValueStyle}>{value}</div>
      <div style={infoSubtitleStyle}>{subtitle}</div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  fontFamily: 'Arial, sans-serif',
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 980,
  margin: '0 auto',
  padding: '22px 16px 44px',
  boxSizing: 'border-box',
}

const loadingCardStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: '80px auto',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 20,
  padding: 24,
  color: '#0f172a',
  textAlign: 'center',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 22,
}

const logoStyle: React.CSSProperties = {
  maxWidth: 170,
  maxHeight: 58,
  objectFit: 'contain',
  display: 'block',
  marginBottom: 14,
}

const logoFallbackStyle: React.CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 16,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  fontWeight: 900,
  color: '#0f172a',
  marginBottom: 14,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  marginBottom: 4,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 'clamp(30px, 5vw, 42px)',
  lineHeight: 1.05,
  fontWeight: 500,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0 0',
  color: '#475569',
  fontSize: 15,
  lineHeight: '22px',
}

const headerActionsStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const bellButtonStyle: React.CSSProperties = {
  position: 'relative',
  width: 42,
  height: 42,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  cursor: 'pointer',
  fontSize: 18,
}

const bellBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -7,
  right: -7,
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  background: '#dc2626',
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5px',
}

const logoutButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  padding: '0 16px',
  cursor: 'pointer',
  fontWeight: 700,
  color: '#0f172a',
}

const notificationPanelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 92,
  left: 16,
  right: 16,
  zIndex: 50,
  width: 'auto',
  maxWidth: 520,
  margin: '0 auto',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
  padding: 14,
  boxSizing: 'border-box',
}

const notificationPanelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginBottom: 12,
  color: '#0f172a',
}

const notificationMiniStyle: React.CSSProperties = {
  textAlign: 'left',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 12,
  cursor: 'pointer',
}

const heroStyle: React.CSSProperties = {
  color: '#ffffff',
  borderRadius: 22,
  padding: 'clamp(22px, 4vw, 32px)',
  marginBottom: 18,
  boxShadow: '0 20px 50px rgba(37, 99, 235, 0.18)',
}

const heroPointsStyle: React.CSSProperties = {
  fontSize: 'clamp(42px, 9vw, 68px)',
  lineHeight: 1,
  fontWeight: 900,
  margin: '12px 0 8px',
}

const cardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  marginBottom: 18,
}

const infoCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.04)',
}

const infoTitleStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 8,
}

const infoValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 30,
  lineHeight: '34px',
  fontWeight: 900,
}

const infoSubtitleStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginTop: 8,
}

const sectionCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 22,
  padding: 'clamp(16px, 3vw, 22px)',
  marginBottom: 18,
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.04)',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 'clamp(22px, 4vw, 30px)',
  lineHeight: 1.1,
  fontWeight: 500,
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid #dbeafe',
  background: '#f8fafc',
  color: '#475569',
  borderRadius: 999,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 800,
}

const emptyStateStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 15,
  padding: 14,
  borderRadius: 14,
  background: '#f8fafc',
}

const emptyMiniStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  padding: 12,
  borderRadius: 12,
  background: '#f8fafc',
}

const notificationCardStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 16,
  cursor: 'pointer',
}

const notificationTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10,
}

const typeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  padding: '5px 10px',
  background: '#fffbeb',
  color: '#a16207',
  fontSize: 12,
  fontWeight: 900,
}

const readBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  padding: '5px 10px',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
}

const notificationTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 16,
  fontWeight: 900,
  marginBottom: 6,
}

const notificationTextStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 14,
  lineHeight: '21px',
  marginBottom: 10,
}

const notificationDateStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
}

const movementListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxHeight: 520,
  overflowY: 'auto',
  paddingRight: 2,
}

const movementItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 14,
  background: '#ffffff',
}

const movementTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const movementDateStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  marginTop: 5,
}

const movementPointsStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  whiteSpace: 'nowrap',
}

const anuladoBadgeStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#991b1b',
  padding: '3px 7px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
}
