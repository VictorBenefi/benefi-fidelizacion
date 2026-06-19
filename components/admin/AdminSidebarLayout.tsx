"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Inicio", href: "/admin", description: "Panel general del backoffice" },
  { label: "Campañas", href: "/admin/campanias", description: "Branding, logos y colores" },
  { label: "Comercios", href: "/admin/comercios", description: "Asignación y gestión comercial" },
  { label: "Solicitudes", href: "/admin/solicitudes", description: "Pruebas gratis pendientes"  },
  { label: "Usuarios", href: "/admin/usuarios", description: "Próximamente" },
  { label: "Promociones", href: "/admin/promociones" },
  { label: "Movimientos", href: "/admin/movimientos", description: "Operaciones y auditoría" },
  { label: "Configuración", href: "/admin/configuracion", description: "Próximamente" },
];

export default function AdminSidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">

        {/* 🔹 BOTÓN MOBILE */}
        <button
          onClick={() => setOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-lg bg-slate-900 px-3 py-2 text-white md:hidden"
        >
          ☰
        </button>

        {/* 🔹 OVERLAY */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}

        {/* 🔹 SIDEBAR */}
        <aside
          className={`
            fixed z-50 h-full w-[280px] bg-slate-950 text-white transition-transform
            ${open ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0
          `}
        >
          <div className="flex h-full flex-col p-4">

            {/* HEADER */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Backoffice
              </div>
              <div className="mt-3 text-4xl font-bold">BENEFI</div>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Administración de campañas, configuración y módulos del sistema.
              </p>
            </div>

            {/* MENU */}
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
                      onClick={() => setOpen(false)} // 👈 cierra en mobile
                      className={`block rounded-2xl border p-4 transition ${
                        active
                          ? "border-blue-500 bg-blue-600/15"
                          : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="text-lg font-semibold">{item.label}</div>
                      {item.description && (
                        <div className="mt-1 text-base leading-6 text-slate-300">
                          {item.description}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* FOOTER */}
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
                className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1 md:ml-0">{children}</main>
      </div>
    </div>
  );
}