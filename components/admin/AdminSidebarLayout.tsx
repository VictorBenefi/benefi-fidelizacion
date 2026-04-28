"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Inicio",
    href: "/admin",
    description: "Panel general del backoffice",
  },
  {
    label: "Campañas",
    href: "/admin/campanias",
    description: "Branding, logos y colores",
  },
  {
    label: "Comercios",
    href: "/admin/comercios",
    description: "Asignación y gestión comercial",
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    description: "Próximamente",
  },
    {
    label: "Promociones",
    href: "/admin/promociones",
  },
  {
  href: "/admin/movimientos",
  label: "Movimientos",
  description: "Operaciones y auditoría",
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    description: "Próximamente",
  },
];

export default function AdminSidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-[290px] shrink-0 bg-slate-950 text-white">
          <div className="flex h-full flex-col p-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Backoffice
              </div>
              <div className="mt-3 text-4xl font-bold">BENEFI</div>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Administración de campañas, configuración y módulos del sistema.
              </p>
            </div>

            <div className="mt-6">
              <div className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Menú administrativo
              </div>

              <nav className="mt-3 space-y-3">
                {menuItems.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block rounded-2xl border p-4 transition ${
                        active
                          ? "border-blue-500 bg-blue-600/15"
                          : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="text-lg font-semibold">{item.label}</div>
                      <div className="mt-1 text-base leading-6 text-slate-300">
                        {item.description}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Entorno
            </div>

            <div className="mt-3 text-2xl font-semibold">Admin Console</div>

            <div className="mt-2 text-base leading-7 text-slate-300">
              White-label · campañas · configuración
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("admin_user");
                window.location.href = "/login";
              }}
              className="mt-4 w-full cursor-pointer rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}