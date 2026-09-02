"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PedidoItem = {
  id: string;
  producto_nombre: string | null;
  producto_imagen_url: string | null;
  cantidad: number;
  precio_pesos_unitario: number;
  precio_puntos_unitario: number;
  subtotal_pesos: number;
  subtotal_puntos: number;
  observacion: string | null;
};

type Pedido = {
  id: string;
  numero_pedido: number;
  estado: string;
  forma_pago: string | null;
  estado_pago: string | null;
  modalidad_entrega: string | null;
  nombre_receptor: string | null;
  direccion_entrega: string | null;
  observacion_general: string | null;
  subtotal_pesos: number;
  costo_envio: number;
  total_pesos: number;
  total_puntos: number;
  created_at: string;
  puntos_canjeados?: number;
    monto_canje_puntos?: number;
    total_a_pagar_pesos?: number;
    uso_puntos?: boolean;
  comercio?: {
  id: string;
  nombre?: string | null;
} | null;

  usuario?: {
    id: string;
    nombre_completo?: string | null;
    dni?: string | null;
    email?: string | null;
  } | null;

  items?: PedidoItem[];
};

function formatoPesos(valor: number | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function formatoFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}

const estadosBase = [
  { value: "nuevo", label: "Nuevo" },
  { value: "preparando", label: "Preparando" },
  { value: "listo", label: "Listo" },
];

export default function PedidoDetallePage() {
  const params = useParams();
  const router = useRouter();

  const pedidoId = String(params?.pedidoId || "");

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarPedido() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/admin/catalogo/pedidos/${pedidoId}`,
        {
            cache: "no-store",
        }
        );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "No se pudo cargar el pedido"
        );
      }

      setPedido(data.pedido || null);

    
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el pedido"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pedidoId) {
      cargarPedido();
    }
  }, [pedidoId]);

  const cantidadItems = useMemo(() => {
    return (pedido?.items || []).reduce(
      (total, item) =>
        total + Number(item.cantidad || 0),
      0
    );
  }, [pedido]);

  if (loading) {
  return (
    <div className="p-8 text-sm text-slate-500">
      Cargando pedido...
    </div>
  );
}

if (error && !pedido) {
  return (
    <div className="p-8">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    </div>
  );
}

if (!pedido) {
  return null;
}

 

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/pedidos")}
              className="mb-3 cursor-pointer text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Volver a pedidos
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              Pedido #{pedido.numero_pedido}
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-700">
            {pedido.comercio?.nombre || "Comercio no identificado"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {formatoFecha(pedido.created_at)}
            </p>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              pedido.estado === "nuevo"
                ? "bg-blue-100 text-blue-700"
                : pedido.estado === "preparando"
                  ? "bg-amber-100 text-amber-700"
                  : pedido.estado === "listo"
                    ? "bg-violet-100 text-violet-700"
                    : pedido.estado === "en_envio"
                      ? "bg-sky-100 text-sky-700"
                      : pedido.estado === "entregado"
                        ? "bg-green-100 text-green-700"
                        : pedido.estado === "cancelado"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
            }`}
          >
            {pedido.estado === "nuevo"
              ? "Nuevo"
              : pedido.estado === "preparando"
                ? "Preparando"
                : pedido.estado === "listo"
                  ? "Listo"
                  : pedido.estado === "en_envio"
                    ? "En envío"
                    : pedido.estado === "entregado"
                      ? "Entregado"
                      : pedido.estado === "cancelado"
                        ? "Cancelado"
                        : pedido.estado}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Productos
              </h2>

              <div className="mt-4 divide-y divide-slate-100">
                {(pedido.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 py-4"
                  >
                    {item.producto_imagen_url ? (
                      <img
                        src={item.producto_imagen_url}
                        alt={item.producto_nombre || "Producto"}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-slate-100" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900">
                        {item.producto_nombre || "Producto"}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Cantidad: {item.cantidad}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {formatoPesos(
                          item.precio_pesos_unitario
                        )} c/u
                      </div>

                      {item.observacion && (
                        <div className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
                          {item.observacion}
                        </div>
                      )}
                    </div>

                    <div className="font-bold text-slate-900">
                      {formatoPesos(item.subtotal_pesos)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Cliente y entrega
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {pedido.usuario?.nombre_completo ||
                      pedido.nombre_receptor ||
                      "Usuario no identificado"}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    DNI
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {pedido.usuario?.dni || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Modalidad
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {pedido.modalidad_entrega === "domicilio"
                      ? "Envío a domicilio"
                      : "Retiro en comercio"}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dirección
                  </div>
                  <div className="mt-1 text-sm text-slate-900">
                    {pedido.direccion_entrega || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Resumen
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Productos
                  </span>
                  <span className="font-medium text-slate-900">
                    {cantidadItems}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Subtotal
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatoPesos(pedido.subtotal_pesos)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Envío
                  </span>
                  <span className="font-medium text-slate-900">
                    {formatoPesos(pedido.costo_envio)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between">
                        <span className="font-semibold text-slate-900">
                        Total del pedido
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                        {formatoPesos(pedido.total_pesos)}
                        </span>
                    </div>
                    </div>

                    {Number(pedido.puntos_canjeados || 0) > 0 && (
                    <>
                        <div className="flex justify-between">
                        <span className="text-slate-500">
                            Puntos utilizados
                        </span>
                        <span className="font-medium text-slate-900">
                            {Number(pedido.puntos_canjeados || 0).toLocaleString("es-AR")} pts
                        </span>
                        </div>

                        <div className="flex justify-between">
                        <span className="text-slate-500">
                            Canje con puntos
                        </span>
                        <span className="font-medium text-slate-900">
                            - {formatoPesos(pedido.monto_canje_puntos)}
                        </span>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                        <div className="flex justify-between">
                            <span className="font-semibold text-slate-900">
                            A pagar en dinero
                            </span>
                            <span className="text-lg font-bold text-slate-900">
                            {formatoPesos(pedido.total_a_pagar_pesos)}
                            </span>
                        </div>
                        </div>
                    </>
                    )}
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Forma de pago
                    </span>

                    <span className="font-medium text-slate-900">
                      {pedido.forma_pago === "transferencia"
                        ? "Transferencia"
                        : pedido.forma_pago === "al_recibir"
                        ? "Pago al recibir"
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    Estado del pago
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      pedido.estado_pago === "pagado"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {pedido.estado_pago === "pagado"
                      ? "Pagado"
                      : "Pendiente"}
                  </span>
                </div>
                </div>
            </div>

           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
                Estado del pedido
            </h2>

            <div
                className={`mt-4 rounded-xl border p-4 text-sm font-semibold ${
                pedido.estado === "nuevo"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : pedido.estado === "preparando"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : pedido.estado === "listo"
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : pedido.estado === "en_envio"
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : pedido.estado === "entregado"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : pedido.estado === "cancelado"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
            >
                {pedido.estado === "nuevo"
                ? "Pedido nuevo."
                : pedido.estado === "preparando"
                    ? "Pedido en preparación."
                    : pedido.estado === "listo"
                    ? "Pedido listo."
                    : pedido.estado === "en_envio"
                        ? "Pedido en envío."
                        : pedido.estado === "entregado"
                        ? "Pedido finalizado y entregado."
                        : pedido.estado === "cancelado"
                            ? "Pedido cancelado."
                            : pedido.estado}
            </div>

            <p className="mt-3 text-xs text-slate-500">
                Vista de supervisión. El estado solo puede ser gestionado desde el BackOffice del comercio.
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}