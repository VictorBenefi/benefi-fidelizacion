"use client";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MovimientosPage() {
  const router = useRouter();

useEffect(() => {
  const admin = localStorage.getItem("admin_user");

  if (!admin) {
    router.push("/login");
  }
}, []);

  const [movimientos, setMovimientos] = useState<any[]>([]);

  useEffect(() => {
    fetchMovimientos();
  }, []);

  async function fetchMovimientos() {
    const res = await fetch("/api/admin/movimientos/listado");
    const data = await res.json();
    setMovimientos(data || []);
  }
 async function anularMovimiento(movimiento: any) {
  const confirmar = confirm("¿Seguro que querés anular este movimiento?");
  if (!confirmar) return;

  const res = await fetch("/api/admin/movimientos/anular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ movimiento }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data?.error || "Error al anular movimiento");
    return;
  }

  await fetchMovimientos();
}
function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const d = new Date(fecha);

  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).replace(",", "");
}
function exportarMovimientos() {
  if (movimientosFiltrados.length === 0) return;

  const rows = movimientosFiltrados.map((m) => ({
    Fecha: formatearFecha(m.created_at),
    Comercio: m.comercios?.nombre_fantasia || "",
    Cliente: m.usuarios?.nombre_completo || "",
    DNI: m.usuarios?.dni || "",
    Compra: m.monto_compra || 0,
    Tipo: m.tipo,
    Puntos: m.puntos,
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

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "movimientos.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}
const totalMovimientos = movimientos.length;
const totalCargas = movimientos.filter((m) => m.tipo === "carga").length;
const totalCanjes = movimientos.filter((m) => m.tipo === "canje").length;
const [busqueda, setBusqueda] = useState("");
const [tipoFiltro, setTipoFiltro] = useState("todos");
const [fechaDesde, setFechaDesde] = useState("");
const [fechaHasta, setFechaHasta] = useState("");

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

  const tipoOk =
    tipoFiltro === "todos" || m.tipo === tipoFiltro;

  const fecha = new Date(m.created_at);

  const desdeOk = fechaDesde
    ? fecha >= new Date(fechaDesde)
    : true;

  const hastaOk = fechaHasta
    ? fecha <= new Date(fechaHasta + "T23:59:59")
    : true;

  return texto && tipoOk && desdeOk && hastaOk;
});
  return (

  <div className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Movimientos</h1>
<div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
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

<div className="mb-4 flex flex-wrap items-end gap-4">

  {/* Buscar */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">Buscar</label>
    <input
      type="text"
      placeholder="Cliente o DNI..."
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      className="rounded-lg border px-3 py-2"
    />
  </div>

  {/* Tipo */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">Tipo</label>
    <select
      value={tipoFiltro}
      onChange={(e) => setTipoFiltro(e.target.value)}
      className="rounded-lg border px-3 py-2"
    >
      <option value="todos">Todos</option>
      <option value="carga">Cargas</option>
      <option value="canje">Canjes</option>
    </select>
  </div>

  {/* Fecha desde */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">Fecha desde</label>
    <input
      type="date"
      value={fechaDesde}
      onChange={(e) => setFechaDesde(e.target.value)}
      className="rounded-lg border px-3 py-2"
    />
  </div>

  {/* Fecha hasta */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">Fecha hasta</label>
    <input
      type="date"
      value={fechaHasta}
      onChange={(e) => setFechaHasta(e.target.value)}
      className="rounded-lg border px-3 py-2"
    />
  </div>

  {/* Botón exportar */}
  <div className="flex flex-col justify-end">
    <button
      onClick={exportarMovimientos}
      className="rounded-lg bg-blue-600 px-4 py-2 text-white"
    >
      Exportar
    </button>
  </div>

</div>

      <div className="max-h-[620px] overflow-auto rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Comercio</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Compra</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Puntos</th>
              <th className="p-3">Ticket</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {movimientosFiltrados.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-3">
                  {new Date(m.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  {m.comercios?.nombre_fantasia}
                </td>
                <td className="p-3">
                  {m.usuarios?.nombre_completo}
                </td>
                <td className="p-3">
                  {m.usuarios?.dni}
                </td>
                <td className="p-3">
                  ${m.monto_compra || 0}
                </td>
                <td className="p-3">{m.tipo}</td>
                <td className="p-3">{m.puntos}</td>
                <td className="p-3">{m.nro_ticket}</td>
                <td className="p-3">
                  {m.estado === "anulado" ? (
                    <span className="text-red-500 font-medium">Anulado</span>
                  ) : (
                    <span className="text-green-600 font-medium">Activo</span>
                  )}
                </td>
                <td className="p-3">
                  {m.estado !== "anulado" && m.tipo !== "reversion" ? (
                    <button
                      onClick={() => anularMovimiento(m)}
                      className="rounded-lg border px-3 py-1 text-sm text-red-600"
                    >
                      Anular
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  }