'use client'

import { useMemo, useState } from 'react'
import { usePortalCampaign } from '@/hooks/usePortalCampaign'

type MovimientoUsuario = {
  id: string
  fecha: string
  tipo: 'carga' | 'canje' | 'anulacion'
  detalle: string
  puntos: number
  estado?: 'activo' | 'anulado'
}

export default function UsuariosDashboardPage() {
  const campaign = usePortalCampaign('club-diez')

  const branding = useMemo(() => {
    return {
      titulo: campaign.portal_titulo || 'Club de Beneficios',
      descripcion:
        campaign.portal_descripcion ||
        'Consultá tus puntos y el detalle de tus movimientos.',
      logo: campaign.logo_comercio_url || '',
      colorPrimario: campaign.color_activo || '#2563eb',
      colorSecundario: campaign.color_sidebar || '#0f172a',
    }
  }, [campaign])

  // TODO:
  // Reemplazar estos datos mock por los datos reales del usuario logueado.
  const [usuario] = useState({
    nombre: 'Juan Pérez',
    email: 'juan@test.com',
    puntos: 170,
  })

  const [movimientos] = useState<MovimientoUsuario[]>([
    {
      id: '1',
      fecha: new Date().toISOString(),
      tipo: 'carga',
      detalle: 'Compra $10.000',
      puntos: 100,
      estado: 'activo',
    },
    {
      id: '2',
      fecha: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      tipo: 'canje',
      detalle: 'Canje en caja',
      puntos: 50,
      estado: 'activo',
    },
    {
      id: '3',
      fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      tipo: 'carga',
      detalle: 'Compra $7.000',
      puntos: 70,
      estado: 'activo',
    },
  ])

  const resumen = useMemo(() => {
    const generados = movimientos
      .filter((m) => m.tipo === 'carga')
      .reduce((acc, mov) => acc + Number(mov.puntos || 0), 0)

    const canjeados = movimientos
      .filter((m) => m.tipo === 'canje')
      .reduce((acc, mov) => acc + Number(mov.puntos || 0), 0)

    return {
      generados,
      canjeados,
      disponibles: usuario.puntos,
    }
  }, [movimientos, usuario.puntos])

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-AR')
    } catch {
      return fecha
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
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 28,
            padding: 28,
            boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
            border: '1px solid #edf2f7',
            marginBottom: 20,
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
                  color: branding.colorPrimario,
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 12,
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
                    width: 66,
                    height: 66,
                    borderRadius: 18,
                    background: branding.colorPrimario,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    fontWeight: 800,
                    marginBottom: 18,
                  }}
                >
                  B
                </div>
              )}

              <h1
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 38,
                  lineHeight: '42px',
                  color: branding.colorSecundario,
                }}
              >
                Hola, {usuario.nombre}
              </h1>

              <p
                style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: 15,
                  lineHeight: '22px',
                  maxWidth: 640,
                }}
              >
                {branding.descripcion}
              </p>
            </div>

            <button
              style={{
                height: 46,
                padding: '0 18px',
                borderRadius: 14,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: 28,
                padding: 28,
                boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
                border: '1px solid #edf2f7',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Tus puntos disponibles
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    color: '#166534',
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Saldo actual
                </div>
                <div
                  style={{
                    fontSize: 52,
                    lineHeight: '56px',
                    color: '#166534',
                    fontWeight: 800,
                  }}
                >
                  {resumen.disponibles} puntos
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))',
                  gap: 14,
                }}
              >
                <MiniResumen
                  titulo="Generados"
                  valor={`+${resumen.generados}`}
                  color="#166534"
                />
                <MiniResumen
                  titulo="Canjeados"
                  valor={`-${resumen.canjeados}`}
                  color="#991b1b"
                />
                <MiniResumen
                  titulo="Email"
                  valor={usuario.email}
                  color="#0f172a"
                  small
                />
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: 28,
                padding: 28,
                boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
                border: '1px solid #edf2f7',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  marginBottom: 18,
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
                    Historial
                  </div>
                  <h2 style={{ margin: 0, fontSize: 30, color: '#0f172a' }}>
                    Tus movimientos
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
                  {movimientos.length} registros
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {movimientos.map((mov) => (
                  <MovimientoCard
                    key={mov.id}
                    movimiento={mov}
                    formatearFecha={formatearFecha}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: 28,
                padding: 24,
                boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
                border: '1px solid #edf2f7',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Resumen
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 18,
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#1d4ed8',
                    marginBottom: 8,
                  }}
                >
                  Estás participando en {branding.titulo}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#475569',
                    lineHeight: '22px',
                  }}
                >
                  Desde este portal vas a poder revisar tus puntos y el detalle
                  de movimientos del programa.
                </div>
              </div>

              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#a16207',
                    marginBottom: 8,
                  }}
                >
                  Próximo paso sugerido
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: '#475569',
                    lineHeight: '22px',
                  }}
                >
                  En la siguiente etapa podés sumar promociones activas, perfil
                  del usuario y recuperación de contraseña.
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: 28,
                padding: 24,
                boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
                border: '1px solid #edf2f7',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Base técnica pendiente
              </div>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  color: '#475569',
                  fontSize: 14,
                  lineHeight: '24px',
                }}
              >
                <li>Conectar el usuario logueado real</li>
                <li>Traer saldo desde la tabla <strong>saldos</strong></li>
                <li>Traer movimientos desde <strong>movimientos_puntos</strong></li>
                <li>Filtrar por comercio o campaña correspondiente</li>
                <li>Implementar cierre de sesión real</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MovimientoCard({
  movimiento,
  formatearFecha,
}: {
  movimiento: MovimientoUsuario
  formatearFecha: (fecha: string) => string
}) {
  const visual =
    movimiento.tipo === 'carga'
      ? {
          badgeBg: '#dcfce7',
          badgeColor: '#166534',
          label: 'CARGA',
          puntosColor: '#166534',
          puntosTexto: `+${movimiento.puntos}`,
        }
      : movimiento.tipo === 'canje'
        ? {
            badgeBg: '#fee2e2',
            badgeColor: '#991b1b',
            label: 'CANJE',
            puntosColor: '#991b1b',
            puntosTexto: `-${movimiento.puntos}`,
          }
        : {
            badgeBg: '#dbeafe',
            badgeColor: '#1d4ed8',
            label: 'ANULACIÓN',
            puntosColor: '#1d4ed8',
            puntosTexto: `${movimiento.puntos > 0 ? '+' : ''}${movimiento.puntos}`,
          }

  return (
    <div
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
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              background: visual.badgeBg,
              color: visual.badgeColor,
              marginBottom: 10,
            }}
          >
            {visual.label}
          </span>

          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: 6,
            }}
          >
            {movimiento.detalle}
          </div>

          <div
            style={{
              fontSize: 13,
              color: '#64748b',
            }}
          >
            {formatearFecha(movimiento.fecha)}
          </div>
        </div>

        <div
          style={{
            fontSize: 28,
            lineHeight: '32px',
            fontWeight: 800,
            color: visual.puntosColor,
          }}
        >
          {visual.puntosTexto}
        </div>
      </div>
    </div>
  )
}

function MiniResumen({
  titulo,
  valor,
  color,
  small,
}: {
  titulo: string
  valor: string
  color: string
  small?: boolean
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#64748b',
          marginBottom: 8,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontSize: small ? 15 : 28,
          lineHeight: small ? '20px' : '32px',
          fontWeight: 800,
          color,
          wordBreak: 'break-word',
        }}
      >
        {valor}
      </div>
    </div>
  )
}
