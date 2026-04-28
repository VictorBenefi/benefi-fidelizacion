"use client";

import { useEffect, useState } from "react";
import CampaignPreview from "@/components/admin/CampaignPreview";

type Campania = {
  id?: string;
  nombre_campania?: string;
  slug?: string;
  portal_titulo?: string;
  portal_descripcion?: string;
  logo_comercio_url?: string;
  logo_benefi_url?: string;
  color_sidebar?: string;
  color_activo?: string;
  color_fondo?: string;
  powered_by_texto?: string;
  activa?: boolean;
};

const initialForm: Campania = {
  nombre_campania: "",
  slug: "",
  portal_titulo: "",
  portal_descripcion: "",
  logo_comercio_url: "",
  logo_benefi_url: "",
  color_sidebar: "#111827",
  color_activo: "#2563eb",
  color_fondo: "#f3f4f6",
  powered_by_texto: "Powered by BENEFI",
  activa: true,
};

export default function CampaniasClient() {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [form, setForm] = useState<Campania>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingComercio, setUploadingComercio] = useState(false);
  const [uploadingBenefi, setUploadingBenefi] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/campanias");
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error al cargar campañas");
        return;
      }

      setCampanias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las campañas");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit() {
    try {
      setLoading(true);

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/campanias/${editingId}`
        : "/api/admin/campanias";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Error al guardar");
        return;
      }

      setForm(initialForm);
      setEditingId(null);
      await fetchData();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(campania: Campania) {
    setForm({
      nombre_campania: campania.nombre_campania || "",
      slug: campania.slug || "",
      portal_titulo: campania.portal_titulo || "",
      portal_descripcion: campania.portal_descripcion || "",
      logo_comercio_url: campania.logo_comercio_url || "",
      logo_benefi_url: campania.logo_benefi_url || "",
      color_sidebar: campania.color_sidebar || "#111827",
      color_activo: campania.color_activo || "#2563eb",
      color_fondo: campania.color_fondo || "#f3f4f6",
      powered_by_texto: campania.powered_by_texto || "Powered by BENEFI",
      activa: campania.activa ?? true,
    });

    setEditingId(campania.id || null);
  }

  function handleCancelEdit() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleUploadLogo(
    event: React.ChangeEvent<HTMLInputElement>,
    type: "comercio" | "benefi"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!form.slug || form.slug.trim() === "") {
      alert("Primero completá el slug de la campaña antes de subir imágenes.");
      event.target.value = "";
      return;
    }

    try {
      if (type === "comercio") setUploadingComercio(true);
      if (type === "benefi") setUploadingBenefi(true);

      const payload = new FormData();
      payload.append("file", file);
      payload.append("type", type);
      payload.append("slug", form.slug || "sin-slug");

      const res = await fetch("/api/admin/campanias/upload-logo", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "No se pudo subir el archivo");
        return;
      }

      if (type === "comercio") {
        setForm((prev) => ({
          ...prev,
          logo_comercio_url: data.publicUrl,
        }));
      }

      if (type === "benefi") {
        setForm((prev) => ({
          ...prev,
          logo_benefi_url: data.publicUrl,
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al subir el logo");
    } finally {
      if (type === "comercio") setUploadingComercio(false);
      if (type === "benefi") setUploadingBenefi(false);
      event.target.value = "";
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Campañas</h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Administrá campañas de branding y configuración white-label.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingId ? "Editar campaña" : "Nueva campaña"}
                </h2>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Nombre campaña
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="Ej: Club Diez"
                      value={form.nombre_campania || ""}
                      onChange={(e) =>
                        setForm({ ...form, nombre_campania: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Slug
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="Ej: club-diez"
                      value={form.slug || ""}
                      onChange={(e) =>
                        setForm({ ...form, slug: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Portal título
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="Ej: Portal del Comercio"
                      value={form.portal_titulo || ""}
                      onChange={(e) =>
                        setForm({ ...form, portal_titulo: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Powered by texto
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="Ej: Powered by BENEFI"
                      value={form.powered_by_texto || ""}
                      onChange={(e) =>
                        setForm({ ...form, powered_by_texto: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Logo comercio URL
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="https://... o /logo-comercio.png"
                      value={form.logo_comercio_url || ""}
                      onChange={(e) =>
                        setForm({ ...form, logo_comercio_url: e.target.value })
                      }
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50">
                        {uploadingComercio ? "Subiendo..." : "Subir logo comercio"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadLogo(e, "comercio")}
                          disabled={uploadingComercio}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Logo BENEFI URL
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="https://... o /benefi-logo-blanco.png"
                      value={form.logo_benefi_url || ""}
                      onChange={(e) =>
                        setForm({ ...form, logo_benefi_url: e.target.value })
                      }
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50">
                        {uploadingBenefi ? "Subiendo..." : "Subir logo BENEFI"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadLogo(e, "benefi")}
                          disabled={uploadingBenefi}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Color sidebar
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="#111827"
                      value={form.color_sidebar || ""}
                      onChange={(e) =>
                        setForm({ ...form, color_sidebar: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Color activo
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="#2563eb"
                      value={form.color_activo || ""}
                      onChange={(e) =>
                        setForm({ ...form, color_activo: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-medium text-slate-700">
                      Color fondo
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                      placeholder="#f3f4f6"
                      value={form.color_fondo || ""}
                      onChange={(e) =>
                        setForm({ ...form, color_fondo: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!form.activa}
                        onChange={(e) =>
                          setForm({ ...form, activa: e.target.checked })
                        }
                      />
                      Campaña activa
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Portal descripción
                  </label>
                  <textarea
                    className="min-h-[130px] w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    placeholder="Descripción que verá el comercio en el portal"
                    value={form.portal_descripcion || ""}
                    onChange={(e) =>
                      setForm({ ...form, portal_descripcion: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-base font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loading
                      ? "Guardando..."
                      : editingId
                      ? "Actualizar campaña"
                      : "Crear campaña"}
                  </button>

                  {editingId && (
                    <button
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">
            Vista previa
          </h3>

          <CampaignPreview campaign={form} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-slate-900">
              Listado de campañas
            </h2>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="min-w-full text-base">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="pb-3 pr-4 font-semibold">Nombre</th>
                  <th className="pb-3 pr-4 font-semibold">Slug</th>
                  <th className="pb-3 pr-4 font-semibold">Activa</th>
                  <th className="pb-3 pr-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campanias.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-slate-500">
                      No hay campañas cargadas.
                    </td>
                  </tr>
                ) : (
                  campanias.map((campania) => (
                    <tr
                      key={campania.id}
                      className="border-b border-slate-100 text-slate-800"
                    >
                      <td className="py-4 pr-4">{campania.nombre_campania}</td>
                      <td className="py-4 pr-4">{campania.slug}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            campania.activa
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {campania.activa ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => handleEdit(campania)}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}