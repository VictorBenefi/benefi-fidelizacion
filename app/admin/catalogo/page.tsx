"use client";

import { useEffect, useMemo, useState } from "react";

type Comercio = {
  id: string;
  nombre_fantasia?: string | null;
  razon_social?: string | null;
};

type Producto = {
  id: string;
  comercio_id: string;
  categoria_id?: string | null;
  nombre: string;
  descripcion?: string | null;
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

type Categoria = {
  id: string;
  comercio_id: string;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  orden: number;
};

function nombreComercio(comercio: Comercio) {
  return (
    comercio.nombre_fantasia ||
    comercio.razon_social ||
    `Comercio ${comercio.id.slice(0, 8)}`
  );
}

export default function AdminCatalogoPage() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [comercioId, setComercioId] = useState("");
  const [loadingComercios, setLoadingComercios] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [search, setSearch] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
const [imagenPreview, setImagenPreview] = useState<string>("");
const [guardandoProducto, setGuardandoProducto] = useState(false);
const [editingProductoId, setEditingProductoId] = useState<string | null>(null);
const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
const [eliminandoProducto, setEliminandoProducto] = useState(false);
const [categorias, setCategorias] = useState<Categoria[]>([]);
const [mostrarCategoriaForm, setMostrarCategoriaForm] = useState(false);
const [categoriaNombre, setCategoriaNombre] = useState("");
const [categoriaDescripcion, setCategoriaDescripcion] = useState("");
const [guardandoCategoria, setGuardandoCategoria] = useState(false);
const [editingCategoriaId, setEditingCategoriaId] = useState<string | null>(null);
const [categoriaAEliminar, setCategoriaAEliminar] = useState<Categoria | null>(null);
const [eliminandoCategoria, setEliminandoCategoria] = useState(false);
const [productoForm, setProductoForm] = useState({
  nombre: "",
  descripcion: "",
  categoria_id: "",
  imagen_url: "",
  precio_pesos: "",
  precio_puntos: "",
  tipo_producto: "producto",
  controla_stock: false,
  stock: "",
  requiere_preparacion: false,
  tiempo_preparacion_minutos: "",
  destacado: false,
  activo: true,
});

  useEffect(() => {
    async function cargarComercios() {
      try {
        setLoadingComercios(true);

        const res = await fetch("/api/admin/comercios");
        const data = await res.json();

        if (!res.ok) {
          setMensaje(data?.error || "No se pudieron cargar los comercios.");
          return;
        }

        setComercios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setMensaje("Ocurrió un error al cargar los comercios.");
      } finally {
        setLoadingComercios(false);
      }
    }

    cargarComercios();
  }, []);

  useEffect(() => {
    if (!comercioId) {
      setProductos([]);
      return;
    }

    async function cargarProductos() {
      try {
        setLoadingProductos(true);
        setMensaje("");

        const res = await fetch(
          `/api/admin/catalogo/productos?comercio_id=${comercioId}`
        );

        const data = await res.json();

        if (!res.ok) {
          setMensaje(data?.error || "No se pudieron cargar los productos.");
          return;
        }

        setProductos(Array.isArray(data?.productos) ? data.productos : []);
      } catch (error) {
        console.error(error);
        setMensaje("Ocurrió un error al cargar los productos.");
      } finally {
        setLoadingProductos(false);
      }
    }

    cargarProductos();
  }, [comercioId]);

  useEffect(() => {
  if (!comercioId) {
    setCategorias([]);
    return;
  }

  async function cargarCategorias() {
    try {
      const res = await fetch(
        `/api/admin/catalogo/categorias?comercio_id=${comercioId}`
      );

      const data = await res.json();

      if (!res.ok) {
        setMensaje(
          data?.error || "No se pudieron cargar las categorías."
        );
        return;
      }

      setCategorias(
        Array.isArray(data?.categorias) ? data.categorias : []
      );
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al cargar las categorías.");
    }
  }

  cargarCategorias();
}, [comercioId]);

  const productosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return productos;

    return productos.filter((producto) => {
      return [
        producto.nombre,
        producto.descripcion,
        producto.tipo_producto,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [productos, search]);

  async function guardarProducto() {
  try {
    setMensaje("");

    if (!comercioId) {
      setMensaje("Seleccioná un comercio.");
      return;
    }

    if (!productoForm.nombre.trim()) {
      setMensaje("Completá el nombre del producto.");
      return;
    }

    if (!imagenArchivo && !productoForm.imagen_url) {
    setMensaje("Seleccioná una imagen para el producto.");
    return;
    }

    const precioPesos = Number(productoForm.precio_pesos);
    const precioPuntos = Number(productoForm.precio_puntos);

    if (!Number.isFinite(precioPesos) || precioPesos < 0) {
      setMensaje("Ingresá un precio en pesos válido.");
      return;
    }

    if (!Number.isFinite(precioPuntos) || precioPuntos < 0) {
      setMensaje("Ingresá un precio en puntos válido.");
      return;
    }

    setGuardandoProducto(true);

    let imagenUrlFinal = productoForm.imagen_url;

    if (imagenArchivo) {
    const imagenFormData = new FormData();
    imagenFormData.append("archivo", imagenArchivo);
    imagenFormData.append("comercio_id", comercioId);

    const imagenRes = await fetch(
        "/api/admin/catalogo/upload-imagen",
        {
        method: "POST",
        body: imagenFormData,
        }
    );

    const imagenData = await imagenRes.json();

    if (!imagenRes.ok) {
        setMensaje(
        imagenData?.error || "No se pudo subir la imagen."
        );
        return;
    }

    imagenUrlFinal = imagenData.imagen_url;
    }

    const res = await fetch(
  editingProductoId
    ? `/api/admin/catalogo/productos/${editingProductoId}`
    : "/api/admin/catalogo/productos",
  {
    method: editingProductoId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
      body: JSON.stringify({
        comercio_id: comercioId,
        categoria_id: productoForm.categoria_id || null,
        nombre: productoForm.nombre.trim(),
        descripcion: productoForm.descripcion.trim() || null,
        imagen_url: imagenUrlFinal,
        precio_pesos: precioPesos,
        precio_puntos: precioPuntos,
        tipo_producto: productoForm.tipo_producto,
        controla_stock: productoForm.controla_stock,
        stock: productoForm.controla_stock
          ? Number(productoForm.stock || 0)
          : null,
        requiere_preparacion:
          productoForm.tipo_producto === "gastronomia"
            ? productoForm.requiere_preparacion
            : false,
        tiempo_preparacion_minutos:
          productoForm.tipo_producto === "gastronomia" &&
          productoForm.requiere_preparacion
            ? Number(productoForm.tiempo_preparacion_minutos || 0)
            : null,
        destacado: productoForm.destacado,
        activo: productoForm.activo,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMensaje(
        data?.error || "No se pudo guardar el producto."
      );
      return;
    }

    if (editingProductoId) {
  setProductos((prev) =>
    prev.map((producto) =>
      producto.id === editingProductoId
        ? data.producto
        : producto
    )
  );
} else {
  setProductos((prev) => [data.producto, ...prev]);
}

    setProductoForm({
      nombre: "",
      descripcion: "",
      categoria_id: "",
      imagen_url: "",
      precio_pesos: "",
      precio_puntos: "",
      tipo_producto: "producto",
      controla_stock: false,
      stock: "",
      requiere_preparacion: false,
      tiempo_preparacion_minutos: "",
      destacado: false,
      activo: true,
    });

    setImagenArchivo(null);
    setImagenPreview("");
    setEditingProductoId(null);
    setMostrarFormulario(false);

    setMensaje("Producto guardado correctamente.");
  } catch (error) {
    console.error(error);
    setMensaje("Ocurrió un error al guardar el producto.");
  } finally {
    setGuardandoProducto(false);
  }
}

function editarProducto(producto: Producto) {
  setEditingProductoId(producto.id);

  setProductoForm({
    nombre: producto.nombre || "",
    descripcion: producto.descripcion || "",
     categoria_id: producto.categoria_id || "",
    imagen_url: producto.imagen_url || "",
    precio_pesos: String(producto.precio_pesos ?? ""),
    precio_puntos: String(producto.precio_puntos ?? ""),
    tipo_producto: producto.tipo_producto || "producto",
    controla_stock: !!producto.controla_stock,
    stock:
      producto.stock !== null && producto.stock !== undefined
        ? String(producto.stock)
        : "",
    requiere_preparacion: !!producto.requiere_preparacion,
    tiempo_preparacion_minutos:
    producto.tiempo_preparacion_minutos !== null &&
    producto.tiempo_preparacion_minutos !== undefined
        ? String(producto.tiempo_preparacion_minutos)
        : "",
        destacado: !!producto.destacado,
        activo: !!producto.activo,
    });

  setImagenArchivo(null);
  setImagenPreview(producto.imagen_url || "");
  setMostrarFormulario(true);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
function solicitarEliminarProducto(producto: Producto) {
  setProductoAEliminar(producto);
}

async function confirmarEliminarProducto() {
  if (!productoAEliminar) return;

  try {
    setEliminandoProducto(true);
    setMensaje("");

    const res = await fetch(
      `/api/admin/catalogo/productos/${productoAEliminar.id}`,
      {
        method: "DELETE",
      }
    );

    let data: any = {};

    const textoRespuesta = await res.text();

    if (textoRespuesta) {
      try {
        data = JSON.parse(textoRespuesta);
      } catch {
        data = {};
      }
    }

    if (!res.ok) {
      setMensaje(
        data?.error || "No se pudo eliminar el producto."
      );
      return;
    }

    setProductos((prev) =>
      prev.filter(
        (item) => item.id !== productoAEliminar.id
      )
    );

    setProductoAEliminar(null);
    setMensaje("Producto eliminado correctamente.");
  } catch (error) {
    console.error(error);
    setMensaje("Ocurrió un error al eliminar el producto.");
  } finally {
    setEliminandoProducto(false);
  }
}

async function guardarCategoria() {
  try {
    setMensaje("");

    if (!comercioId) {
      setMensaje("Seleccioná un comercio.");
      return;
    }

    if (!categoriaNombre.trim()) {
      setMensaje("Completá el nombre de la categoría.");
      return;
    }

    setGuardandoCategoria(true);

    const res = await fetch(
      editingCategoriaId
        ? `/api/admin/catalogo/categorias/${editingCategoriaId}`
        : "/api/admin/catalogo/categorias",
      {
        method: editingCategoriaId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comercio_id: comercioId,
          nombre: categoriaNombre.trim(),
          descripcion: categoriaDescripcion.trim() || null,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setMensaje(
        data?.error ||
          (editingCategoriaId
            ? "No se pudo actualizar la categoría."
            : "No se pudo crear la categoría.")
      );
      return;
    }

    if (editingCategoriaId) {
      setCategorias((prev) =>
        prev.map((categoria) =>
          categoria.id === editingCategoriaId
            ? data.categoria
            : categoria
        )
      );
    } else {
      setCategorias((prev) => [...prev, data.categoria]);
    }

    setCategoriaNombre("");
    setCategoriaDescripcion("");
    setEditingCategoriaId(null);
    setMostrarCategoriaForm(false);

    setMensaje(
      editingCategoriaId
        ? "Categoría actualizada correctamente."
        : "Categoría creada correctamente."
    );
  } catch (error) {
    console.error(error);
    setMensaje("Ocurrió un error al guardar la categoría.");
  } finally {
    setGuardandoCategoria(false);
  }
}


function editarCategoria(categoria: Categoria) {
  setEditingCategoriaId(categoria.id);
  setCategoriaNombre(categoria.nombre || "");
  setCategoriaDescripcion(categoria.descripcion || "");
  setMostrarCategoriaForm(true);
}

function solicitarEliminarCategoria(categoria: Categoria) {
  setCategoriaAEliminar(categoria);
}

async function confirmarEliminarCategoria() {
  if (!categoriaAEliminar) return;

  try {
    setEliminandoCategoria(true);
    setMensaje("");

    const res = await fetch(
      `/api/admin/catalogo/categorias/${categoriaAEliminar.id}`,
      {
        method: "DELETE",
      }
    );

    let data: any = {};

    const textoRespuesta = await res.text();

    if (textoRespuesta) {
      try {
        data = JSON.parse(textoRespuesta);
      } catch {
        data = {};
      }
    }

    if (!res.ok) {
      setMensaje(
        data?.error || "No se pudo eliminar la categoría."
      );
      return;
    }

    setCategorias((prev) =>
      prev.filter(
        (categoria) => categoria.id !== categoriaAEliminar.id
      )
    );

    setCategoriaAEliminar(null);
    setMensaje("Categoría eliminada correctamente.");
  } catch (error) {
    console.error(error);
    setMensaje("Ocurrió un error al eliminar la categoría.");
  } finally {
    setEliminandoCategoria(false);
  }
}

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Catálogo de productos
          </h1>

          <p className="mt-2 text-base text-slate-600">
            Administrá los productos disponibles para cada comercio.
          </p>
        </div>

        {mensaje && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {mensaje}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-base font-semibold text-slate-700">
            Comercio
          </label>

          <select
            value={comercioId}
            onChange={(e) => setComercioId(e.target.value)}
            disabled={loadingComercios}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
          >
            <option value="">
              {loadingComercios
                ? "Cargando comercios..."
                : "Seleccionar comercio"}
            </option>

            {comercios.map((comercio) => (
              <option key={comercio.id} value={comercio.id}>
                {nombreComercio(comercio)}
              </option>
            ))}
          </select>
        </div>

        {comercioId && (
          <>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                    Categorías
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Organizá los productos del catálogo por categorías.
                </p>
                </div>

                <button
                type="button"
                onClick={() => setMostrarCategoriaForm(true)}
                className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                + Nueva categoría
                </button>
            </div>

            {mostrarCategoriaForm && (
                <div className="border-b border-slate-200 bg-slate-50 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre
                    </label>

                    <input
                        value={categoriaNombre}
                        onChange={(e) => setCategoriaNombre(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ej: Hamburguesas"
                    />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Descripción
                    </label>

                    <input
                        value={categoriaDescripcion}
                        onChange={(e) =>
                        setCategoriaDescripcion(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ej: Hamburguesas y sandwiches"
                    />
                    </div>
                </div>

                <div className="mt-4 flex gap-3">
                    <button
                    type="button"
                    onClick={guardarCategoria}
                    disabled={guardandoCategoria}
                    className="cursor-pointer rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    {guardandoCategoria
                        ? "Guardando..."
                        : "Guardar categoría"}
                    </button>

                    <button
                    type="button"
                    onClick={() => setMostrarCategoriaForm(false)}
                    disabled={guardandoCategoria}
                    className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                    >
                    Cancelar
                    </button>
                </div>
                </div>
            )}

            <div className="p-6">
                {categorias.length === 0 ? (
                    <div className="text-sm text-slate-500">
                    No hay categorías cargadas para este comercio.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                    {categorias.map((categoria) => (
                        <div
                        key={categoria.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                        <div className="font-semibold text-slate-900">
                            {categoria.nombre}
                        </div>

                        {categoria.descripcion && (
                            <div className="mt-1 text-xs text-slate-500">
                            {categoria.descripcion}
                            </div>
                        )}

                        <div className="mt-3 flex gap-2">
                            <button
                                type="button"
                                onClick={() => editarCategoria(categoria)}
                                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                onClick={() => solicitarEliminarCategoria(categoria)}
                                className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            >
                                Eliminar
                            </button>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase text-slate-500">
                  Productos
                </div>

                <div className="mt-2 text-4xl font-black text-[#C1121F]">
                  {productos.length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase text-slate-500">
                  Activos
                </div>

                <div className="mt-2 text-4xl font-black text-[#C1121F]">
                  {productos.filter((p) => p.activo).length}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase text-slate-500">
                  Destacados
                </div>

                <div className="mt-2 text-4xl font-black text-[#C1121F]">
                  {productos.filter((p) => p.destacado).length}
                </div>
              </div>
             
            </div>
            

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-base font-medium text-slate-700">
                Buscar producto
              </label>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, descripción o tipo..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Productos
                </h2>

                <button
                    type="button"
                    onClick={() => setMostrarFormulario(true)}
                    className="cursor-pointer rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                    + Nuevo producto
                </button>
              </div>

              {mostrarFormulario && (
                <div className="border-b border-slate-200 bg-slate-50 p-6">
                    <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">
                        Nuevo producto
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                        Cargá la información principal del producto.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setMostrarFormulario(false)}
                        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                    >
                        Cerrar
                    </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre
                        </label>

                        <input
                        value={productoForm.nombre}
                        onChange={(e) =>
                            setProductoForm((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ej: Hamburguesa completa"
                        />
                    </div>

                    <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Categoría
                    </label>

                    <select
                        value={productoForm.categoria_id}
                        onChange={(e) =>
                        setProductoForm((prev) => ({
                            ...prev,
                            categoria_id: e.target.value,
                        }))
                        }
                        className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3"
                    >
                        <option value="">Sin categoría</option>

                        {categorias
                        .filter((categoria) => categoria.activa)
                        .map((categoria) => (
                            <option
                            key={categoria.id}
                            value={categoria.id}
                            >
                            {categoria.nombre}
                            </option>
                        ))}
                    </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tipo de producto
                        </label>

                        <select
                        value={productoForm.tipo_producto}
                        onChange={(e) =>
                            setProductoForm((prev) => ({
                            ...prev,
                            tipo_producto: e.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                        >
                        <option value="producto">Producto</option>
                        <option value="gastronomia">Gastronomía</option>
                        <option value="servicio">Servicio</option>
                        <option value="beneficio">Beneficio</option>
                        <option value="digital">Digital</option>
                        </select>
                    </div>

                    {productoForm.tipo_producto === "gastronomia" && (
                    <>
                        <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={productoForm.requiere_preparacion}
                            onChange={(e) =>
                            setProductoForm((prev) => ({
                                ...prev,
                                requiere_preparacion: e.target.checked,
                                tiempo_preparacion_minutos: e.target.checked
                                ? prev.tiempo_preparacion_minutos
                                : "",
                            }))
                            }
                            className="cursor-pointer"
                        />

                        <span className="text-sm font-medium text-slate-700">
                            Requiere preparación
                        </span>
                        </div>

                        {productoForm.requiere_preparacion && (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Tiempo estimado de preparación
                            </label>

                            <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={productoForm.tiempo_preparacion_minutos}
                                onChange={(e) =>
                                setProductoForm((prev) => ({
                                    ...prev,
                                    tiempo_preparacion_minutos: e.target.value,
                                }))
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20"
                                placeholder="Ej: 15"
                            />

                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                                minutos
                            </span>
                            </div>
                        </div>
                        )}
                    </>
                    )}

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Descripción
                        </label>

                        <textarea
                        value={productoForm.descripcion}
                        onChange={(e) =>
                            setProductoForm((prev) => ({
                            ...prev,
                            descripcion: e.target.value,
                            }))
                        }
                        className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Descripción del producto"
                        />
                    </div>

                    <div className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={productoForm.controla_stock}
    onChange={(e) =>
      setProductoForm((prev) => ({
        ...prev,
        controla_stock: e.target.checked,
        stock: e.target.checked ? prev.stock : "",
      }))
    }
    className="cursor-pointer"
  />

  <span className="text-sm font-medium text-slate-700">
    Controlar stock
  </span>
</div>

{productoForm.controla_stock && (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">
      Stock disponible
    </label>

    <input
    type="number"
    min="0"
    step="1"
    value={productoForm.stock}
    onChange={(e) =>
      setProductoForm((prev) => ({
        ...prev,
        stock: e.target.value,
      }))
    }
    onWheel={(e) => {
      e.currentTarget.blur();
    }}
    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
    placeholder="Ej: 50"
  />
  </div>
)}

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Imagen del producto
                        </label>

                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                            <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:w-44">
                                {imagenPreview ? (
                                <img
                                    src={imagenPreview}
                                    alt="Vista previa del producto"
                                    className="h-full w-full object-cover"
                                />
                                ) : (
                                <div className="px-4 text-center text-sm text-slate-400">
                                    Vista previa de la imagen
                                </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-700">
                                Imagen principal
                                </div>

                                <div className="mt-1 text-sm text-slate-500">
                                Seleccioná una imagen representativa del producto.
                                </div>

                                <label className="mt-4 inline-flex cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                Seleccionar imagen

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                    const archivo = e.target.files?.[0] || null;

                                    setImagenArchivo(archivo);

                                    if (archivo) {
                                        setImagenPreview(URL.createObjectURL(archivo));
                                    } else {
                                        setImagenPreview("");
                                    }
                                    }}
                                />
                                </label>

                                {imagenArchivo && (
                                <div className="mt-3 text-sm font-medium text-green-700">
                                    ✓ {imagenArchivo.name}
                                </div>
                                )}
                            </div>

                            </div>
                        </div>
                        </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Precio en pesos
                        </label>

                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                            $
                            </span>

                            <input
                            type="text"
                            inputMode="numeric"
                            value={
                                productoForm.precio_pesos
                                ? Number(
                                    productoForm.precio_pesos.replace(/\./g, "")
                                    ).toLocaleString("es-AR")
                                : ""
                            }
                            onChange={(e) => {
                                const soloNumeros = e.target.value.replace(/\D/g, "");

                                setProductoForm((prev) => ({
                                ...prev,
                                precio_pesos: soloNumeros,
                                }));
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4"
                            placeholder="16.000"
                            />
                        </div>
                        </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Precio en puntos
                        </label>

                        <input
                        type="number"
                        value={productoForm.precio_puntos}
                        onChange={(e) =>
                            setProductoForm((prev) => ({
                            ...prev,
                            precio_puntos: e.target.value,
                            }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                        placeholder="Ej: 9500"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                        type="checkbox"
                        checked={productoForm.destacado}
                        onChange={(e) =>
                            setProductoForm((prev) => ({
                            ...prev,
                            destacado: e.target.checked,
                            }))
                        }
                        />

                        <span className="text-sm font-medium text-slate-700">
                        Producto destacado
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                        type="checkbox"
                        checked={productoForm.activo}
                        onChange={(e) =>
                            setProductoForm((prev) => ({
                            ...prev,
                            activo: e.target.checked,
                            }))
                        }
                        />

                        <span className="text-sm font-medium text-slate-700">
                        Producto activo
                        </span>
                    </div>
                    </div>

                    <div className="mt-6">
                    <button
                        type="button"
                        onClick={guardarProducto}
                        disabled={guardandoProducto}
                        className="cursor-pointer rounded-xl bg-[#C1121F] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                        {guardandoProducto ? "Guardando..." : "Guardar producto"}
                    </button>
                    </div>
                </div>
                )}

              <div className="p-6">
                {loadingProductos ? (
                  <div className="py-10 text-slate-500">
                    Cargando productos...
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="py-10 text-slate-500">
                    No hay productos cargados para este comercio.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {productosFiltrados.map((producto) => (
                      <div
                        key={producto.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <img
                          src={producto.imagen_url}
                          alt={producto.nombre}
                          className="h-48 w-full bg-white object-contain p-2"
                        />

                        <div className="space-y-3 p-5">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {producto.nombre}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {producto.descripcion || "Sin descripción"}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm text-slate-500">
                                Precio
                              </div>

                              <div className="font-bold text-slate-900">
                                ${Number(producto.precio_pesos).toLocaleString(
                                  "es-AR"
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-slate-500">
                                Puntos
                              </div>

                              <div className="font-bold text-[#C1121F]">
                                {producto.precio_puntos.toLocaleString("es-AR")} pts
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                producto.activo
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {producto.activo ? "Activo" : "Inactivo"}
                            </span>

                            {producto.destacado && (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Destacado
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => editarProducto(producto)}
                                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                onClick={() => solicitarEliminarProducto(producto)}
                                className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                                Eliminar
                            </button>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {productoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4">
                <div className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Eliminar producto
                </div>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                ¿Eliminar este producto?
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                Vas a eliminar{" "}
                <strong>{productoAEliminar.nombre}</strong>.
                Esta acción no se puede deshacer.
                </p>
            </div>

            {productoAEliminar.imagen_url && (
                <div className="mb-5 flex justify-center">
                <img
                    src={productoAEliminar.imagen_url}
                    alt={productoAEliminar.nombre}
                    className="h-32 w-32 rounded-xl border border-slate-200 bg-white object-contain p-2"
                />
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                type="button"
                onClick={() => setProductoAEliminar(null)}
                disabled={eliminandoProducto}
                className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                Cancelar
                </button>

                <button
                type="button"
                onClick={confirmarEliminarProducto}
                disabled={eliminandoProducto}
                className="cursor-pointer rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                {eliminandoProducto
                    ? "Eliminando..."
                    : "Eliminar producto"}
                </button>
            </div>
            </div>
        </div>
        )}
        {categoriaAEliminar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-5">
                    <div className="text-sm font-semibold uppercase tracking-wide text-red-600">
                    Eliminar categoría
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    ¿Eliminar esta categoría?
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                    Vas a eliminar{" "}
                    <strong>{categoriaAEliminar.nombre}</strong>.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                    Si tiene productos asociados, el sistema no permitirá eliminarla.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                    type="button"
                    onClick={() => setCategoriaAEliminar(null)}
                    disabled={eliminandoCategoria}
                    className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    Cancelar
                    </button>

                    <button
                    type="button"
                    onClick={confirmarEliminarCategoria}
                    disabled={eliminandoCategoria}
                    className="cursor-pointer rounded-xl bg-[#C1121F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    {eliminandoCategoria
                        ? "Eliminando..."
                        : "Eliminar categoría"}
                    </button>
                </div>
                </div>
            </div>
            )}
    </div>
  );
}