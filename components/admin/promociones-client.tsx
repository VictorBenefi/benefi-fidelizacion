"use client";

import { useEffect, useMemo, useState } from "react";

type Comercio = {
  id: string;
  nombre_fantasia?: string | null;
  razon_social?: string | null;
  email?: string | null;
};

type Promocion = {
  id?: string;
  comercio_id?: string | null;
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
  created_at?: string | null;
};

type FormPromocion = {
  comercio_id: string;
  nombre: string;
  tipo: string;
  valor: string;
  aplica_a: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  suma_puntos_en_descarga: boolean;
  cada_monto: string;
  puntos_por_tramo: string;
};

const initialForm: FormPromocion = {
  comercio_id: "",
  nombre: "",
  tipo: "porcentaje",
  valor: "",
  aplica_a: "general",
  fecha_inicio: "",
  fecha_fin: "",
  activa: true,
  suma_puntos_en_descarga: false,
  cada_monto: "",
  puntos_por_tramo: "",
};

const aplicaAOptions = [
  { value: "general", label: "General" },
  { value: "producto", label: "Producto" },
  { value: "marca", label: "Marca" },
];

function getComercioNombre(comercio: Comercio) {
  return (
    comercio.nombre_fantasia ||
    comercio.razon_social ||
    comercio.email ||
    `Comercio ${String(comercio.id).slice(0, 8)}`
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value;
}

function getTipoLabel(tipo?: string | null) {
  if (tipo === "porcentaje") return "Porcentaje";
  if (tipo === "tramo") return "Tramo";
  if (tipo === "puntos_fijos") return "Puntos fijos";
  return tipo || "-";
}

function getAplicaALabel(value?: string | null) {
  if (!value) return "-";
  const found = aplicaAOptions.find((item) => item.value === value);
  return found?.label || value;
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

export default function PromocionesClient() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [comercioFiltro, setComercioFiltro] = useState("");
  const [form, setForm] = useState<FormPromocion>(initialForm);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"ok" | "error" | "">("");

  const esPorcentaje = form.tipo === "porcentaje";
  const esTramo = form.tipo === "tramo";
  const esPuntosFijos = form.tipo === "puntos_fijos";

  function mostrarMensaje(texto: string, tipo: "ok" | "error") {
    setMensaje(texto);
    setMensajeTipo(tipo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function fetchData() {
    try {
      setLoading(true);

      const [promosRes, comerciosRes] = await Promise.all([
        fetch("/api/admin/promociones"),
        fetch("/api/admin/comercios"),
      ]);

      const promosData = await promosRes.json();
      const comerciosData = await comerciosRes.json();

      if (!promosRes.ok) {
        mostrarMensaje(promosData?.error || "Error al cargar promociones", "error");
        return;
      }

      if (!comerciosRes.ok) {
        mostrarMensaje(comerciosData?.error || "Error al cargar comercios", "error");
        return;
      }

      setPromociones(Array.isArray(promosData) ? promosData : []);
      setComercios(Array.isArray(comerciosData) ? comerciosData : []);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Ocurrió un error al cargar la información", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function setField(field: keyof FormPromocion, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleTipoChange(tipo: string) {
    setForm((prev) => ({
      ...prev,
      tipo,
      valor: tipo === "tramo" ? "" : prev.valor,
      cada_monto: tipo === "tramo" ? prev.cada_monto : "",
      puntos_por_tramo: tipo === "tramo" ? prev.puntos_por_tramo : "",
      suma_puntos_en_descarga: tipo === "tramo" ? prev.suma_puntos_en_descarga : false,
    }));
  }

  function handleEdit(promocion: Promocion) {
    setForm({
      comercio_id: promocion.comercio_id || "",
      nombre: promocion.nombre || "",
      tipo: promocion.tipo || "porcentaje",
      valor: promocion.valor != null ? String(promocion.valor) : "",
      aplica_a: promocion.aplica_a || "general",
      fecha_inicio: promocion.fecha_inicio || "",
      fecha_fin: promocion.fecha_fin || "",
      activa: promocion.activa ?? true,
      suma_puntos_en_descarga: promocion.suma_puntos_en_descarga ?? false,
      cada_monto: promocion.cada_monto != null ? String(promocion.cada_monto) : "",
      puntos_por_tramo:
        promocion.puntos_por_tramo != null ? String(promocion.puntos_por_tramo) : "",
    });
    setEditingId(promocion.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    try {
      if (!form.comercio_id) {
        mostrarMensaje("Seleccioná un comercio.", "error");
        return;
      }

      if (!form.nombre.trim()) {
        mostrarMensaje("Completá el nombre de la promoción.", "error");
        return;
      }

      if (!form.aplica_a) {
        mostrarMensaje("Seleccioná dónde aplica la promoción.", "error");
        return;
      }

      if (!form.fecha_inicio || !form.fecha_fin) {
        mostrarMensaje("Completá fecha de inicio y fin.", "error");
        return;
      }

      if ((esPorcentaje || esPuntosFijos) && form.valor === "") {
        mostrarMensaje("Completá el valor de la promoción.", "error");
        return;
      }

      if (esTramo && (form.cada_monto === "" || form.puntos_por_tramo === "")) {
        mostrarMensaje("Para promociones por tramo completá 'Cada monto' y 'Puntos por tramo'.", "error");
        return;
      }

      setSaving(true);

      const payload = {
        comercio_id: form.comercio_id,
        nombre: form.nombre,
        tipo: form.tipo,
        valor: esTramo ? null : form.valor === "" ? null : Number(form.valor),
        aplica_a: form.aplica_a,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        activa: !!form.activa,
        suma_puntos_en_descarga: esTramo ? !!form.suma_puntos_en_descarga : false,
        cada_monto: esTramo && form.cada_monto !== "" ? Number(form.cada_monto) : null,
        puntos_por_tramo:
          esTramo && form.puntos_por_tramo !== "" ? Number(form.puntos_por_tramo) : null,
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/promociones/${editingId}`
        : "/api/admin/promociones";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarMensaje(data?.error || "No se pudo guardar la promoción", "error");
        return;
      }

      await fetchData();
      resetForm();
      mostrarMensaje(editingId ? "Promoción actualizada correctamente" : "Promoción creada correctamente", "ok");
    } catch (error) {
      console.error(error);
      mostrarMensaje("Ocurrió un error al guardar la promoción", "error");
    } finally {
      setSaving(false);
    }
  }


  async function toggleActiva(id: string, activa: boolean) {
    const confirmar = window.confirm(
      `¿Seguro que querés ${activa ? "desactivar" : "activar"} esta promoción?`
    );
    if (!confirmar) return;

    try {
      const promoActual = promociones.find((p) => p.id === id);
      if (!promoActual) {
        mostrarMensaje("No se encontró la promoción", "error");
        return;
      }

      const payload = {
        comercio_id: promoActual.comercio_id,
        nombre: promoActual.nombre || null,
        tipo: promoActual.tipo || null,
        valor: promoActual.valor ?? null,
        aplica_a: promoActual.aplica_a || null,
        fecha_inicio: promoActual.fecha_inicio || null,
        fecha_fin: promoActual.fecha_fin || null,
        activa: !activa,
        suma_puntos_en_descarga: promoActual.suma_puntos_en_descarga ?? false,
        cada_monto: promoActual.cada_monto ?? null,
        puntos_por_tramo: promoActual.puntos_por_tramo ?? null,
      };

      const res = await fetch(`/api/admin/promociones/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarMensaje(data?.error || "Error al actualizar estado", "error");
        return;
      }

      await fetchData();
      mostrarMensaje(`Promoción ${activa ? "desactivada" : "activada"} correctamente`, "ok");
    } catch (error) {
      console.error(error);
      mostrarMensaje("Ocurrió un error al actualizar la promoción", "error");
    }
  }

  async function eliminarPromocion(id: string) {
    const confirmar = window.confirm("¿Seguro que querés eliminar esta promoción?");
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/admin/promociones/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarMensaje(data?.error || "Error al eliminar", "error");
        return;
      }

      await fetchData();
      mostrarMensaje("Promoción eliminada correctamente", "ok");
    } catch (error) {
      console.error(error);
      mostrarMensaje("Ocurrió un error al eliminar la promoción", "error");
    }
  }

  const promocionesFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();

    return promociones.filter((promo) => {
      const text = [
        promo.nombre,
        promo.tipo,
        promo.aplica_a,
        promo.comercio_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !q || text.includes(q);
      const matchComercio = !comercioFiltro || promo.comercio_id === comercioFiltro;

      return matchSearch && matchComercio;
    });
  }, [promociones, search, comercioFiltro]);

  const comercioMap = useMemo(() => {
    return new Map(comercios.map((c) => [c.id, getComercioNombre(c)]));
  }, [comercios]);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Promociones</h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Creá promociones por comercio y definí claramente qué beneficio podrá aplicar el comercio en la operación.
          </p>
        </div>

        {mensaje && (
          <div
            className={`sticky top-4 z-20 rounded-2xl border px-4 py-3 text-base font-medium shadow-sm ${
              mensajeTipo === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-semibold text-slate-900">
                {editingId ? "Editar promoción" : "Nueva promoción"}
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Elegí primero el tipo de promoción. El formulario mostrará solo los campos necesarios para ese caso.
              </p>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Comercio
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.comercio_id}
                    onChange={(e) => setField("comercio_id", e.target.value)}
                  >
                    <option value="">Seleccionar comercio</option>
                    {comercios.map((comercio) => (
                      <option key={comercio.id} value={comercio.id}>
                        {getComercioNombre(comercio)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Nombre
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.nombre}
                    onChange={(e) => setField("nombre", e.target.value)}
                    placeholder="Ej: 10% sobre compra"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Tipo de promoción
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.tipo}
                    onChange={(e) => handleTipoChange(e.target.value)}
                  >
                    <option value="porcentaje">Porcentaje</option>
                    <option value="tramo">Tramo</option>
                    <option value="puntos_fijos">Puntos fijos</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Aplica a
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.aplica_a}
                    onChange={(e) => setField("aplica_a", e.target.value)}
                  >
                    {aplicaAOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-slate-500">
                    Este campo usa valores válidos de base para evitar errores al guardar.
                  </p>
                </div>

                {(esPorcentaje || esPuntosFijos) && (
                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      {esPorcentaje ? "Valor (%)" : "Puntos fijos"}
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      value={form.valor}
                      onChange={(e) => setField("valor", e.target.value)}
                      placeholder={esPorcentaje ? "Ej: 10" : "Ej: 10"}
                    />
                    <p className="mt-2 text-sm text-slate-500">
                      {esPorcentaje
                        ? "Ingresá solo el número. Ejemplo: 10 = 10%."
                        : "Ingresá la cantidad fija de puntos que sumará cada operación."}
                    </p>
                  </div>
                )}

                {esTramo && (
                  <>
                    <div>
                      <label className="mb-2 block text-base font-medium text-slate-700">
                        Cada monto ($)
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                        value={form.cada_monto}
                        onChange={(e) => setField("cada_monto", e.target.value)}
                        placeholder="Ej: 1000"
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        Ejemplo: por cada $1000 se activa un tramo.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-base font-medium text-slate-700">
                        Puntos por tramo
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                        value={form.puntos_por_tramo}
                        onChange={(e) => setField("puntos_por_tramo", e.target.value)}
                        placeholder="Ej: 10"
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        Ejemplo: si cada tramo es $1000 y puntos por tramo es 10, una compra de $3000 suma 30 puntos.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="inline-flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!form.suma_puntos_en_descarga}
                          onChange={(e) =>
                            setField("suma_puntos_en_descarga", e.target.checked)
                          }
                        />
                        Suma puntos en descarga
                      </label>
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.fecha_inicio}
                    onChange={(e) => setField("fecha_inicio", e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.fecha_fin}
                    onChange={(e) => setField("fecha_fin", e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.activa}
                      onChange={(e) => setField("activa", e.target.checked)}
                    />
                    Promoción activa
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Cómo se interpreta esta promoción
                </div>
                <div className="mt-2 text-base leading-7 text-slate-700">
                  {esPorcentaje &&
                    "Promoción por porcentaje: el comercio aplicará un porcentaje sobre la operación. Solo requiere el campo Valor (%)."}

                  {esTramo &&
                    "Promoción por tramo: el beneficio se calcula por escalones. Requiere Cada monto y Puntos por tramo."}

                  {esPuntosFijos &&
                    "Promoción de puntos fijos: cada operación sumará una cantidad fija de puntos definida en el campo Puntos fijos."}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-base font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving
                    ? "Guardando..."
                    : editingId
                    ? "Actualizar promoción"
                    : "Crear promoción"}
                </button>

                {editingId && (
                  <button
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base font-medium text-slate-500">Promociones</div>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {promociones.length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base font-medium text-slate-500">Promociones activas</div>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {promociones.filter((p) => p.activa).length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base font-medium text-slate-500">Comercios con promos</div>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {new Set(promociones.map((p) => p.comercio_id).filter(Boolean)).size}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-base font-medium text-slate-700">
                Buscar promoción
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, tipo o aplica a..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-base font-medium text-slate-700">
                Filtrar por comercio
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                value={comercioFiltro}
                onChange={(e) => setComercioFiltro(e.target.value)}
              >
                <option value="">Todos los comercios</option>
                {comercios.map((comercio) => (
                  <option key={comercio.id} value={comercio.id}>
                    {getComercioNombre(comercio)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-slate-900">
              Listado de promociones
            </h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto overflow-x-auto p-6">
            {loading ? (
              <div className="py-10 text-base text-slate-500">Cargando promociones...</div>
            ) : promocionesFiltradas.length === 0 ? (
              <div className="py-10 text-base text-slate-500">
                No se encontraron promociones.
              </div>
            ) : (
              <table className="min-w-full text-base">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-3 pr-4 font-semibold">Comercio</th>
                    <th className="pb-3 pr-4 font-semibold">Nombre</th>
                    <th className="pb-3 pr-4 font-semibold">Tipo</th>
                    <th className="pb-3 pr-4 font-semibold">Aplica a</th>
                    <th className="pb-3 pr-4 font-semibold">Valor</th>
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
                      <td className="py-4 pr-4">
                        {promo.comercio_id ? comercioMap.get(promo.comercio_id) || promo.comercio_id : "-"}
                      </td>
                      <td className="py-4 pr-4">{promo.nombre || "-"}</td>
                      <td className="py-4 pr-4">{getTipoLabel(promo.tipo)}</td>
                      <td className="py-4 pr-4">{getAplicaALabel(promo.aplica_a)}</td>
                      <td className="py-4 pr-4">
                        {promo.tipo === "tramo"
                          ? `${promo.puntos_por_tramo ?? "-"} pts cada $${promo.cada_monto ?? "-"}`
                          : promo.tipo === "puntos_fijos"
                          ? `${promo.valor ?? "-"} pts`
                          : promo.valor ?? "-"}
                      </td>
                      <td className="py-4 pr-4">
                        {formatDate(promo.fecha_inicio)} / {formatDate(promo.fecha_fin)}
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEdit(promo)}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => toggleActiva(promo.id!, !!promo.activa)}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {promo.activa ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            onClick={() => eliminarPromocion(promo.id!)}
                            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
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