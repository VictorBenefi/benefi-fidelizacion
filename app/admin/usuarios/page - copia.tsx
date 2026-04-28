"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Usuario = {
  id: string;
  nombre_completo: string;
  dni: string;
  email: string;
  telefono: string;
  created_at: string;
  activo: boolean;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [dniExacto, setDniExacto] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const totalPuntos = movimientos
  .filter((m) => m.tipo === "carga" || m.tipo === "acreditacion")
  .reduce((acc, m) => acc + Number(m.puntos || 0), 0);

const totalCanjeados = movimientos
  .filter((m) => m.tipo === "canje")
  .reduce((acc, m) => acc + Number(m.puntos || 0), 0);

const saldoActual = totalPuntos - totalCanjeados;

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    const { data, error } = await supabaseClient
      .from("usuarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsuarios(data as Usuario[]);
    }
  }

  async function toggleActivo(id: string, estadoActual: boolean) {
    const { error } = await supabaseClient
      .from("usuarios")
      .update({ activo: !estadoActual })
      .eq("id", id);

    if (!error) {
      cargarUsuarios();
    }
  }
  async function verDetalle(usuario: Usuario) {
  setUsuarioSeleccionado(usuario);

  const { data } = await supabaseClient
  .from("movimientos_puntos")
  .select("*")
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false });

  if (data) {
    setMovimientos(data);
  } else {
    setMovimientos([]);
  }
}

  function exportarExcel() {
    if (usuariosFiltrados.length === 0) return;

    const rows = usuariosFiltrados.map((u) => ({
      Nombre: u.nombre_completo || "",
      DNI: u.dni || "",
      Email: u.email || "",
      Telefono: u.telefono || "",
      Estado: u.activo ? "Activo" : "Inactivo",
      FechaAlta: u.created_at
        ? new Date(u.created_at).toLocaleDateString()
        : "",
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "usuarios.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }
  function exportarMovimientos() {
  if (!usuarioSeleccionado || movimientos.length === 0) return;

  const rows = movimientos.map((m) => ({
    Tipo: m.tipo || "",
    Puntos: m.puntos ?? "",
    Fecha: m.created_at
      ? new Date(m.created_at).toLocaleDateString()
      : "",
  }));

  const csv = [
    Object.keys(rows[0]).join(","),
    ...rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `movimientos-${usuarioSeleccionado.nombre_completo}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

const usuariosFiltrados = usuarios.filter((u) => {
  const coincideBusqueda =
    `${u.nombre_completo || ""} ${u.dni || ""} ${u.email || ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());

  const coincideEstado =
    filtroEstado === "todos" ||
    (filtroEstado === "activos" && u.activo) ||
    (filtroEstado === "inactivos" && !u.activo);

  const fechaUsuario = u.created_at ? new Date(u.created_at) : null;

  const coincideFechaDesde =
    !fechaDesde ||
    (fechaUsuario &&
      fechaUsuario >= new Date(`${fechaDesde}T00:00:00`));

  const coincideFechaHasta =
    !fechaHasta ||
    (fechaUsuario &&
      fechaUsuario <= new Date(`${fechaHasta}T23:59:59`));

  const coincideDni =
  !dniExacto || String(u.dni) === dniExacto;

  const movimientosUsuario = movimientos.filter(
  (m) => m.usuario_id === usuarioSeleccionado?.id
);

const saldo = movimientosUsuario.reduce(
  (acc, m) => acc + Number(m.puntos || 0),
  0
);

  return (
  coincideBusqueda &&
  coincideEstado &&
  coincideFechaDesde &&
  coincideFechaHasta &&
  coincideDni
);
});
const totalUsuarios = usuarios.length;
const totalActivos = usuarios.filter((u) => u.activo).length;
const totalInactivos = usuarios.filter((u) => !u.activo).length;
 return (
  <>
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Usuarios</h1>
      <div className="mb-4 grid grid-cols-3 gap-4">
  <div className="rounded-xl border bg-white p-4 shadow-sm">
    <div className="text-sm text-gray-500">Total usuarios</div>
    <div className="text-2xl font-semibold">{totalUsuarios}</div>
  </div>

  <div className="rounded-xl border bg-white p-4 shadow-sm">
    <div className="text-sm text-gray-500">Usuarios activos</div>
    <div className="text-2xl font-semibold text-green-600">{totalActivos}</div>
  </div>

  <div className="rounded-xl border bg-white p-4 shadow-sm">
    <div className="text-sm text-gray-500">Usuarios inactivos</div>
    <div className="text-2xl font-semibold text-red-600">{totalInactivos}</div>
  </div>
</div>

<div className="mb-4 flex flex-wrap gap-2">
  <input
    type="text"
    placeholder="Buscar por nombre, DNI o email..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    className="min-w-[320px] flex-1 rounded-lg border px-3 py-2"
  />

  <select
    value={filtroEstado}
    onChange={(e) => setFiltroEstado(e.target.value)}
    className="rounded-lg border px-3 py-2"
  >
    <option value="todos">Todos</option>
    <option value="activos">Activos</option>
    <option value="inactivos">Inactivos</option>
  </select>
  <input
  type="text"
  placeholder="DNI exacto"
  value={dniExacto}
  onChange={(e) => setDniExacto(e.target.value)}
  className="w-[150px] rounded-lg border px-3 py-2"
  />
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
    onClick={exportarExcel}
    className="rounded-lg bg-blue-600 px-4 py-2 text-white"
  >
    Exportar
  </button>
</div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">DNI</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-left">Fecha Alta</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.nombre_completo}</td>
                <td className="p-3">{u.dni}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.telefono}</td>
                <td className="p-3">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td className="p-3">
                  {u.activo ? (
                    <span className="font-medium text-green-600">Activo</span>
                  ) : (
                    <span className="font-medium text-red-600">Inactivo</span>
                  )}
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => verDetalle(u)}
                    className="cursor-pointer rounded-lg border px-3 py-1 text-sm"
                  >
                    Ver
                  </button>

                  <button
                    onClick={() => toggleActivo(u.id, u.activo)}
                    className="cursor-pointer rounded-lg border px-3 py-1 text-sm"
                  >
                    {u.activo ? "Inactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}

            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {usuarioSeleccionado && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[80vh] w-[700px] overflow-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold">
            {usuarioSeleccionado.nombre_completo}
          </h2>

          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div><b>DNI:</b> {usuarioSeleccionado.dni}</div>
            <div><b>Email:</b> {usuarioSeleccionado.email}</div>
            <div><b>Teléfono:</b> {usuarioSeleccionado.telefono}</div>
            <div><b>Estado:</b> {usuarioSeleccionado.activo ? "Activo" : "Inactivo"}</div>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Puntos acumulados</div>
            <div className="text-lg font-semibold">{totalPuntos}</div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Puntos descargados</div>
            <div className="text-lg font-semibold">{totalCanjeados}</div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-gray-500">Saldo actual</div>
            <div className="text-lg font-semibold">{saldoActual}</div>
          </div>
        </div>

          <h3 className="mb-2 font-semibold">Movimientos</h3>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Puntos</th>
                  <th className="p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2">{m.tipo || "-"}</td>
                    <td className="p-2">{m.puntos ?? "-"}</td>
                    <td className="p-2">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}

                {movimientos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">
                      Sin movimientos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
  <button
    onClick={exportarMovimientos}
    className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white"
  >
    Exportar movimientos
  </button>

  <button
    onClick={() => {
      setUsuarioSeleccionado(null);
      setMovimientos([]);
    }}
    className="cursor-pointer rounded-lg border px-4 py-2"
  >
    Cerrar
  </button>
</div>
        </div>
      </div>
    )}
  </>
);
}