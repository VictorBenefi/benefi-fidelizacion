'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePortalCampaign } from '@/hooks/usePortalCampaign'
import { getCurrentComercio } from '@/lib/getCurrentComercio'
import SidebarLayout from '@/components/SidebarLayout'

type DashboardData = {
  ok: boolean
  total_ventas: number
  puntos_generados: number
  puntos_canjeados: number
  clientes_unicos: number
  operaciones: number
  ticket_promedio: number
  anulaciones: number
  ultimas_operaciones: Array<{
    operacion_id: string
    fecha: string
    ticket: string
    importe: number
    puntos_generados: number
    puntos_canjeados: number
    resultado_neto: number
    estado: 'OPERACION' | 'ANULADA' | 'ANULACION'
    detalle: string
  }>
  error?: string
}

function DashboardContent() {
  const [comercioId, setComercioId] = useState('')
  const [comercioSlug, setComercioSlug] = useState('')
  const campaign = usePortalCampaign(comercioSlug)
  console.log('SLUG ENVIADO A CAMPAÑA', comercioSlug)
  console.log('CAMPAÑA CARGADA', campaign)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)

  useEffect(() => {
    async function loadComercio() {
      try {
        const comercio = await getCurrentComercio()
        console.log('COMERCIO OBTENIDO', comercio)
        console.log('SLUG OBTENIDO', (comercio as any)?.slug)

        if (comercio?.id) {
          setComercioId(comercio.id)
          setComercioSlug((comercio as any).slug || '')
        }
        else {
          console.error('No se encontró comercio para el usuario logueado')
        }
      } catch (error) {
        console.error('Error obteniendo comercio actual', error)
      }
    }

    loadComercio()
  }, [])

  const hoyIso = useMemo(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  }, [])

  useEffect(() => {
    if (fechaDesde || fechaHasta) return

    const hoy = new Date()
    const desde = new Date(hoy)
    desde.setDate(hoy.getDate() - 30)

    setFechaDesde(desde.toISOString().slice(0, 10))
    setFechaHasta(hoy.toISOString().slice(0, 10))
  }, [fechaDesde, fechaHasta])

  const aplicarRango = (tipo: 'hoy' | 'semana' | 'mes') => {
    const hoy = new Date()
    const hasta = hoy.toISOString().slice(0, 10)

    if (tipo === 'hoy') {
      setFechaDesde(hasta)
      setFechaHasta(hasta)
      return
    }

    if (tipo === 'semana') {
      const desde = new Date(hoy)
      desde.setDate(hoy.getDate() - 6)
      setFechaDesde(desde.toISOString().slice(0, 10))
      setFechaHasta(hasta)
      return
    }

    const desde = new Date(hoy)
    desde.setMonth(hoy.getMonth() - 1)
    setFechaDesde(desde.toISOString().slice(0, 10))
    setFechaHasta(hasta)
  }

  const cargarDashboard = async (modo: 'manual' | 'auto' = 'manual') => {
    if (!comercioId) {
      if (modo === 'manual') {
        alert('No se encontró el comercio del usuario logueado')
      }
      return
    }

    if (!fechaDesde || !fechaHasta) {
      if (modo === 'manual') {
        alert('Seleccioná desde y hasta')
      }
      return
    }

    if (fechaDesde > fechaHasta) {
      if (modo === 'manual') {
        alert('La fecha desde no puede ser mayor que la fecha hasta')
      }
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/dashboard/comercio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comercio_id: comercioId,
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
        }),
      })

      const json = await res.json()

      if (!json.ok) {
        if (modo === 'manual') {
          alert(json.error || 'Error al consultar dashboard')
        }
        setData(null)
        return
      }

      setData(json)
    } catch (error) {
      console.error(error)
      if (modo === 'manual') {
        alert('Error al consultar dashboard')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!comercioId || !fechaDesde || !fechaHasta || autoLoaded) return

    cargarDashboard('auto')
    setAutoLoaded(true)
  }, [comercioId, fechaDesde, fechaHasta, autoLoaded])

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-AR')
    } catch {
      return fecha
    }
  }

  const formatMoney = (value: number) => {
    return `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`
  }

  const colorEstado = (estado: string) => {
    if (estado === 'ANULADA') return { bg: '#fee2e2', color: '#991b1b', label: 'ANULADA' }
    if (estado === 'ANULACION') return { bg: '#dbeafe', color: '#1d4ed8', label: 'ANULACIÓN' }
    return { bg: '#dcfce7', color: '#166534', label: 'OPERACIÓN' }
  }

  const resumenTop = data
    ? [
        {
          title: 'Ventas',
          value: formatMoney(data.total_ventas),
          subtitle: 'Volumen operado en el período',
          tone: 'blue' as const,
        },
        {
          title: 'Puntos generados',
          value: data.puntos_generados,
          subtitle: 'Puntos acreditados a clientes',
          tone: 'green' as const,
        },
        {
          title: 'Puntos canjeados',
          value: data.puntos_canjeados,
          subtitle: 'Puntos utilizados por clientes',
          tone: 'amber' as const,
        },
      ]
    : []

  const resumenBottom = data
    ? [
        {
          title: 'Clientes únicos',
          value: data.clientes_unicos,
          subtitle: 'Clientes con movimientos',
        },
        {
          title: 'Operaciones',
          value: data.operaciones,
          subtitle: 'Operaciones activas',
        },
        {
          title: 'Ticket promedio',
          value: formatMoney(data.ticket_promedio),
          subtitle: 'Promedio por operación',
        },
        {
          title: 'Anulaciones',
          value: data.anulaciones,
          subtitle: 'Operaciones anuladas',
        },
      ]
    : []

  const insights = useMemo(() => {
    if (!data) return []

    const list: Array<{ title: string; text: string; tone: 'green' | 'amber' | 'blue' | 'red' }> = []

    if (data.puntos_generados > data.puntos_canjeados) {
      list.push({
        title: 'Buen ritmo de generación',
        text: 'Estás generando más puntos de los que se canjean en este período.',
        tone: 'green',
      })
    } else if (data.puntos_generados < data.puntos_canjeados) {
      list.push({
        title: 'Canjes altos',
        text: 'Los canjes superan a los puntos generados. Conviene revisar promociones o frecuencia de compra.',
        tone: 'amber',
      })
    } else {
      list.push({
        title: 'Equilibrio de puntos',
        text: 'La generación y el canje están equilibrados en este período.',
        tone: 'blue',
      })
    }

    if (data.ticket_promedio >= 5000) {
      list.push({
        title: 'Ticket promedio fuerte',
        text: 'Tu ticket promedio está en un nivel alto y aporta valor al programa.',
        tone: 'green',
      })
    } else if (data.ticket_promedio > 0) {
      list.push({
        title: 'Oportunidad de subir ticket',
        text: 'Podés usar promociones o acciones de fidelización para elevar el ticket promedio.',
        tone: 'blue',
      })
    }

    const ratioAnulaciones = data.operaciones > 0 ? (data.anulaciones / data.operaciones) * 100 : 0
    if (ratioAnulaciones >= 15) {
      list.push({
        title: 'Atención con anulaciones',
        text: 'El porcentaje de anulaciones es alto. Conviene revisar carga operativa o validaciones.',
        tone: 'red',
      })
    } else if (data.anulaciones > 0) {
      list.push({
        title: 'Anulaciones controladas',
        text: 'Hay anulaciones registradas, pero se mantienen en un nivel razonable.',
        tone: 'amber',
      })
    } else {
      list.push({
        title: 'Sin anulaciones',
        text: 'No registrás anulaciones en el período consultado. Muy buen indicador operativo.',
        tone: 'green',
      })
    }

    if (data.clientes_unicos >= 20) {
      list.push({
        title: 'Buen alcance de clientes',
        text: 'El programa está impactando a una base amplia de clientes únicos.',
        tone: 'blue',
      })
    } else if (data.clientes_unicos > 0) {
      list.push({
        title: 'Espacio para crecer',
        text: 'Todavía hay margen para que más clientes usen el programa.',
        tone: 'blue',
      })
    }

    return list.slice(0, 4)
  }, [data])

  return (
    <div
      style={{
        padding: 28,
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 24,
            padding: 26,
            boxShadow: '0 14px 38px rgba(0,0,0,0.06)',
            marginBottom: 22,
            border: '1px solid #eef2f7',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
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
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                Panel comercial
              </div>

              <h1
                style={{
                  fontSize: 38,
                  margin: 0,
                  marginBottom: 8,
                  color: '#0f172a',
                  lineHeight: '44px',
                }}
              >
                {campaign.portal_titulo || 'Dashboard del Comercio'}
              </h1>

              <p
                style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: 15,
                  lineHeight: '22px',
                  maxWidth: 760,
                }}
              >
                {campaign.portal_descripcion ||
                  'Consultá métricas clave, comportamiento de puntos y últimas operaciones del comercio'}
              </p>
            </div>

            <div
              style={{
                minWidth: 260,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 18,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Estado del comercio
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: comercioId ? '#166534' : '#991b1b',
                }}
              >
                {comercioId ? 'Comercio identificado' : 'Sin comercio cargado'}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#64748b',
                  wordBreak: 'break-all',
                }}
              >
                {comercioId || 'Esperando sesión activa'}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: 20,
            boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
            marginBottom: 22,
            border: '1px solid #eef2f7',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <QuickButton label="Hoy" onClick={() => aplicarRango('hoy')} />
            <QuickButton label="Últimos 7 días" onClick={() => aplicarRango('semana')} />
            <QuickButton label="Último mes" onClick={() => aplicarRango('mes')} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))',
              gap: 14,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={labelStyle}>Desde</label>
              <input
                type="date"
                value={fechaDesde}
                max={hoyIso}
                onChange={(e) => {
                  setFechaDesde(e.target.value)
                  setAutoLoaded(true)
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                max={hoyIso}
                onChange={(e) => {
                  setFechaHasta(e.target.value)
                  setAutoLoaded(true)
                }}
                style={inputStyle}
              />
            </div>

            <div
              style={{
                gridColumn: 'span 2',
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => cargarDashboard('manual')}
                style={{
                  height: 46,
                  padding: '0 24px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontWeight: 800,
                  boxShadow: '0 10px 24px rgba(37,99,235,0.25)',
                }}
              >
                {loading ? 'Cargando...' : 'Consultar'}
              </button>

              {(fechaDesde || fechaHasta || data) && (
                <button
                  onClick={() => {
                    const hoy = new Date()
                    const desde = new Date(hoy)
                    desde.setDate(hoy.getDate() - 30)

                    setFechaDesde(desde.toISOString().slice(0, 10))
                    setFechaHasta(hoy.toISOString().slice(0, 10))
                    setAutoLoaded(true)
                    setData(null)
                  }}
                  style={{
                    height: 46,
                    padding: '0 20px',
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #dbe2ea',
                    borderRadius: 14,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {!data && !loading && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              padding: 24,
              boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
              border: '1px solid #eef2f7',
              color: '#64748b',
            }}
          >
            Seleccioná un rango de fechas y consultá el dashboard para ver métricas y últimas operaciones.
          </div>
        )}

        {data && data.ok && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))',
                gap: 16,
                marginBottom: 18,
              }}
            >
              {resumenTop.map((card) => (
                <HeroCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  tone={card.tone}
                />
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              {resumenBottom.map((card) => (
                <StatCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                />
              ))}
            </div>

            {insights.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
                  marginBottom: 18,
                  border: '1px solid #eef2f7',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      Lectura inteligente
                    </div>
                    <h2 style={{ margin: 0, color: '#111827', fontSize: 28 }}>
                      Qué muestran tus números
                    </h2>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 999,
                      padding: '8px 12px',
                      fontWeight: 700,
                    }}
                  >
                    Resumen comercial
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))',
                    gap: 14,
                  }}
                >
                  {insights.map((item) => (
                    <InsightCard
                      key={item.title}
                      title={item.title}
                      text={item.text}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 18,
                boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
                marginBottom: 18,
                border: '1px solid #eef2f7',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 13,
                  color: '#475569',
                  lineHeight: '21px',
                }}
              >
                <strong>Cómo leer los estados:</strong>{' '}
                <span style={{ color: '#166534', fontWeight: 700 }}>OPERACIÓN</span> es una venta normal.{' '}
                <span style={{ color: '#991b1b', fontWeight: 700 }}>ANULADA</span> es la operación original que fue anulada.{' '}
                <span style={{ color: '#1d4ed8', fontWeight: 700 }}>ANULACIÓN</span> es el reverso generado por el sistema para devolver o descontar puntos.
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: 22,
                padding: 22,
                boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
                border: '1px solid #eef2f7',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Historial reciente
                  </div>
                  <h2 style={{ margin: 0, color: '#111827', fontSize: 28 }}>
                    Últimas operaciones
                  </h2>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 999,
                    padding: '8px 12px',
                    fontWeight: 700,
                  }}
                >
                  {data.ultimas_operaciones.length} registros
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 680,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {data.ultimas_operaciones.map((op) => {
                  const estado = colorEstado(op.estado)

                  return (
                    <div
                      key={op.operacion_id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 18,
                        padding: 16,
                        background: '#fafafa',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          alignItems: 'flex-start',
                          marginBottom: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: '#111827',
                              marginBottom: 8,
                            }}
                          >
                            Ticket: {op.ticket}
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              color: '#475569',
                              marginBottom: 8,
                            }}
                          >
                            Importe: <strong>{formatMoney(op.importe)}</strong> · Resultado:{' '}
                            <strong style={{ color: op.resultado_neto >= 0 ? '#166534' : '#991b1b' }}>
                              {op.resultado_neto >= 0 ? '+' : ''}{op.resultado_neto} pts
                            </strong>
                          </div>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '5px 12px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 800,
                              background: estado.bg,
                              color: estado.color,
                            }}
                          >
                            {estado.label}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            whiteSpace: 'nowrap',
                            fontWeight: 700,
                          }}
                        >
                          {formatearFecha(op.fecha)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))',
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <MiniStat label="Generados" value={`+${op.puntos_generados}`} color="#166534" />
                        <MiniStat label="Canjeados" value={`-${op.puntos_canjeados}`} color="#991b1b" />
                        <MiniStat
                          label="Resultado"
                          value={`${op.resultado_neto >= 0 ? '+' : ''}${op.resultado_neto}`}
                          color={op.resultado_neto >= 0 ? '#166534' : '#991b1b'}
                        />
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: '#475569',
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: 12,
                          lineHeight: '20px',
                        }}
                      >
                        <strong>Detalle:</strong> {op.detalle}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


export default function Dashboard() {
  return (
    <SidebarLayout>
      <DashboardContent />
    </SidebarLayout>
  )
}

function QuickButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 36,
        padding: '0 14px',
        borderRadius: 999,
        border: '1px solid #dbe2ea',
        background: '#ffffff',
        color: '#334155',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {label}
    </button>
  )
}

function HeroCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string
  value: string | number
  subtitle?: string
  tone: 'blue' | 'green' | 'amber'
}) {
  const styles = {
    blue: {
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      border: '#bfdbfe',
      title: '#1d4ed8',
      value: '#0f172a',
    },
    green: {
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)',
      border: '#bbf7d0',
      title: '#166534',
      value: '#0f172a',
    },
    amber: {
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '#fde68a',
      title: '#a16207',
      value: '#0f172a',
    },
  }[tone]

  return (
    <div
      style={{
        background: styles.bg,
        padding: 22,
        borderRadius: 22,
        boxShadow: '0 12px 28px rgba(0,0,0,0.05)',
        border: `1px solid ${styles.border}`,
      }}
    >
      <div style={{ fontSize: 13, color: styles.title, marginBottom: 10, fontWeight: 800 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: styles.value,
          marginBottom: 8,
          lineHeight: '48px',
        }}
      >
        {value}
      </div>
      {subtitle && <div style={{ fontSize: 13, color: '#64748b' }}>{subtitle}</div>}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        padding: 20,
        borderRadius: 18,
        boxShadow: '0 10px 28px rgba(0,0,0,0.05)',
        border: '1px solid #eef2f7',
      }}
    >
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 700 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 8,
          lineHeight: '38px',
        }}
      >
        {value}
      </div>
      {subtitle && <div style={{ fontSize: 12, color: '#94a3b8' }}>{subtitle}</div>}
    </div>
  )
}

function InsightCard({
  title,
  text,
  tone,
}: {
  title: string
  text: string
  tone: 'green' | 'amber' | 'blue' | 'red'
}) {
  const styles = {
    green: { bg: '#ecfdf5', border: '#bbf7d0', title: '#166534' },
    amber: { bg: '#fffbeb', border: '#fde68a', title: '#a16207' },
    blue: { bg: '#eff6ff', border: '#bfdbfe', title: '#1d4ed8' },
    red: { bg: '#fef2f2', border: '#fecaca', title: '#991b1b' },
  }[tone]

  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: styles.title, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: '22px' }}>
        {text}
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, color: color || '#0f172a', fontWeight: 800 }}>
        {value}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 14,
  border: '1px solid #d1d5db',
  padding: '0 12px',
  background: '#fff',
  fontSize: 14,
  boxSizing: 'border-box',
}
