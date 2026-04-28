'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ComercioSelector from '@/components/ComercioSelector'

type MenuItem = {
  href: string
  label: string
  description: string
}

type CampaignSettings = {
  id?: string
  slug: string
  nombre_campania: string
  portal_titulo: string
  portal_descripcion: string | null
  logo_comercio_url: string | null
  logo_benefi_url: string | null
  color_sidebar: string | null
  color_activo: string | null
  color_fondo: string | null
  powered_by_texto: string | null
  activa: boolean
}

type CampaignResponse = {
  ok?: boolean
  campaign?: CampaignSettings
  error?: string
}

const menu: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Resumen del comercio',
  },
  {
    href: '/',
    label: 'Terminal',
    description: 'Carga, canje y anulaciones',
  },
  {
    href: '/comercio/promociones',
    label: 'Promociones',
    description: 'Ver promociones activas del comercio',
  },
  {
    href: '/comercio/usuarios',
    label: 'Usuarios',
    description: 'Clientes vinculados al comercio',
  },
  {
    href: '/comercio/notificaciones',
    label: 'Notificaciones',
    description: 'Enviar mensajes a usuarios',
  },
  {
    href: '/comercio/movimientos',
    label: 'Movimientos',
    description: 'Historial del comercio',
  },
  {
    href: '/comercio/notificaciones/historial',
    label: 'Historial',
    description: 'Campañas enviadas y lecturas',
  },
]

const neutralSidebarColor = '#111827'
const neutralActiveColor = '#2563eb'
const neutralBackgroundColor = '#f3f4f6'

function isMenuItemActive(pathname: string | null, href: string) {
  if (!pathname) return false

  if (href === '/') return pathname === '/'

  if (href === '/comercio/notificaciones') {
    return pathname === '/comercio/notificaciones'
  }

  if (href === '/comercio/notificaciones/historial') {
    return pathname === '/comercio/notificaciones/historial'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function SidebarLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [campaign, setCampaign] = useState<CampaignSettings | null>(null)
  const [campaignLoading, setCampaignLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadCampaign() {
      try {
        setCampaignLoading(true)

        const comercioId =
          typeof window !== 'undefined'
            ? localStorage.getItem('comercio_id')
            : null

        if (!comercioId) {
          if (mounted) {
            setCampaign(null)
            setCampaignLoading(false)
          }
          return
        }

        const res = await fetch(
          `/api/campaign-by-comercio?comercio_id=${comercioId}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const json: CampaignResponse = await res.json()

        if (!res.ok || !json?.campaign) {
          if (mounted) setCampaign(null)
          return
        }

        if (mounted) {
          setCampaign(json.campaign)
        }
      } catch (error) {
        console.error('No se pudo cargar la configuración de campaña', error)
        if (mounted) setCampaign(null)
      } finally {
        if (mounted) setCampaignLoading(false)
      }
    }

    loadCampaign()

    return () => {
      mounted = false
    }
  }, [])

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('comercio_id')
      localStorage.removeItem('current_comercio_id')
    }

    router.push('/comercio/login')
  }

  const sidebarColor = campaign?.color_sidebar || neutralSidebarColor
  const activeColor = campaign?.color_activo || neutralActiveColor
  const fondoColor = campaign?.color_fondo || neutralBackgroundColor
  const logoComercio = campaign?.logo_comercio_url || ''
  const logoBenefi = campaign?.logo_benefi_url || '/benefi-logo-blanco.png'
  const portalTitulo = campaign?.portal_titulo || 'Portal del comercio'
  const portalDescripcion =
    campaign?.portal_descripcion ||
    'Acceso a terminal, dashboard y herramientas operativas.'
  const nombreCampania = campaign?.nombre_campania || 'Logo del comercio'
  const poweredBy = campaign?.powered_by_texto || 'Powered by BENEFI'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '310px 1fr',
        background: fondoColor,
      }}
    >
      <aside
        style={{
          background: sidebarColor,
          color: '#fff',
          padding: 22,
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            marginBottom: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            style={{
              height: 112,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              overflow: 'hidden',
              padding: 14,
            }}
          >
            {campaignLoading ? (
              <div
                style={{
                  width: '72%',
                  height: 42,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
            ) : logoComercio ? (
              <img
                src={logoComercio}
                alt={nombreCampania}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  color: '#9ca3af',
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Sin logo configurado
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              lineHeight: '25px',
              marginBottom: 5,
            }}
          >
            {campaignLoading ? 'Cargando portal...' : portalTitulo}
          </div>

          <div
            style={{
              fontSize: 14,
              color: '#9ca3af',
              lineHeight: '21px',
            }}
          >
            {campaignLoading ? 'Cargando branding del comercio...' : portalDescripcion}
          </div>
        </div>

        <div
          style={{
            marginBottom: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#6b7280',
              textTransform: 'uppercase',
              fontWeight: 800,
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Comercio activo
          </div>

          <ComercioSelector />
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#6b7280',
            textTransform: 'uppercase',
            fontWeight: 800,
            letterSpacing: 0.8,
            marginBottom: 12,
          }}
        >
          Menú
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {menu.map((item) => {
            const active = isMenuItemActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  padding: '15px 16px',
                  borderRadius: 16,
                  background: active ? activeColor : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '1px solid rgba(255,255,255,0.20)'
                    : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  boxShadow: active
                    ? '0 12px 28px rgba(37,99,235,0.35)'
                    : 'none',
                  transition: 'all 0.2s ease',
                  opacity: campaignLoading ? 0.92 : 1,
                }}
              >
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    marginBottom: 5,
                    lineHeight: '22px',
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    lineHeight: '19px',
                    color: active ? '#dbeafe' : '#9ca3af',
                  }}
                >
                  {item.description}
                </div>
              </Link>
            )
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              borderRadius: 14,
              padding: '13px 14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cerrar sesión
          </button>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              Tecnología
            </div>

            <div
              style={{
                height: 58,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                overflow: 'hidden',
                padding: 8,
              }}
            >
              <img
                src={logoBenefi}
                alt="BENEFI"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                lineHeight: '18px',
                textAlign: 'center',
              }}
            >
              {campaignLoading ? 'Cargando...' : poweredBy}
            </div>
          </div>
        </div>
      </aside>

      <main
        style={{
          minWidth: 0,
          background: fondoColor,
        }}
      >
        {children}
      </main>
    </div>
  )
}
