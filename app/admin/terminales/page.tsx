"use client";

import { useEffect, useState } from "react";

type Terminal = {
  id: string;
  comercio_id: string;
  nombre_sucursal: string;
  pin: string;
  activa: boolean;
  created_at: string;
  comercios?: {
    nombre_fantasia: string | null;
  } | null;
};

export default function AdminTerminalesPage() {
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarTerminales();
  }, []);

  async function cargarTerminales() {
    try {
      setCargando(true);

      const res = await fetch("/api/admin/terminales", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error(data?.error || "No se pudieron cargar las terminales");
        setTerminales([]);
        return;
      }

      setTerminales(data.terminales || []);
    } catch (error) {
      console.error("Error cargando terminales:", error);
      setTerminales([]);
    } finally {
      setCargando(false);
    }
  }

  const terminalesFiltradas = terminales.filter((terminal) => {
    const texto = `
      ${terminal.comercios?.nombre_fantasia || ""}
      ${terminal.nombre_sucursal || ""}
      ${terminal.pin || ""}
      ${terminal.id || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const activas = terminales.filter((terminal) => terminal.activa).length;
  const inactivas = terminales.filter((terminal) => !terminal.activa).length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Terminales</h1>

        <p className="mt-1 text-sm text-slate-500">
          Terminales y sucursales creadas por los comercios.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Total terminales</div>
          <div className="mt-1 text-2xl font-semibold">
            {terminales.length}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Activas</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {activas}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">Inactivas</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {inactivas}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar comercio, sucursal, PIN o ID..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full max-w-md rounded-lg border bg-white px-3 py-2"
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Comercio</th>
              <th className="p-3 text-left">Sucursal</th>
              <th className="p-3 text-left">PIN</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Fecha de alta</th>
              <th className="p-3 text-left">ID</th>
            </tr>
          </thead>

          <tbody>
            {terminalesFiltradas.map((terminal) => (
              <tr key={terminal.id} className="border-t">
                <td className="p-3 font-medium">
                  {terminal.comercios?.nombre_fantasia || "-"}
                </td>

                <td className="p-3">
                  {terminal.nombre_sucursal || "-"}
                </td>

                <td className="p-3 font-semibold">
                  {terminal.pin || "-"}
                </td>

                <td className="p-3">
                  {terminal.activa ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      Activa
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      Inactiva
                    </span>
                  )}
                </td>

                <td className="p-3">
                  {terminal.created_at
                    ? new Date(terminal.created_at).toLocaleString("es-AR")
                    : "-"}
                </td>

                <td className="p-3 text-xs text-slate-500">
                  {terminal.id}
                </td>
              </tr>
            ))}

            {!cargando && terminalesFiltradas.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-500"
                >
                  No se encontraron terminales.
                </td>
              </tr>
            )}

            {cargando && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-slate-500"
                >
                  Cargando terminales...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}