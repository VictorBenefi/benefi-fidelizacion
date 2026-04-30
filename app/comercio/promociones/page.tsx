"use client";

import { useEffect, useMemo, useState } from "react";
import { getCurrentComercio } from "@/lib/getCurrentComercio";

type Promocion = {
  id: string;
  nombre?: string | null;
  tipo?: string | null;
  valor?: number | null;
  aplica_a?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activa?: boolean | null;
  suma_puntos_en_descarga?: boolean | null;
  cada_monto?: number | null;
  puntos_por_tramo?: number | null;
  comercio_id?: string | null;
};

function getTipoLabel(tipo?: string | null) {
  if (tipo === "porcentaje") return "Porcentaje";
  if (tipo === "tramo") return "Tramo";
  if (tipo === "puntos_fijos") return "Puntos fijos";
  return tipo || "-";
}

function getAplicaALabel(value?: string | null) {
  if (value === "general") return "General";
  if (value === "producto") return "Producto";
  if (value === "marca") return "Marca";
  return value || "-";
}

function formatFecha(value?: string | null) {
  if (!value) return "-";
  return value;
}

function getResumenPromo(promo: Promocion) {
  if (promo.tipo === "porcentaje") {
    return `${promo.valor ?? 0}%`;
  }

  if (promo.tipo === "tramo") {
    return `${promo.puntos_por_tramo ?? 0} pts cada $${promo.cada_monto ?? 0}`;
  }

  if (promo.tipo === "puntos_fijos") {
    return `${promo.valor ?? 0} pts fijos`;
  }

  return "-";
}
function getEstadoPromo(promo: Promocion) {
  const hoy = new Date().toISOString().split("T")[0];

  if (!promo.activa) {
    return { label: "Inactiva", color: "bg-slate-100 text-slate-600" };
  }

  if (promo.fecha_fin && promo.fecha_fin < hoy) {
    return { label: "Vencida", color: "bg-red-100 text-red-700" };
  }

  if (promo.fecha_inicio && promo.fecha_inicio > hoy) {
    return { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" };
  }

  return { label: "Activa", color: "bg-green-100 text-green-700" };
}

export default function ComercioPromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [comercioNombre, setComercioNombre] = useState("Comercio");
  const [comercioId, setComercioId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"ok" | "error" | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function cargar() {
    try {
      setLoading(true);
      setMensaje("");
      setMensajeTipo("");

      const comercio = await getCurrentComercio();

      if (!comercio?.id) {
        setMensaje("No se pudo identificar el comercio logueado.");
        setMensajeTipo("error");
        return;
      }

      setComercioId(comercio.id);
      setComercioNombre(
        comercio.nombre_fantasia || comercio.razon_social || "Comercio"
      );

      const res = await fetch(
        `/api/comercio/promociones?comercio_id=${comercio.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data?.error || "No se pudieron cargar las promociones.");
        setMensajeTipo("error");
        return;
      }

      setPromociones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al cargar las promociones.");
      setMensajeTipo("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function toggleActiva(promo: Promocion) {
    const confirmar = window.confirm(
      `¿Seguro que querés ${promo.activa ? "desactivar" : "activar"} esta promoción?`
    );
    if (!confirmar) return;

    try {
      setUpdatingId(promo.id);
      setMensaje("");
      setMensajeTipo("");

      const payload = {
        comercio_id: promo.comercio_id || comercioId || null,
        nombre: promo.nombre || null,
        tipo: promo.tipo || null,
        valor: promo.valor ?? null,
        aplica_a: promo.aplica_a || null,
        fecha_inicio: promo.fecha_inicio || null,
        fecha_fin: promo.fecha_fin || null,
        activa: !promo.activa,
        suma_puntos_en_descarga: promo.suma_puntos_en_descarga ?? false,
        cada_monto: promo.cada_monto ?? null,
        puntos_por_tramo: promo.puntos_por_tramo ?? null,
      };

      const res = await fetch(`/api/admin/promociones/${promo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data?.error || "No se pudo actualizar la promoción.");
        setMensajeTipo("error");
        return;
      }

      setPromociones((prev) =>
        prev.map((item) =>
          item.id === promo.id ? { ...item, activa: !promo.activa } : item
        )
      );

      setMensaje(
        `Promoción ${promo.activa ? "desactivada" : "activada"} correctamente.`
      );
      setMensajeTipo("ok");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al actualizar la promoción.");
      setMensajeTipo("error");
    } finally {
      setUpdatingId(null);
    }
  }

  const promocionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return promociones.filter((promo) => {
      const texto = [
        promo.nombre,
        promo.tipo,
        promo.aplica_a,
        String(promo.valor ?? ""),
        String(promo.cada_monto ?? ""),
        String(promo.puntos_por_tramo ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !q || texto.includes(q);
    });
  }, [promociones, busqueda]);

  const cantidadActivas = promociones.filter((p) => p.activa).length;
  const cantidadTramo = promociones.filter((p) => p.tipo === "tramo").length;
  const cantidadPorcentaje = promociones.filter((p) => p.tipo === "porcentaje").length;
  const cantidadFijas = promociones.filter((p) => p.tipo === "puntos_fijos").length;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Promociones</h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Estas son las promociones disponibles para {comercioNombre}. Desde acá podés activarlas o desactivarlas.
          </p>
        </div>

        {mensaje && (
          <div
            className={`rounded-2xl border px-4 py-3 text-base font-medium ${
              mensajeTipo === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-base font-medium text-slate-500">Promociones activas</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">{cantidadActivas}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-base font-medium text-slate-500">Porcentaje</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">{cantidadPorcentaje}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-base font-medium text-slate-500">Tramo</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">{cantidadTramo}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-base font-medium text-slate-500">Puntos fijos</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">{cantidadFijas}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-base font-medium text-slate-700">
            Buscar promoción
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, tipo o aplicación..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-slate-900">
              Listado de promociones del comercio
            </h2>
          </div>

          <div className="max-h-[520px] overflow-y-auto overflow-x-auto p-6">
            {loading ? (
              <div className="py-10 text-base text-slate-500">Cargando promociones...</div>
            ) : promocionesFiltradas.length === 0 ? (
              <div className="py-10 text-base text-slate-500">
                No hay promociones disponibles para mostrar.
              </div>
            ) : (
              <table className="min-w-full text-base">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-3 pr-4 font-semibold">Nombre</th>
                    <th className="pb-3 pr-4 font-semibold">Tipo</th>
                    <th className="pb-3 pr-4 font-semibold">Aplica a</th>
                    <th className="pb-3 pr-4 font-semibold">Beneficio</th>
                    <th className="pb-3 pr-4 font-semibold">Vigencia</th>
                    <th className="pb-3 pr-4 font-semibold">Estado</th>
                    <th className="pb-3 pr-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {promocionesFiltradas.map((promo) => (
                    <tr
                      key={promo.id}
                      className="border-b border-slate-100 align-top text-slate-800"
                    >
                      <td className="py-4 pr-4 font-medium text-slate-900">
                        {promo.nombre || "-"}
                      </td>
                      <td className="py-4 pr-4">{getTipoLabel(promo.tipo)}</td>
                      <td className="py-4 pr-4">{getAplicaALabel(promo.aplica_a)}</td>
                      <td className="py-4 pr-4">{getResumenPromo(promo)}</td>
                      <td className="py-4 pr-4">
                        {formatFecha(promo.fecha_inicio)} / {formatFecha(promo.fecha_fin)}
                      </td>
                      <td className="py-4 pr-4">
                      {(() => {
                        const estado = getEstadoPromo(promo);

                        return (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${estado.color}`}
                          >
                            {estado.label}
                          </span>
                        );
                      })()}
                    </td>
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => toggleActiva(promo)}
                          disabled={updatingId === promo.id}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          {updatingId === promo.id
                            ? "Guardando..."
                            : promo.activa
                            ? "Desactivar"
                            : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
