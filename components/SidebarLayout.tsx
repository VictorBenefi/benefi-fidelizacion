"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import ComercioSelector from "@/components/ComercioSelector";

type MenuItem = {
  href: string;
  label: string;
  description: string;
};

type CampaignSettings = {
  id?: string;
  slug: string;
  nombre_campania: string;
  portal_titulo: string;
  portal_descripcion: string | null;
  logo_comercio_url: string | null;
  logo_benefi_url: string | null;
  color_sidebar: string | null;
  color_activo: string | null;
  color_fondo: string | null;
  powered_by_texto: string | null;
  activa: boolean;
};

type CampaignResponse = {
  ok?: boolean;
  campaign?: CampaignSettings;
  error?: string;
};

const menu: MenuItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumen del comercio",
  },
  {
  href: "/comercio/terminal",
  label: "Terminal",
  description: "Carga, canje y anulaciones",
  },
  {
    href: "/comercio/terminales",
    label: "Terminales",
    description: "Sucursales y accesos por PIN",
  },
  {
    href: "/comercio/promociones",
    label: "Promociones",
    description: "Ver promociones activas del comercio",
  },
  {
    href: "/comercio/usuarios",
    label: "Usuarios",
    description: "Clientes vinculados al comercio",
  },
  {
    href: "/comercio/notificaciones",
    label: "Notificaciones",
    description: "Enviar mensajes a usuarios",
  },
  {
  href: "/comercio/movimientos",
  label: "Movimientos",
  description: "Historial del comercio",
},
{
  href: "/comercio/pedidos",
  label: "Pedidos",
  description: "Gestionar pedidos del catálogo",
},
{
  href: "/comercio/catalogo",
  label: "Catálogo",
  description: "Productos y categorías",
},
{
  href: "/comercio/notificaciones/historial",
  label: "Historial",
  description: "Campañas enviadas y lecturas",
},
];

const neutralSidebarColor = "#111827";
const neutralActiveColor = "#2563eb";
const neutralBackgroundColor = "#f3f4f6";

function isMenuItemActive(pathname: string | null, href: string) {
  if (!pathname) return false;

  if (href === "/comercio/notificaciones") {
    return pathname === "/comercio/notificaciones";
  }

  if (href === "/comercio/notificaciones/historial") {
    return pathname === "/comercio/notificaciones/historial";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [campaign, setCampaign] = useState<CampaignSettings | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pedidosNuevos, setPedidosNuevos] = useState(0);
  const [panelPedidosOpen, setPanelPedidosOpen] = useState(false);
  const [listaPedidosNuevos, setListaPedidosNuevos] = useState<any[]>([]);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCampaign() {
      try {
        setCampaignLoading(true);

        const comercioId =
          typeof window !== "undefined"
            ? localStorage.getItem("comercio_id")
            : null;
            
        if (!comercioId) {
          if (mounted) {
            setCampaign(null);
            setCampaignLoading(false);
          }
          return;
        }

        const res = await fetch(
          `/api/campaign-by-comercio?comercio_id=${comercioId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json: CampaignResponse = await res.json();

        if (!res.ok || !json?.campaign) {
          if (mounted) setCampaign(null);
          return;
        }

        if (mounted) {
          setCampaign(json.campaign);
        }
      } catch (error) {
        console.error("No se pudo cargar la configuración de campaña", error);
        if (mounted) setCampaign(null);
      } finally {
        if (mounted) setCampaignLoading(false);
      }
    }

    loadCampaign();

    return () => {
      mounted = false;
    };
  }, [])

  useEffect(() => {
  let mounted = true;

  async function cargarConfiguracionCatalogo() {
    try {
      const comercioId =
        typeof window !== "undefined"
          ? localStorage.getItem("comercio_id") ||
            localStorage.getItem("current_comercio_id")
          : null;

      if (!comercioId) {
        if (mounted) {
          setMostrarCatalogo(false);
        }
        return;
      }

      const res = await fetch(
        `/api/admin/catalogo/configuracion?comercio_id=${comercioId}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (mounted) {
          setMostrarCatalogo(false);
        }
        return;
      }

      const configuracion = data?.configuracion;

      const puedeAdministrar =
        configuracion?.habilitado === true &&
        (configuracion?.gestion_modo === "comercio" ||
          configuracion?.gestion_modo === "ambos");

      if (mounted) {
        setMostrarCatalogo(puedeAdministrar);
      }
    } catch (error) {
      console.error(
        "No se pudo cargar la configuración del catálogo",
        error
      );

      if (mounted) {
        setMostrarCatalogo(false);
      }
    }
  }

  cargarConfiguracionCatalogo();

  return () => {
    mounted = false;
  };
}, [pathname]);

  useEffect(() => {
  let mounted = true;

  async function cargarPedidosNuevos() {
    try {
      const comercioId =
        typeof window !== "undefined"
          ? localStorage.getItem("comercio_id")
          : null;

      if (!comercioId) {
        if (mounted) {
          setPedidosNuevos(0);
        }
        return;
      }

      const res = await fetch(
        `/api/comercio/catalogo/pedidos?comercio_id=${comercioId}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return;
      }

      const pedidos = Array.isArray(data?.pedidos)
        ? data.pedidos
        : [];

      const nuevos = pedidos.filter(
        (pedido: {
          estado?: string;
          visto_comercio?: boolean;
        }) =>
          pedido.estado === "nuevo" &&
          pedido.visto_comercio !== true
      );

      if (mounted) {
        setPedidosNuevos(nuevos.length);
        setListaPedidosNuevos(nuevos);
      }
    } catch (error) {
      console.error(
        "No se pudieron cargar los pedidos nuevos",
        error
      );
    }
  }

  cargarPedidosNuevos();

  const intervalo = window.setInterval(
    cargarPedidosNuevos,
    30000
  );

  return () => {
    mounted = false;
    window.clearInterval(intervalo);
  };
}, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("comercio_id");
      localStorage.removeItem("current_comercio_id");
    }

    router.push("/comercio/login");
  }

  const sidebarColor = campaign?.color_sidebar || neutralSidebarColor;
  const activeColor = campaign?.color_activo || neutralActiveColor;
  const fondoColor = campaign?.color_fondo || neutralBackgroundColor;
  const logoComercio = campaign?.logo_comercio_url || "";
  const logoBenefi = campaign?.logo_benefi_url || "/benefi-logo-blanco.png";
  const portalTitulo = campaign?.portal_titulo || "Portal del comercio";
  const portalDescripcion =
    campaign?.portal_descripcion ||
    "Acceso a terminal, dashboard y herramientas operativas.";
  const nombreCampania = campaign?.nombre_campania || "Logo del comercio";
  const poweredBy = campaign?.powered_by_texto || "Powered by BENEFI";

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background: fondoColor,
        ["--sidebar-color" as string]: sidebarColor,
        ["--active-color" as string]: activeColor,
        ["--portal-bg" as string]: fondoColor,
      }}
    >
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="fixed left-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-lg lg:hidden"
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {menuOpen && (
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[55] bg-black/45 lg:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <div className="min-h-screen lg:grid lg:grid-cols-[310px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-[60] w-[300px] max-w-[86vw] overflow-y-auto border-r border-white/10 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:max-w-none lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ background: '#1E3A5F' }}
        >
          <div className="flex min-h-full flex-col p-[22px]">
            <div className="mb-[18px] rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
                <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  Menú
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-white"
                >
                  Cerrar
                </button>
              </div>

              <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.03] p-3.5">
                {campaignLoading ? (
                  <div className="h-10 w-3/4 rounded-xl bg-white/[0.08]" />
                ) : logoComercio ? (
                  <img
                    src={logoComercio}
                    alt={nombreCampania}
                    className="block max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-sm font-bold text-slate-400">
                    Sin logo configurado
                  </div>
                )}
              </div>

              <div className="mb-1 text-[19px] font-extrabold leading-6">
                {campaignLoading ? "Cargando portal..." : portalTitulo}
              </div>

              <div className="text-sm leading-5 text-slate-400">
                {campaignLoading
                  ? "Cargando branding del comercio..."
                  : portalDescripcion}
              </div>
            </div>

            <div className="mb-[18px] rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Comercio activo
              </div>
              <ComercioSelector />
            </div>

            <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
              Menú
            </div>

            <nav className="flex flex-col gap-2.5">
              {menu
              .filter((item) => {
                if (item.href === "/comercio/catalogo") {
                  return mostrarCatalogo;
                }

                return true;
              })
              .map((item) => {
                const active = isMenuItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl border px-4 py-3.5 no-underline transition"
                    style={{
                      background: active ? activeColor : "rgba(255,255,255,0.04)",
                      borderColor: active
                        ? "rgba(255,255,255,0.20)"
                        : "rgba(255,255,255,0.05)",
                      color: "#fff",
                      boxShadow: active
                        ? "0 12px 28px rgba(37,99,235,0.35)"
                        : "none",
                      opacity: campaignLoading ? 0.92 : 1,
                    }}
                  >
                    <div className="mb-1 text-[17px] font-extrabold leading-5">
                      {item.label}
                    </div>
                    <div
                      className="text-[13px] leading-[19px]"
                      style={{ color: active ? "#dbeafe" : "#9ca3af" }}
                    >
                      {item.description}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex flex-col gap-3 pt-[18px]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full cursor-pointer rounded-[14px] border border-white/10 bg-white/[0.05] px-3.5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>

              <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Tecnología
                </div>

                <div className="mb-2.5 flex h-[58px] items-center justify-center overflow-hidden rounded-xl bg-white/[0.02] p-2">
                  <img
                    src={logoBenefi}
                    alt="BENEFI"
                    className="block max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="text-center text-xs leading-[18px] text-slate-400">
                  {campaignLoading ? "Cargando..." : poweredBy}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 bg-[var(--portal-bg)] pt-16 lg:pt-0">
          <div className="absolute right-6 top-4 z-40 hidden lg:block">
            <button
              type="button"
              onClick={() => setPanelPedidosOpen((prev) => !prev)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-600 shadow-sm transition hover:bg-amber-200 hover:text-amber-700"
              aria-label="Notificaciones de pedidos"
            >
              <Bell size={22} strokeWidth={2.2} />
                {pedidosNuevos > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white shadow">
                    {pedidosNuevos > 99 ? "99+" : pedidosNuevos}
                  </span>
                )}
            </button>
            {panelPedidosOpen && (
            <div className="absolute right-0 top-14 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Nuevos pedidos
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Pedidos pendientes de revisión
                  </div>
                </div>

                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                  {pedidosNuevos}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {listaPedidosNuevos.length > 0 ? (
                  listaPedidosNuevos.map((pedido) => (
                    <button
                      key={pedido.id}
                      type="button"
                      onClick={() => {
                        setPanelPedidosOpen(false);
                        router.push(`/comercio/pedidos/${pedido.id}`);
                      }}
                      className="w-full cursor-pointer rounded-xl border border-blue-100 bg-blue-50 p-3 text-left transition hover:bg-blue-100"
                    >
                      <div className="text-sm font-bold text-slate-900">
                        Pedido #{pedido.numero_pedido}
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        {pedido.usuario?.nombre_completo ||
                          pedido.nombre_receptor ||
                          "Cliente"}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-blue-700">
                          Ver pedido →
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            maximumFractionDigits: 0,
                          }).format(Number(pedido.total_pesos || 0))}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    No hay pedidos nuevos.
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
