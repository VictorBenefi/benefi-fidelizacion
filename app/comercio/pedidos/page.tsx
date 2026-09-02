"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ChefHat,
  ClipboardList,
  CircleCheck,
  Store,
  CreditCard,
  ChevronRight,
} from "lucide-react";

function MotoIcon({
  size = 22,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="6.5"
        cy="17.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17.5"
        cy="17.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M6.5 17.5H11L13.5 12H17L19 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 12H13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M13.5 12L15 8.5H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M15 8.5H13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Pedido = {
  id: string;
  numero_pedido: number;
  estado: string;
  forma_pago: string | null;
  modalidad_entrega: string | null;
  nombre_receptor: string | null;
  direccion_entrega: string | null;
  subtotal_pesos: number;
  costo_envio: number;
  total_pesos: number;
  total_puntos: number;
  estado_pago: string | null;
  created_at: string;
  usuario?: {
    id: string;
    nombre_completo?: string | null;
    dni?: string | null;
    email?: string | null;
  } | null;
  items?: any[];
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
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fecha));
}

function textoEstado(estado: string) {
  const estados: Record<string, string> = {
  nuevo: "Nuevo",
  preparando: "Preparando",
  listo: "Listo",
  en_envio: "En envío",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

  return estados[estado] || estado;
}

function claseEstado(estado: string) {
  switch (estado) {
    case "nuevo":
      return "bg-blue-100 text-blue-700";

    case "preparando":
      return "bg-amber-100 text-amber-700";

    case "listo":
      return "bg-violet-100 text-violet-700";

    case "en_envio":
      return "bg-sky-100 text-sky-700";

    case "entregado":
      return "bg-green-100 text-green-700";

    case "cancelado":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PedidosPage() {
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [filtroFormaPago, setFiltroFormaPago] = useState("todas");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState("todos");
  const [filtroEntrega, setFiltroEntrega] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  async function cargarPedidos() {
    try {
      setLoading(true);
      setError("");

      const comercioId =
        localStorage.getItem("comercio_id");

        if (!comercioId) {
        setError(
            "No se pudo identificar el comercio."
        );
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
        throw new Error(
          data?.error ||
            "No se pudieron cargar los pedidos"
        );
      }

      setPedidos(
        Array.isArray(data?.pedidos)
          ? data.pedidos
          : []
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los pedidos"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPedidos();
  }, []);

const pedidosFiltrados = useMemo(() => {
  const prioridadEstados: Record<string, number> = {
    nuevo: 1,
    preparando: 2,
    listo: 3,
    en_envio: 4,
    entregado: 5,
    cancelado: 6,
  };

  const textoBusqueda = busqueda.trim().toLowerCase();

  const filtrados = pedidos.filter((pedido) => {
    // Estado del pedido
    if (
      filtroEstado !== "todos" &&
      pedido.estado !== filtroEstado
    ) {
      return false;
    }

    // Búsqueda por número de pedido o cliente
    if (textoBusqueda) {
      const numeroPedido = String(
        pedido.numero_pedido || ""
      ).toLowerCase();

      const nombreCliente = String(
        pedido.usuario?.nombre_completo ||
          pedido.nombre_receptor ||
          ""
      ).toLowerCase();

      if (
        !numeroPedido.includes(textoBusqueda) &&
        !nombreCliente.includes(textoBusqueda)
      ) {
        return false;
      }
    }

    // Forma de pago
    if (
      filtroFormaPago !== "todas" &&
      pedido.forma_pago !== filtroFormaPago
    ) {
      return false;
    }

    // Estado del pago
    if (
      filtroEstadoPago !== "todos" &&
      pedido.estado_pago !== filtroEstadoPago
    ) {
      return false;
    }

    // Modalidad de entrega
    if (
      filtroEntrega !== "todas" &&
      pedido.modalidad_entrega !== filtroEntrega
    ) {
      return false;
    }

    // Fecha desde
    if (fechaDesde) {
      const fechaPedido = new Date(pedido.created_at);
      const desde = new Date(`${fechaDesde}T00:00:00`);

      if (fechaPedido < desde) {
        return false;
      }
    }

    // Fecha hasta
    if (fechaHasta) {
      const fechaPedido = new Date(pedido.created_at);
      const hasta = new Date(`${fechaHasta}T23:59:59`);

      if (fechaPedido > hasta) {
        return false;
      }
    }

    return true;
  });

  return filtrados.sort((a, b) => {
    const prioridadA =
      prioridadEstados[a.estado] ?? 99;

    const prioridadB =
      prioridadEstados[b.estado] ?? 99;

    if (prioridadA !== prioridadB) {
      return prioridadA - prioridadB;
    }

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });
}, [
  pedidos,
  filtroEstado,
  busqueda,
  filtroFormaPago,
  filtroEstadoPago,
  filtroEntrega,
  fechaDesde,
  fechaHasta,
]);

  const nuevos = pedidos.filter(
    (pedido) => pedido.estado === "nuevo"
  ).length;

  const enPreparacion = pedidos.filter(
  (pedido) => pedido.estado === "preparando"
).length;

  const listos = pedidos.filter(
    (pedido) => pedido.estado === "listo"
  ).length;

  const enEnvio = pedidos.filter(
  (pedido) => pedido.estado === "en_envio"
).length;

const entregados = pedidos.filter(
  (pedido) => pedido.estado === "entregado"
).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Pedidos
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Administrá los pedidos realizados desde
              el catálogo.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarPedidos}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Actualizar
          </button>
        </div>

       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShoppingBag size={28} strokeWidth={2} />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-500">
                Nuevos
              </div>

              <div className="mt-1 text-3xl font-bold text-blue-600">
                {nuevos}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ChefHat size={28} strokeWidth={2} />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-500">
                En preparación
              </div>

              <div className="mt-1 text-3xl font-bold text-amber-600">
                {enPreparacion}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <ClipboardList size={28} strokeWidth={2} />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-500">
                Listos
              </div>

              <div className="mt-1 text-3xl font-bold text-violet-600">
                {listos}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <MotoIcon size={28} />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-500">
                En envío
              </div>

              <div className="mt-1 text-3xl font-bold text-sky-600">
                {enEnvio}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <CircleCheck size={28} strokeWidth={2} />
            </div>

            <div>
              <div className="text-sm font-medium text-slate-500">
                Entregados
              </div>

              <div className="mt-1 text-3xl font-bold text-green-600">
                {entregados}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nº de pedido o cliente"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estado
              </label>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="todos">Todos</option>
                <option value="nuevo">Nuevos</option>
                <option value="preparando">Preparando</option>
                <option value="listo">Listos</option>
                <option value="en_envio">En envío</option>
                <option value="entregado">Entregados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Forma de pago
              </label>

              <select
                value={filtroFormaPago}
                onChange={(e) => setFiltroFormaPago(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="todas">Todas</option>
                <option value="transferencia">Transferencia</option>
                <option value="al_recibir">Al recibir</option>
                <option value="puntos">Puntos</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estado del pago
              </label>

              <select
                value={filtroEstadoPago}
                onChange={(e) => setFiltroEstadoPago(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Entrega
              </label>

              <select
                value={filtroEntrega}
                onChange={(e) => setFiltroEntrega(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="todas">Todas</option>
                <option value="retiro">Retiro en comercio</option>
                <option value="domicilio">A domicilio</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Desde
              </label>

              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hasta
              </label>

              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="text-sm text-slate-500">
              Mostrando{" "}
              <span className="font-bold text-slate-800">
                {pedidosFiltrados.length}
              </span>{" "}
              de{" "}
              <span className="font-bold text-slate-800">
                {pedidos.length}
              </span>{" "}
              pedidos
            </div>

            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFiltroEstado("todos");
                setFiltroFormaPago("todas");
                setFiltroEstadoPago("todos");
                setFiltroEntrega("todas");
                setFechaDesde("");
                setFechaHasta("");
              }}
              className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Cargando pedidos...
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-lg font-semibold text-slate-800">
                No hay pedidos
              </div>

              <p className="mt-2 text-sm text-slate-500">
                No encontramos pedidos para el estado
                seleccionado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosFiltrados.map((pedido) => (
                <button
                  key={pedido.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/comercio/pedidos/${pedido.id}`
                    )
                  }
                  className={`block w-full cursor-pointer rounded-2xl border border-l-4 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    pedido.estado === "nuevo"
                      ? "border-blue-200 border-l-blue-500 bg-blue-50/30"
                      : pedido.estado === "preparando"
                        ? "border-amber-200 border-l-amber-500 bg-amber-50/30"
                        : pedido.estado === "listo"
                          ? "border-violet-200 border-l-violet-500 bg-violet-50/30"
                          : pedido.estado === "en_envio"
                            ? "border-sky-200 border-l-sky-500 bg-sky-50/30"
                            : pedido.estado === "entregado"
                              ? "border-slate-300 border-l-green-500 bg-slate-200/70 text-slate-500"
                              : pedido.estado === "cancelado"
                                ? "border-red-200 border-l-red-500 bg-red-50/30"
                                : "border-slate-200 border-l-slate-400 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                          pedido.estado === "entregado"
                            ? "bg-green-100 text-green-700"
                            : pedido.estado === "en_envio"
                              ? "bg-blue-100 text-blue-700"
                              : pedido.estado === "listo"
                                ? "bg-violet-100 text-violet-700"
                                : pedido.estado === "preparando"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <ShoppingBag size={26} strokeWidth={2} />
                      </div>

                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          Pedido #{pedido.numero_pedido}
                        </span>

                        <span
                          className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${claseEstado(
                            pedido.estado
                          )}`}
                        >
                          {textoEstado(pedido.estado)}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        {pedido.usuario?.nombre_completo ||
                          pedido.nombre_receptor ||
                          "Usuario no identificado"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {formatoFecha(pedido.created_at)}
                      </div>
                    </div>
                  </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:w-[560px] lg:grid-cols-[220px_180px_120px_24px] lg:items-center">  <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            pedido.modalidad_entrega === "domicilio"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {pedido.modalidad_entrega === "domicilio" ? (
                            <MotoIcon size={22} />
                          ) : (
                            <Store size={22} strokeWidth={2} />
                          )}
                        </div>

                        <div>
                          <div className="text-xs text-slate-500">
                            Entrega
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-700">
                            {pedido.modalidad_entrega === "domicilio"
                              ? "A domicilio"
                              : "Retiro en comercio"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                          <CreditCard size={22} strokeWidth={2} />
                        </div>

                        <div>
                          <div className="text-xs text-slate-500">
                            Pago
                          </div>

                          <div className="mt-1 text-sm font-medium text-slate-700">
                            {pedido.forma_pago === "transferencia"
                              ? "Transferencia"
                              : pedido.forma_pago === "al_recibir"
                                ? "Al recibir"
                                : pedido.forma_pago || "-"}
                          </div>

                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
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

                      <div>
                        <div className="text-xs text-slate-500">
                          Total
                        </div>

                        <div className="mt-1 text-base font-bold text-slate-900">
                          {formatoPesos(
                            pedido.total_pesos
                          )}
                        </div>
                      </div>
                      <div className="hidden items-center justify-center text-slate-400 lg:flex">
                        <ChevronRight size={22} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}