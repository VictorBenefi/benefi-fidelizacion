"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { agregarAlCarrito } from "@/lib/catalogoCarrito";

type Categoria = {
  id: string;
  nombre: string;
};

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria_id?: string | null;
  imagen_url: string;
  precio_pesos: number;
  precio_puntos: number;
  tipo_producto: string;
  controla_stock: boolean;
  stock?: number | null;
  requiere_preparacion: boolean;
  tiempo_preparacion_minutos?: number | null;
  destacado: boolean;
  activo: boolean;
};

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();

  const comercioId = params.comercioId as string;
  const productoId = params.productoId as string;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [observacion, setObservacion] = useState("");
  const [mensajeCarrito, setMensajeCarrito] = useState("");
  const confirmacionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!comercioId || !productoId) return;

    async function cargarProducto() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/catalogo/${comercioId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(
            data?.error || "No se pudo cargar el producto."
          );
          return;
        }

        const productos = Array.isArray(data?.productos)
          ? data.productos
          : [];

        const categorias: Categoria[] = Array.isArray(
          data?.categorias
        )
          ? data.categorias
          : [];

        const productoEncontrado = productos.find(
          (item: Producto) => item.id === productoId
        );

        if (!productoEncontrado) {
          setError("El producto no está disponible.");
          return;
        }

        setProducto(productoEncontrado);

        const categoriaEncontrada = categorias.find(
          (item) =>
            item.id === productoEncontrado.categoria_id
        );

        setCategoria(categoriaEncontrada?.nombre || "");
      } catch (error) {
        console.error(error);
        setError(
          "Ocurrió un error al cargar el producto."
        );
      } finally {
        setLoading(false);
      }
    }

    cargarProducto();
  }, [comercioId, productoId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
          Cargando producto...
        </div>
      </main>
    );
  }

  if (error || !producto) {
    return (
      <main className="min-h-screen bg-slate-50 p-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
            {error || "Producto no disponible."}
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/usuarios/${comercioId}/catalogo`
              )
            }
            className="mt-4 cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
          >
            Volver al catálogo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/usuarios/${comercioId}/catalogo`
            )
          }
          className="mb-4 cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          ← Volver al catálogo
        </button>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex min-h-[320px] items-center justify-center bg-white p-4 sm:min-h-[420px] sm:p-8">
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="max-h-[430px] w-full object-contain"
              />
            </div>

            <div className="flex flex-col p-5 sm:p-8">
              {categoria && (
                <div className="text-xs font-bold uppercase tracking-wide text-[#C1121F]">
                  {categoria}
                </div>
              )}

              <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
                {producto.nombre}
              </h1>

              <p className="mt-4 text-base leading-7 text-slate-600">
                {producto.descripcion ||
                  "Sin descripción disponible."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Precio
                  </div>

                  <div className="mt-1 text-2xl font-black text-slate-900">
                    $
                    {Number(
                      producto.precio_pesos
                    ).toLocaleString("es-AR")}
                  </div>
                </div>

                <div className="rounded-2xl bg-red-50 p-4 text-right">
                  <div className="text-xs font-semibold text-red-600">
                    Puntos
                  </div>

                  <div className="mt-1 text-2xl font-black text-[#C1121F]">
                    {Number(
                      producto.precio_puntos
                    ).toLocaleString("es-AR")}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {producto.requiere_preparacion &&
                  producto.tiempo_preparacion_minutos && (
                    <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                      Preparación:{" "}
                      {producto.tiempo_preparacion_minutos} min
                    </span>
                  )}

                {producto.controla_stock && (
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Stock disponible: {producto.stock ?? 0}
                  </span>
                )}
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="space-y-5">
                    <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Cantidad
                    </label>

                    <div className="flex items-center gap-3">
                        <button
                        type="button"
                        onClick={() =>
                            setCantidad((prev) => Math.max(1, prev - 1))
                        }
                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-lg font-bold text-slate-700 transition hover:bg-slate-100"
                        >
                        −
                        </button>

                        <div className="min-w-[52px] text-center text-xl font-black text-slate-900">
                        {cantidad}
                        </div>

                        <button
                        type="button"
                        onClick={() =>
                            setCantidad((prev) => {
                                if (
                                producto.controla_stock &&
                                producto.stock !== null &&
                                producto.stock !== undefined
                                ) {
                                return Math.min(prev + 1, producto.stock);
                                }

                                return prev + 1;
                            })
                            }
                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-lg font-bold text-slate-700 transition hover:bg-slate-100"
                        >
                        +
                        </button>
                    </div>
                    </div>

                    {producto.tipo_producto === "gastronomia" && (
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Indicaciones para este producto
                        </label>

                        <textarea
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        rows={3}
                        maxLength={250}
                        placeholder="Ej: sin mayonesa, poco aderezo, sin cebolla..."
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        />

                        <div className="mt-1 text-right text-xs text-slate-400">
                        {observacion.length}/250
                        </div>
                    </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-500">
                        Subtotal
                        </div>

                        <div className="mt-1 text-xl font-black text-slate-900">
                        $
                        {(
                            Number(producto.precio_pesos) * cantidad
                        ).toLocaleString("es-AR")}
                        </div>
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4 text-right">
                        <div className="text-xs font-semibold text-red-600">
                        En puntos
                        </div>

                        <div className="mt-1 text-xl font-black text-[#C1121F]">
                        {(
                            Number(producto.precio_puntos) * cantidad
                        ).toLocaleString("es-AR")}
                        </div>
                    </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        agregarAlCarrito({
                          producto_id: producto.id,
                          comercio_id: comercioId,
                          nombre: producto.nombre,
                          imagen_url: producto.imagen_url,
                          cantidad,
                          observacion: observacion.trim() || null,
                          precio_pesos: Number(producto.precio_pesos),
                          precio_puntos: Number(producto.precio_puntos),
                        });

                        setMensajeCarrito("Producto agregado al pedido.");

                        setTimeout(() => {
                          confirmacionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 100);
                      }}
                      className={`w-full cursor-pointer rounded-xl px-5 py-4 text-base font-bold text-white transition-all duration-200 ${
                        mensajeCarrito
                          ? "bg-[#8F0D17]"
                          : "bg-[#C1121F] hover:bg-[#A8101B]"
                      }`}
                    >
                      {mensajeCarrito ? "✓ Agregado al pedido" : "Agregar al pedido"}
                    </button>
                    
                    {mensajeCarrito && (
                      <div
                        ref={confirmacionRef}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700"
                      >
                        {mensajeCarrito}
                      </div>
                    )}
                    

                    {mensajeCarrito && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                        type="button"
                        onClick={() =>
                            router.push(`/usuarios/${comercioId}/catalogo`)
                        }
                        className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                        Seguir comprando
                        </button>

                        <button
                        type="button"
                        onClick={() =>
                            router.push(`/usuarios/${comercioId}/catalogo/carrito`)
                        }
                        className="w-full cursor-pointer rounded-xl border border-[#1E3A5F] bg-white px-5 py-3 font-semibold text-[#1E3A5F] transition hover:bg-slate-50"
                        >
                        Ver pedido
                        </button>
                    </div>
                    )}
                </div>
                </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}