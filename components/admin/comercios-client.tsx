"use client";

import { useEffect, useMemo, useState } from "react";

type Comercio = Record<string, any>;
type Campania = Record<string, any>;

type FormComercio = {
  nombre_fantasia: string;
  razon_social: string;
  email: string;
  telefono: string;
  cuit: string;
  slug: string;
  campaign_id: string;
  activo: boolean;
  password: string;
};

const initialForm: FormComercio = {
  nombre_fantasia: "",
  razon_social: "",
  email: "",
  telefono: "",
  cuit: "",
  slug: "",
  campaign_id: "",
  activo: true,
  password: "",
};

function getComercioNombre(comercio: Comercio) {
  return (
    comercio.nombre_fantasia ||
    comercio.nombre ||
    comercio.nombre_comercio ||
    comercio.razon_social ||
    comercio.comercio ||
    comercio.descripcion ||
    `Comercio ${String(comercio.id || "").slice(0, 8)}`
  );
}

function buildPortalUrl(comercio: any) {
  if (!comercio?.slug) return "";

  const base = "https://fidelizacion.benefi.com.ar";

  return `${base}/${comercio.slug}`;
}
function buildComercioLoginUrl(comercio: any) {
  if (!comercio?.slug) return "";

  const base = "https://fidelizacion.benefi.com.ar";
  return `${base}/${comercio.slug}/login`;
}

export default function ComerciosClient() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormComercio>(initialForm);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<"ok" | "error" | "">("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  
  async function fetchData() {
    try {
      setLoading(true);

      const [comerciosRes, campaniasRes] = await Promise.all([
        fetch("/api/admin/comercios"),
        fetch("/api/admin/campanias"),
      ]);

      const comerciosData = await comerciosRes.json();
      const campaniasData = await campaniasRes.json();

      if (!comerciosRes.ok) {
        setMensaje(comerciosData?.error || "Error al cargar comercios");
        setMensajeTipo("error");
        return;
      }

      if (!campaniasRes.ok) {
        setMensaje(campaniasData?.error || "Error al cargar campañas");
        setMensajeTipo("error");
        return;
      }

      setComercios(Array.isArray(comerciosData) ? comerciosData : []);
      setCampanias(
        Array.isArray(campaniasData)
          ? campaniasData.filter((c) => c.activa !== false)
          : []
      );
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al cargar la información");
      setMensajeTipo("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function setField<K extends keyof FormComercio>(field: K, value: FormComercio[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleEdit(comercio: Comercio) {
    setForm({
      nombre_fantasia: comercio.nombre_fantasia || "",
      razon_social: comercio.razon_social || "",
      email: comercio.email || "",
      telefono: comercio.telefono || "",
      cuit: comercio.cuit || "",
      slug: comercio.slug || "",
      campaign_id: comercio.campaign_id || "",
      activo: comercio.activo ?? true,
      password: comercio.password || "",
    });
    setEditingId(comercio.id || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    try {
      setMensaje("");
      setMensajeTipo("");

      if (!form.razon_social.trim() && !form.nombre_fantasia.trim()) {
        setMensaje("Completá al menos razón social o nombre fantasía.");
        setMensajeTipo("error");
        return;
      }

      if (!form.email.trim()) {
        setMensaje("Completá el email del comercio.");
        setMensajeTipo("error");
        return;
      }

      if (!editingId && !form.password.trim()) {
        setMensaje("Completá una contraseña inicial para el comercio.");
        setMensajeTipo("error");
        return;
      }

      setSavingForm(true);

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/comercios/${editingId}`
        : "/api/admin/comercios";

      const payload = {
        nombre_fantasia: form.nombre_fantasia || null,
        razon_social: form.razon_social || null,
        email: form.email || null,
        telefono: form.telefono || null,
        cuit: form.cuit || null,
        slug: form.slug || null,
        campaign_id: form.campaign_id || null,
        activo: !!form.activo,
        password: form.password || null,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data?.error || "No se pudo guardar el comercio");
        setMensajeTipo("error");
        return;
      }

      await fetchData();
      resetForm();
      setMensaje(editingId ? "Comercio actualizado correctamente" : "Comercio creado correctamente");
      setMensajeTipo("ok");
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al guardar el comercio");
      setMensajeTipo("error");
    } finally {
      setSavingForm(false);
    }
  }

  async function handleCampaignChange(comercioId: string, campaignId: string) {
    try {
      const comercioActual = comercios.find((c) => c.id === comercioId);
      if ((comercioActual?.campaign_id || "") === (campaignId || "")) return;

      setSavingId(comercioId);

      const res = await fetch(`/api/admin/comercios/${comercioId}/campaign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign_id: campaignId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data?.error || "No se pudo guardar la campaña");
        setMensajeTipo("error");
        return;
      }

      setComercios((prev) =>
        prev.map((comercio) =>
          comercio.id === comercioId
            ? { ...comercio, campaign_id: campaignId || null }
            : comercio
        )
      );

      setMensaje("Campaña asignada correctamente");
      setMensajeTipo("ok");
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error al guardar la asignación");
      setMensajeTipo("error");
    } finally {
      setSavingId(null);
    }
  }
  function generarQR(url: string) {
  const urlCompleta = url;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlCompleta)}`;
  setQrUrl(qr);
}

async function descargarQR() {
  try {
    if (!qrUrl) return;

    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "qr-comercio.png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(error);
    setMensaje("No se pudo descargar el QR");
    setMensajeTipo("error");
  }
}

async function copiarUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    setMensaje("URL copiada correctamente");
    setMensajeTipo("ok");
  } catch (error) {
    console.error(error);
    setMensaje("No se pudo copiar la URL");
    setMensajeTipo("error");
  }
}

  const filteredComercios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return comercios;

    return comercios.filter((comercio) => {
      const text = [
        getComercioNombre(comercio),
        comercio.email,
        comercio.telefono,
        comercio.cuit,
        comercio.slug,
        buildPortalUrl(comercio),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [comercios, search]);

  const campaniasActivas = campanias.length;
  const campaniasAsignadas = comercios.filter((c) => !!c.campaign_id).length;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Comercios</h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Creá comercios, editá sus datos, definí sus credenciales y copiales la URL del portal de usuarios para compartir registro o generar el QR más adelante.
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-2xl font-semibold text-slate-900">
                {editingId ? "Editar comercio" : "Nuevo comercio"}
              </h2>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Nombre fantasía
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.nombre_fantasia}
                    onChange={(e) => setField("nombre_fantasia", e.target.value)}
                    placeholder="Ej: Kiosco Centro"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Razón social
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.razon_social}
                    onChange={(e) => setField("razon_social", e.target.value)}
                    placeholder="Ej: Kiosco Centro SRL"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Email de acceso
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="Ej: comercio@email.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Contraseña inicial
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="Ej: comercio123"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.telefono}
                    onChange={(e) => setField("telefono", e.target.value)}
                    placeholder="Ej: 387xxxxxxx"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    CUIT
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.cuit}
                    onChange={(e) => setField("cuit", e.target.value)}
                    placeholder="Ej: 20-12345678-9"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Slug
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.slug}
                    onChange={(e) => setField("slug", e.target.value)}
                    placeholder="Ej: comercio-test"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Campaña asignada
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
                    value={form.campaign_id}
                    onChange={(e) => setField("campaign_id", e.target.value)}
                  >
                    <option value="">Sin campaña asignada</option>
                    {campanias.map((campania) => (
                      <option key={campania.id} value={campania.id}>
                        {campania.nombre_campania} ({campania.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.activo}
                      onChange={(e) => setField("activo", e.target.checked)}
                    />
                    Comercio activo
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  URL de acceso del comercio
                </div>
                <div className="mt-2 text-base font-medium text-slate-900">
                  /comercio/login
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={savingForm}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-base font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingForm
                    ? "Guardando..."
                    : editingId
                    ? "Actualizar comercio"
                    : "Crear comercio"}
                </button>

                {editingId && (
                  <button
                    onClick={resetForm}
                    disabled={savingForm}
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
              <div className="text-base font-medium text-slate-500">Comercios</div>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {comercios.length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base font-medium text-slate-500">
                Campañas activas
              </div>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {campaniasActivas}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base font-medium text-slate-500">
                Comercios con campaña asignada
              </div>
              <div className="mt-2 text-4xl font-bold text-slate-900">
                {campaniasAsignadas}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-base font-medium text-slate-700">
            Buscar comercio
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, CUIT, slug o URL..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-2xl font-semibold text-slate-900">
              Listado de comercios
            </h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto overflow-x-auto p-6">
            {loading ? (
              <div className="py-10 text-base text-slate-500">Cargando información...</div>
            ) : filteredComercios.length === 0 ? (
              <div className="py-10 text-base text-slate-500">
                No se encontraron comercios.
              </div>
            ) : (
              <table className="min-w-full text-base">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-3 pr-4 font-semibold">Comercio</th>
                    <th className="pb-3 pr-4 font-semibold">Email</th>
                    <th className="pb-3 pr-4 font-semibold">CUIT</th>
                    <th className="pb-3 pr-4 font-semibold">Portal usuarios</th>
                    <th className="pb-3 pr-4 font-semibold">Campaña asignada</th>
                    <th className="pb-3 pr-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComercios.map((comercio) => (
                    <tr
                      key={comercio.id}
                      className="border-b border-slate-100 align-top text-slate-800"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-medium text-slate-900">
                          {getComercioNombre(comercio)}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">
                            ID: {String(comercio.id)}
                          </span>

                          {comercio.campaign_id ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                              Campaña asignada
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
                              Sin campaña
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <div>{comercio.email || "-"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Login: /comercio/login
                        </div>
                      </td>

                      <td className="py-4 pr-4">{comercio.cuit || "-"}</td>

                      <td className="py-4 pr-4">
                        <div className="max-w-[320px] break-all text-sm text-slate-700">
                          {buildPortalUrl(comercio) || "-"}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={buildPortalUrl(comercio)}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Abrir
                          </a>
                          
                          <button
                            onClick={() => copiarUrl(buildPortalUrl(comercio))}
                            className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Copiar URL
                          </button>

                          <button
                            onClick={() => generarQR(buildPortalUrl(comercio))}
                            className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Ver QR
                          </button>
                            <a
                            href={buildComercioLoginUrl(comercio)}
                            target="_blank"
                            className="px-2 py-1 text-xs bg-blue-100 border rounded hover:bg-blue-200 text-center"
                          >
                            Login comercio
                          </a>
                        </div>
                      </td>

                      <td className="py-4 pr-4">
                        <select
                          value={comercio.campaign_id || ""}
                          onChange={(e) =>
                            handleCampaignChange(comercio.id, e.target.value)
                          }
                          disabled={savingId === comercio.id}
                          className="min-w-[260px] rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 disabled:bg-slate-100"
                        >
                          <option value="">Sin campaña asignada</option>
                          {campanias.map((campania) => (
                            <option key={campania.id} value={campania.id}>
                              {campania.nombre_campania} ({campania.slug}) {campania.activa ? "🟢" : ""}
                            </option>
                          ))}
                        </select>

                        {savingId === comercio.id && (
                          <div className="mt-2 text-sm text-slate-500">
                            Guardando asignación...
                          </div>
                        )}
                      </td>

                      <td className="py-4 pr-4">
                        <button
                          onClick={() => handleEdit(comercio)}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Editar
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
      {qrUrl && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="w-[340px] rounded-2xl bg-white p-6 text-center shadow-xl">
      
      <h2 className="mb-4 text-lg font-semibold">
        QR del comercio
      </h2>

      <img
        src={qrUrl}
        alt="QR"
        className="mx-auto mb-4"
      />

      <div className="flex justify-center gap-2">
        <button
          onClick={descargarQR}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Descargar
        </button>

        <button
          onClick={() => setQrUrl(null)}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cerrar
        </button>
      </div>

    </div>
  </div>
)}

)
    </div>
  );
}
