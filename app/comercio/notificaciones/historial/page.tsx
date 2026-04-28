'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentComercio } from '@/lib/getCurrentComercio'

type HistorialItem = {
  notificacion_id: string
  titulo: string
  mensaje: string
  tipo: string
  activa: boolean
  created_at: string
  destinatarios: number
  leidas: number
  pendientes: number
}

export default function ComercioNotificacionesHistorialPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [comercioNombre, setComercioNombre] = useState('Comercio')
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        setFeedback('')

        const comercio = await getCurrentComercio()

        if (!comercio?.id) {
          setFeedback('No se pudo identificar el comercio logueado.')
          return
        }

        setComercioNombre(
          comercio.nombre_fantasia || comercio.razon_social || 'Comercio'
        )

        const res = await fetch('/api/comercio/notificaciones/historial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comercio_id: comercio.id }),
        })

        const data = await res.json()

        if (!res.ok || !data.ok) {
          setFeedback(data?.error || 'No se pudo cargar el historial.')
          return
        }

        setHistorial(data.historial || [])
      } catch (error) {
        console.error(error)
        setFeedback('Ocurrió un error al cargar el historial.')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  const historialFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    return historial.filter((item) => {
      const pasaBusqueda =
        !q ||
        item.titulo.toLowerCase().includes(q) ||
        item.mensaje.toLowerCase().includes(q) ||
        item.tipo.toLowerCase().includes(q)

      const pasaTipo =
        tipoFiltro === 'todos' || item.tipo.toLowerCase() === tipoFiltro.toLowerCase()

      return pasaBusqueda && pasaTipo
    })
  }, [historial, busqueda, tipoFiltro])

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={panelStyle}>Cargando historial de notificaciones...</div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>COMERCIO</div>
            <h1 style={titleStyle}>Historial de notificaciones</h1>
            <p style={subtitleStyle}>
              Revisá lo enviado desde {comercioNombre}, cuántos usuarios lo recibieron y cuántos lo leyeron.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/comercio/notificaciones')}
              style={secondaryButtonStyle}
            >
              Nueva notificación
            </button>
            <button
              onClick={() => router.push('/comercio')}
              style={secondaryButtonStyle}
            >
              Volver
            </button>
          </div>
        </div>

        <div style={filtersCardStyle}>
          <div style={filtersGridStyle}>
            <div>
              <label style={labelStyle}>Buscar</label>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder='Título, mensaje o tipo'
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tipo</label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                style={inputStyle}
              >
                <option value='todos'>Todos</option>
                <option value='promo'>Promo</option>
                <option value='info'>Info</option>
                <option value='puntos'>Puntos</option>
                <option value='recordatorio'>Recordatorio</option>
              </select>
            </div>
          </div>
        </div>

        {feedback && <div style={errorStyle}>{feedback}</div>}

        <div style={summaryGridStyle}>
          <SummaryCard title='Campañas' value={String(historial.length)} subtitle='Total enviadas' />
          <SummaryCard
            title='Destinatarios'
            value={String(historial.reduce((acc, item) => acc + item.destinatarios, 0))}
            subtitle='Total alcanzados'
          />
          <SummaryCard
            title='Leídas'
            value={String(historial.reduce((acc, item) => acc + item.leidas, 0))}
            subtitle='Lecturas acumuladas'
          />
          <SummaryCard
            title='Pendientes'
            value={String(historial.reduce((acc, item) => acc + item.pendientes, 0))}
            subtitle='Aún sin leer'
          />
        </div>

        <div style={panelStyle}>
          <div style={tableHeaderStyle}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
              Historial
            </div>
            <div style={badgeStyle}>{historialFiltrado.length} visibles</div>
          </div>

          {historialFiltrado.length === 0 ? (
            <div style={emptyStyle}>No hay notificaciones para mostrar.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {historialFiltrado.map((item) => (
                <div key={item.notificacion_id} style={rowCardStyle}>
                  <div style={rowTopStyle}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={typeBadgeStyle(item.tipo)}>{item.tipo.toUpperCase()}</div>
                      <div style={rowTitleStyle}>{item.titulo}</div>
                      <div style={rowTextStyle}>{item.mensaje}</div>
                      <div style={rowMetaStyle}>
                        Enviada el {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={metricsGridStyle}>
                      <MetricBlock label='Destinatarios' value={item.destinatarios} />
                      <MetricBlock label='Leídas' value={item.leidas} />
                      <MetricBlock label='Pendientes' value={item.pendientes} />
                      <MetricBlock label='Estado' value={item.activa ? 'Activa' : 'Inactiva'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 34, lineHeight: '38px', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{subtitle}</div>
    </div>
  )
}

function MetricBlock({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div style={metricBlockStyle}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</div>
    </div>
  )
}

function typeBadgeStyle(tipo: string): React.CSSProperties {
  const t = (tipo || '').toLowerCase()

  if (t === 'promo') return badgeBase('#fffbeb', '#a16207')
  if (t === 'puntos') return badgeBase('#ecfdf5', '#166534')
  if (t === 'recordatorio') return badgeBase('#eef2ff', '#4338ca')
  return badgeBase('#eff6ff', '#1d4ed8')
}

function badgeBase(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: 999,
    background: bg,
    color,
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 10,
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: 24,
  fontFamily: 'Arial, sans-serif',
}

const panelStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 22,
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
  padding: 20,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 14,
  flexWrap: 'wrap',
  marginBottom: 22,
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#2563eb',
  marginBottom: 8,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 40,
  lineHeight: '44px',
  color: '#0f172a',
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0 0',
  color: '#64748b',
  fontSize: 16,
  lineHeight: '24px',
  maxWidth: 780,
}

const filtersCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 22,
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
  padding: 20,
  marginBottom: 18,
}

const filtersGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.3fr 0.7fr',
  gap: 14,
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
  height: 46,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  padding: '0 14px',
  fontSize: 15,
  boxSizing: 'border-box',
}

const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 16,
  padding: 14,
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 18,
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 14,
  marginBottom: 18,
}

const summaryCardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 20,
  border: '1px solid #e5e7eb',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
  padding: 18,
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 18,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 40,
  borderRadius: 999,
  border: '1px solid #dbeafe',
  background: '#eff6ff',
  color: '#2563eb',
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 800,
}

const emptyStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 15,
  padding: '8px 4px',
}

const rowCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  background: '#ffffff',
  padding: 18,
}

const rowTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap',
}

const rowTitleStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: '26px',
  fontWeight: 800,
  color: '#0f172a',
  marginBottom: 8,
}

const rowTextStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: '22px',
  color: '#475569',
  marginBottom: 8,
}

const rowMetaStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
}

const metricsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
  gap: 10,
  minWidth: 280,
}

const metricBlockStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  background: '#f8fafc',
  padding: 12,
}

const secondaryButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#334155',
  fontWeight: 700,
  padding: '0 16px',
  cursor: 'pointer',
}
