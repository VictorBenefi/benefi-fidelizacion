"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerCarrito } from "@/lib/catalogoCarrito";


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
  tiempo_preparacion_minutos?: number | null;
  stock?: number | null;
  controla_stock?: boolean;
  destacado?: boolean;
};

export default function CatalogoUsuarioPage() {
  const params = useParams();
  const comercioId = params.comercioId as string;
  const router = useRouter();

  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
const [busqueda, setBusqueda] = useState("");
const [productos, setProductos] = useState<Producto[]>([]);
const [categorias, setCategorias] = useState<Categoria[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [cantidadCarrito, setCantidadCarrito] = useState(0);
const [nombreComercio, setNombreComercio] = useState("Catálogo");
const [colorActivo, setColorActivo] = useState("");
const [catalogoHabilitado, setCatalogoHabilitado] = useState<boolean | null>(null);

useEffect(() => {
  if (!comercioId) return;

  async function cargarCatalogo() {
    try {
    setLoading(true);
    setError("");

    const resConfiguracion = await fetch(
      `/api/admin/catalogo/configuracion?comercio_id=${comercioId}`,
      {
        cache: "no-store",
      }
    );

    const dataConfiguracion = await resConfiguracion.json();

    const habilitado =
      resConfiguracion.ok &&
      dataConfiguracion?.configuracion?.habilitado === true;

    setCatalogoHabilitado(habilitado);

    if (!habilitado) {
      setError("El catálogo no se encuentra disponible en este momento.");
      return;
    }

    const res = await fetch(`/api/catalogo/${comercioId}`);

      const data = await res.json();
      setNombreComercio(data.comercio?.nombre || "Catálogo");
      setColorActivo(data.comercio?.color_activo || "#1E3A5F");

      if (!res.ok) {
        setError(
          data?.error || "No se pudo cargar el catálogo."
        );
        return;
      }

      setCategorias(
        Array.isArray(data?.categorias)
          ? data.categorias
          : []
      );

      setProductos(
        Array.isArray(data?.productos)
          ? data.productos
          : []
      );
    } catch (error) {
      console.error(error);
      setError(
        "Ocurrió un error al cargar el catálogo."
      );
    } finally {
      setLoading(false);
    }
  }

  cargarCatalogo();
}, [comercioId]);

    useEffect(() => {
    if (!comercioId) return;

    const carrito = obtenerCarrito().filter(
        (item) => item.comercio_id === comercioId
    );

    const cantidad = carrito.reduce(
        (total, item) => total + item.cantidad,
        0
    );

    setCantidadCarrito(cantidad);
    }, [comercioId]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const categoriaProducto = categorias.find(
        (categoria) => categoria.id === producto.categoria_id
      );

      const nombreCategoria = categoriaProducto?.nombre || "";

      const coincideCategoria =
        categoriaActiva === "Todos" ||
        nombreCategoria === categoriaActiva;

      const coincideBusqueda =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        (producto.descripcion || "").toLowerCase().includes(texto) ||
        nombreCategoria.toLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categorias, categoriaActiva, busqueda]);

  if (catalogoHabilitado === false) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🛍️
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Catálogo no disponible
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            El catálogo de este comercio no se encuentra disponible en este momento.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(`/usuarios/${comercioId}/dashboard`)
            }
            className="mt-6 cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← Volver al portal
          </button>
        </div>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section
          className="overflow-hidden rounded-2xl px-5 py-6 text-white shadow-lg sm:rounded-3xl sm:px-8 sm:py-8"
          style={{ backgroundColor: colorActivo || "transparent", }}
        >
                  <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
              Catálogo
            </div>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              CAFE CENTRO
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              Elegí tus productos favoritos y consultá su valor en pesos y en
              puntos BENEFI.
            </p>
          </div>
        </section>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(`/usuarios/${comercioId}/dashboard`)
            }
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← Volver al portal
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(`/usuarios/${comercioId}/catalogo/carrito`)
            }
            className="cursor-pointer rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Mi pedido ({cantidadCarrito})
          </button>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Buscar productos
          </label>

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar hamburguesas, pizzas, bebidas..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
          />
        </section>

        <div className="mt-5 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2">
            {["Todos", ...categorias.map((categoria) => categoria.nombre)].map(
             (categoria) => {
              const activa = categoriaActiva === categoria;

              return (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => setCategoriaActiva(categoria)}
                  className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    activa
                      ? "bg-[#C1121F] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {categoria}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Productos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {productosFiltrados.length} productos disponibles
              </p>
            </div>
          </div>

            {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                Cargando catálogo...
            </div>
            ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center text-red-700">
                {error}
            </div>
            ) : productosFiltrados.length === 0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
              No encontramos productos para esta búsqueda.
            </div>
          ) : (

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {productosFiltrados.map((producto) => (
                <article
                  key={producto.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative bg-white">
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-52 w-full object-cover sm:h-56"
                    />

                    {producto.destacado && (
                      <div className="absolute left-4 top-4 rounded-full bg-[#C1121F] px-3 py-1.5 text-xs font-bold text-white shadow">
                        Destacado
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-[#C1121F]">
                      {categorias.find(
                        (categoria) => categoria.id === producto.categoria_id
                        )?.nombre || "Sin categoría"}
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {producto.nombre}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
                      {producto.descripcion}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">
                          Precio
                        </div>

                        <div className="mt-1 text-lg font-black text-slate-900">
                          $
                          {producto.precio_pesos.toLocaleString("es-AR")}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-red-50 p-3 text-right">
                        <div className="text-xs font-medium text-red-600">
                          Puntos
                        </div>

                        <div className="mt-1 text-lg font-black text-[#C1121F]">
                          {producto.precio_puntos.toLocaleString("es-AR")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {producto.tiempo_preparacion_minutos && (
                        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                          {producto.tiempo_preparacion_minutos} min
                        </span>
                      )}

                      {producto.controla_stock && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          Stock: {producto.stock ?? 0}
                        </span>
                      )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                            `/usuarios/${comercioId}/catalogo/${producto.id}`
                            )
                        }
                        className="mt-5 w-full cursor-pointer rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: colorActivo }}
                        >
                        Comprar
                        </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}