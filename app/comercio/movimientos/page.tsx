"use client";

import { useEffect, useState } from "react";

export default function ComercioMovimientosPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    fetchMovimientos();
  }, []);

  async function fetchMovimientos() {
    try {
      const comercio_id =
        typeof window !== "undefined"
          ? localStorage.getItem("comercio_id")
          : null;

      if (!comercio_id) return;

      const res = await fetch("/api/comercio/movimientos/listado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comercio_id }),
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setMovimientos(data);
      } else {
        setMovimientos([]);
      }
    } catch (error) {
      console.error(error);
      setMovimientos([]);
    }
  }
function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const d = new Date(fecha);

  return d
    .toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(",", "");
}

function exportarMovimientos() {
  if (movimientosFiltrados.length === 0) return;

  const rows = movimientosFiltrados.map((m) => ({
    Fecha: formatearFecha(m.created_at),
    Cliente: m.usuarios?.nombre_completo || "",
    DNI: m.usuarios?.dni || "",
    Compra: m.monto_compra || 0,
    Tipo: m.tipo || "",
    Puntos: m.puntos || 0,
    Ticket: m.nro_ticket || "",
    Estado: m.estado || "",
  }));

  const csv = [
    Object.keys(rows[0]).join(";"),
    ...rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "movimientos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

  const totalMovimientos = movimientos.length;
  const totalCargas = movimientos.filter((m) => m.tipo === "carga").length;
  const totalCanjes = movimientos.filter((m) => m.tipo === "canje").length;

  const totalCompras = movimientos.reduce(
    (acc, m) => acc + Number(m.monto_compra || 0),
    0
  );

  const totalPuntosGenerados = movimientos
    .filter((m) => m.tipo === "carga")
    .reduce((acc, m) => acc + Number(m.puntos || 0), 0);

  const totalPuntosCanjeados = movimientos
    .filter((m) => m.tipo === "canje")
    .reduce((acc, m) => acc + Number(m.puntos || 0), 0);

  const movimientosFiltrados = movimientos.filter((m) => {
    const texto = `${m.usuarios?.nombre_completo || ""} ${m.usuarios?.dni || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const tipoOk = tipoFiltro === "todos" || m.tipo === tipoFiltro;

    const fecha = new Date(m.created_at);

    const desdeOk = fechaDesde
      ? fecha >= new Date(`${fechaDesde}T00:00:00`)
      : true;

    const hastaOk = fechaHasta
      ? fecha <= new Date(`${fechaHasta}T23:59:59`)
      : true;

    return texto && tipoOk && desdeOk && hastaOk;
  });

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Movimientos del comercio</h1>

      <div className="mb-4 grid grid-cols-3 gap-4 xl:grid-cols-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total movimientos</div>
          <div className="text-2xl font-semibold">{totalMovimientos}</div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Cargas</div>
          <div className="text-2xl font-semibold text-green-600">{totalCargas}</div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Canjes</div>
          <div className="text-2xl font-semibold text-red-600">{totalCanjes}</div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total compras</div>
          <div className="text-2xl font-semibold">${totalCompras}</div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Puntos generados</div>
          <div className="text-2xl font-semibold">{totalPuntosGenerados}</div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Puntos canjeados</div>
          <div className="text-2xl font-semibold">{totalPuntosCanjeados}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar cliente o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="todos">Todos</option>
          <option value="carga">Cargas</option>
          <option value="canje">Canjes</option>
        </select>

        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />

        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />

        <button
          onClick={exportarMovimientos}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Exportar
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Compra</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Puntos</th>
              <th className="p-3">Ticket</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>

          <tbody>
            {movimientosFiltrados.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">
                  {m.created_at ? new Date(m.created_at).toLocaleString() : "-"}
                </td>
                <td className="p-3">{m.usuarios?.nombre_completo || "-"}</td>
                <td className="p-3">{m.usuarios?.dni || "-"}</td>
                <td className="p-3">${m.monto_compra || 0}</td>
                <td className="p-3">{m.tipo || "-"}</td>
                <td className="p-3">{m.puntos || 0}</td>
                <td className="p-3">{m.nro_ticket || "-"}</td>
                <td className="p-3">{m.estado || "-"}</td>
              </tr>
            ))}

            {movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No se encontraron movimientos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}