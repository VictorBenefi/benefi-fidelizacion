"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CarritoItem,
  guardarCarrito,
  obtenerCarrito,
} from "@/lib/catalogoCarrito";

export default function CarritoPage() {
  const params = useParams();
  const router = useRouter();

  const comercioId = params.comercioId as string;

  const [items, setItems] = useState<CarritoItem[]>([]);

  useEffect(() => {
    const carrito = obtenerCarrito().filter(
      (item) => item.comercio_id === comercioId
    );

    setItems(carrito);
  }, [comercioId]);

  const totalPesos = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.precio_pesos * item.cantidad,
        0
      ),
    [items]
  );

  const totalPuntos = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.precio_puntos * item.cantidad,
        0
      ),
    [items]
  );

  function actualizarCarrito(nuevosItems: CarritoItem[]) {
    const carritoCompleto = obtenerCarrito();

    const otrosComercios = carritoCompleto.filter(
      (item) => item.comercio_id !== comercioId
    );

    guardarCarrito([...otrosComercios, ...nuevosItems]);
    setItems(nuevosItems);
  }

  function cambiarCantidad(index: number, cambio: number) {
    const nuevosItems = [...items];

    const nuevaCantidad =
      nuevosItems[index].cantidad + cambio;

    if (nuevaCantidad < 1) {
      return;
    }

    nuevosItems[index] = {
      ...nuevosItems[index],
      cantidad: nuevaCantidad,
    };

    actualizarCarrito(nuevosItems);
  }

  function eliminarItem(index: number) {
    const nuevosItems = items.filter(
      (_, itemIndex) => itemIndex !== index
    );

    actualizarCarrito(nuevosItems);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() =>
            router.push(`/usuarios/${comercioId}/catalogo`)
          }
          className="mb-5 cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          ← Seguir comprando
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">
            Tu pedido
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Revisá los productos antes de continuar.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              Tu pedido está vacío
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Agregá productos desde el catálogo para comenzar.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(`/usuarios/${comercioId}/catalogo`)
              }
              className="mt-5 cursor-pointer rounded-xl bg-[#1E3A5F] px-5 py-3 font-semibold text-white"
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {items.map((item, index) => (
                <article
                  key={`${item.producto_id}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-28">
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-slate-900">
                        {item.nombre}
                      </h2>

                      <div className="mt-1 text-sm text-slate-500">
                        $
                        {item.precio_pesos.toLocaleString(
                          "es-AR"
                        )}{" "}
                        ·{" "}
                        {item.precio_puntos.toLocaleString(
                          "es-AR"
                        )}{" "}
                        pts
                      </div>

                      {item.observacion && (
                        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          <span className="font-semibold">
                            Indicación:
                          </span>{" "}
                          {item.observacion}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidad(index, -1)
                            }
                            className="h-9 w-9 cursor-pointer rounded-lg border border-slate-300 bg-white font-bold text-slate-700"
                          >
                            −
                          </button>

                          <div className="min-w-[35px] text-center font-bold text-slate-900">
                            {item.cantidad}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidad(index, 1)
                            }
                            className="h-9 w-9 cursor-pointer rounded-lg border border-slate-300 bg-white font-bold text-slate-700"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => eliminarItem(index)}
                          className="cursor-pointer text-sm font-semibold text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              <button
                type="button"
                onClick={() =>
                    router.push(`/usuarios/${comercioId}/catalogo`)
                }
                className="w-full cursor-pointer rounded-xl border border-dashed border-[#1E3A5F] bg-white px-5 py-4 text-sm font-bold text-[#1E3A5F] transition hover:bg-slate-50"
                >
                + Agregar otro producto
                </button>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
              <h2 className="text-xl font-bold text-slate-900">
                Resumen del pedido
              </h2>

              <div className="mt-5 space-y-3 border-b border-slate-200 pb-5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Productos</span>
                  <span>
                    {items.reduce(
                      (total, item) =>
                        total + item.cantidad,
                      0
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total en pesos</span>

                  <strong className="text-slate-900">
                    ${totalPesos.toLocaleString("es-AR")}
                  </strong>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total en puntos</span>

                  <strong className="text-[#C1121F]">
                    {totalPuntos.toLocaleString("es-AR")} pts
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                    router.push(`/usuarios/${comercioId}/catalogo/confirmar`)
                }
                className="mt-5 w-full cursor-pointer rounded-xl bg-[#C1121F] px-5 py-4 font-bold text-white transition hover:opacity-90"
                >
                Continuar pedido
                </button>

              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Todavía no se realizará ningún cobro ni canje de
                puntos.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}