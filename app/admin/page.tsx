"use client";

import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    const res = await fetch("/api/admin/dashboard");
    const data = await res.json();

    if (res.ok && Array.isArray(data)) {
      setMovimientos(data);
    }
  }

  const movimientosActivos = movimientos.filter((m) => m.estado !== "anulado");

  const totalMovimientos = movimientos.length;

  const totalMovimientosActivos = movimientosActivos.length;

  const totalCompras = movimientosActivos.reduce(
    (acc, m) => acc + Number(m.monto_compra || 0),
    0
  );

  const puntosGenerados = movimientosActivos
    .filter((m) => m.tipo === "carga")
    .reduce((acc, m) => acc + Number(m.puntos || 0), 0);

  const puntosCanjeados = movimientosActivos
    .filter((m) => m.tipo === "canje")
    .reduce((acc, m) => acc + Number(m.puntos || 0), 0);

  const clientesUnicos = new Set(
    movimientosActivos.map((m) => m.usuario_id).filter(Boolean)
  ).size;

  const comerciosUnicos = new Set(
    movimientosActivos.map((m) => m.comercio_id).filter(Boolean)
  ).size;

  const ticketPromedio =
    movimientosActivos.length > 0
      ? Math.round(totalCompras / movimientosActivos.length)
      : 0;

  const rankingComercios = Object.values(
    movimientosActivos.reduce((acc: any, m) => {
      const nombre = m.comercios?.nombre_fantasia || "Sin comercio";

      if (!acc[nombre]) {
        acc[nombre] = {
          comercio: nombre,
          movimientos: 0,
          ventas: 0,
          puntos: 0,
        };
      }

      acc[nombre].movimientos += 1;
      acc[nombre].ventas += Number(m.monto_compra || 0);
      acc[nombre].puntos += Number(m.puntos || 0);

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.movimientos - a.movimientos);

  const ultimosMovimientos = movimientos
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  return (
    <div className="p-8">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">
        Dashboard Admin
      </h1>

      <p className="mb-6 text-slate-600">
        Vista global de movimientos, puntos, ventas y actividad de la red.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card title="Movimientos" value={totalMovimientos} />
        <Card title="Activos" value={totalMovimientosActivos} />
        <Card title="Total compras" value={`$${totalCompras}`} />
        <Card title="Puntos generados" value={puntosGenerados} />
        <Card title="Puntos canjeados" value={puntosCanjeados} />
        <Card title="Ticket promedio" value={`$${ticketPromedio}`} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Clientes únicos" value={clientesUnicos} />
        <Card title="Comercios con actividad" value={comerciosUnicos} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Ranking de comercios
          </h2>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Comercio</th>
                  <th className="p-3 text-left">Movimientos</th>
                  <th className="p-3 text-left">Ventas</th>
                  <th className="p-3 text-left">Puntos</th>
                </tr>
              </thead>

              <tbody>
                {rankingComercios.map((r: any) => (
                  <tr key={r.comercio} className="border-t">
                    <td className="p-3">{r.comercio}</td>
                    <td className="p-3">{r.movimientos}</td>
                    <td className="p-3">${r.ventas}</td>
                    <td className="p-3">{r.puntos}</td>
                  </tr>
                ))}

                {rankingComercios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      Sin datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Últimos movimientos
          </h2>

          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Comercio</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Puntos</th>
                </tr>
              </thead>

              <tbody>
                {ultimosMovimientos.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      {m.comercios?.nombre_fantasia || "-"}
                    </td>
                    <td className="p-3">
                      {m.usuarios?.nombre_completo || "-"}
                    </td>
                    <td className="p-3">{m.tipo || "-"}</td>
                    <td className="p-3">{m.puntos || 0}</td>
                  </tr>
                ))}

                {ultimosMovimientos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Sin movimientos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}