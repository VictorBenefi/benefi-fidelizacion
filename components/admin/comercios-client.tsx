"use client";

import { useEffect, useMemo, useState } from "react";

type Comercio = Record<string, any>;
type Campania = Record<string, any>;

type CategoriaCatalogo = {
  id: string;
  nombre: string;
  activa?: boolean;
};

type ConfigPuntosCategoria = {
  activa: boolean;
  tipo_generacion_puntos:
    | "porcentaje"
    | "tramo"
    | "puntos_fijos";
  valor_generacion_puntos: string;
  cada_monto_generacion_puntos: string;
  puntos_por_tramo_generacion: string;
};

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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [catalogoHabilitado, setCatalogoHabilitado] = useState(false);
  const [permitePagoAlRecibir, setPermitePagoAlRecibir] = useState(true);
  const [permiteTransferencia, setPermiteTransferencia] = useState(false);
  

  const [bancoTransferencia, setBancoTransferencia] = useState("");
  const [titularTransferencia, setTitularTransferencia] = useState("");
  const [cbuTransferencia, setCbuTransferencia] = useState("");
  const [aliasTransferencia, setAliasTransferencia] = useState("");
  const [
    cuitCuilTitularTransferencia,
    setCuitCuilTitularTransferencia,
  ] = useState("");

const [permiteCanjePuntos, setPermiteCanjePuntos] = useState(true);
const [generaPuntosConCanje, setGeneraPuntosConCanje] = useState(false);
const [modoGeneracionPuntos, setModoGeneracionPuntos] = useState<
  "ninguno" | "todo_catalogo" | "por_categoria"
>("ninguno");

const [tipoGeneracionPuntos, setTipoGeneracionPuntos] = useState<
  "porcentaje" | "tramo" | "puntos_fijos"
>("porcentaje");

const [valorGeneracionPuntos, setValorGeneracionPuntos] = useState("");
const [cadaMontoGeneracionPuntos, setCadaMontoGeneracionPuntos] = useState("");
const [puntosPorTramoGeneracion, setPuntosPorTramoGeneracion] = useState("");

const [categoriasCatalogo, setCategoriasCatalogo] = useState<
  CategoriaCatalogo[]
>([]);

const [puntosCategorias, setPuntosCategorias] = useState<
  Record<string, ConfigPuntosCategoria>
>({});

const [catalogoGestionModo, setCatalogoGestionModo] = useState<
  "benefi" | "comercio" | "ambos"
>("ambos");

const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
const [permiteRetiro, setPermiteRetiro] = useState(true);
const [permiteEnvioDomicilio, setPermiteEnvioDomicilio] = useState(false);
const [costoEnvio, setCostoEnvio] = useState("");
  
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

  setCatalogoHabilitado(false);
  setCatalogoGestionModo("ambos");

  setPermiteRetiro(true);
  setPermiteEnvioDomicilio(false);
  setCostoEnvio("0");

  setCategoriasCatalogo([]);
  setPuntosCategorias({});

  setMostrarFormulario(false);
}

  async function handleEdit(comercio: Comercio) {
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

  try {
    setCargandoCatalogo(true);

    const res = await fetch(
      `/api/admin/catalogo/configuracion?comercio_id=${comercio.id}`
    );

    const data = await res.json();

    if (res.ok && data?.configuracion) {
    setCatalogoHabilitado(!!data.configuracion.habilitado);

    setCatalogoGestionModo(
      data.configuracion.gestion_modo || "ambos"
    );

    setPermiteRetiro(
      data.configuracion.permite_retiro !== false
    );

    setPermiteEnvioDomicilio(
      !!data.configuracion.permite_envio_domicilio
    );

    setCostoEnvio(
      String(data.configuracion.costo_envio ?? 0)
    );

    setPermitePagoAlRecibir(
      data.configuracion.permite_pago_al_recibir !== false
    );

    setPermiteTransferencia(
      !!data.configuracion.permite_transferencia
    );

    setBancoTransferencia(
      data.configuracion.banco_transferencia || ""
    );

    setTitularTransferencia(
      data.configuracion.titular_transferencia || ""
    );

    setCbuTransferencia(
      data.configuracion.cbu_transferencia || ""
    );

    setAliasTransferencia(
      data.configuracion.alias_transferencia || ""
    );

    setCuitCuilTitularTransferencia(
      data.configuracion.cuit_cuil_titular_transferencia || ""
    );

    setPermiteCanjePuntos(
      data.configuracion.permite_canje_puntos !== false
    );

    setGeneraPuntosConCanje(
      !!data.configuracion.genera_puntos_con_canje
    );
    setModoGeneracionPuntos(
  data.configuracion.modo_generacion_puntos || "ninguno"
);

setTipoGeneracionPuntos(
  data.configuracion.tipo_generacion_puntos || "porcentaje"
);

setValorGeneracionPuntos(
  data.configuracion.valor_generacion_puntos != null
    ? String(data.configuracion.valor_generacion_puntos)
    : ""
);

setCadaMontoGeneracionPuntos(
  data.configuracion.cada_monto_generacion_puntos != null
    ? String(data.configuracion.cada_monto_generacion_puntos)
    : ""
);

setPuntosPorTramoGeneracion(
  data.configuracion.puntos_por_tramo_generacion != null
    ? String(data.configuracion.puntos_por_tramo_generacion)
    : ""
);
  } else {
  setCatalogoHabilitado(false);
  setCatalogoGestionModo("ambos");
  setPermiteRetiro(true);
  setPermiteEnvioDomicilio(false);
  setCostoEnvio("0");
  setPermitePagoAlRecibir(true);
  setPermiteTransferencia(false);
  setBancoTransferencia("");
  setTitularTransferencia("");
  setCbuTransferencia("");
  setAliasTransferencia("");
  setCuitCuilTitularTransferencia("");
  setPermiteCanjePuntos(true);
  setGeneraPuntosConCanje(false);
  }

  const [categoriasRes, puntosCategoriasRes] =
  await Promise.all([
    fetch(
      `/api/admin/catalogo/categorias?comercio_id=${comercio.id}`
    ),
    fetch(
      `/api/admin/catalogo/puntos-categorias?comercio_id=${comercio.id}`
    ),
  ]);

const categoriasData = await categoriasRes.json();
const puntosCategoriasData =
  await puntosCategoriasRes.json();

const categoriasCargadas =
  categoriasRes.ok &&
  Array.isArray(categoriasData?.categorias)
    ? categoriasData.categorias
    : [];

setCategoriasCatalogo(categoriasCargadas);

const configuracionesGuardadas =
  puntosCategoriasRes.ok &&
  Array.isArray(
    puntosCategoriasData?.configuraciones
  )
    ? puntosCategoriasData.configuraciones
    : [];

const mapaConfiguraciones: Record<
  string,
  ConfigPuntosCategoria
> = {};

categoriasCargadas.forEach(
  (categoria: CategoriaCatalogo) => {
    const guardada =
      configuracionesGuardadas.find(
        (config: any) =>
          config.categoria_id === categoria.id
      );

    mapaConfiguraciones[categoria.id] = {
      activa: guardada?.activa ?? false,

      tipo_generacion_puntos:
        guardada?.tipo_generacion_puntos ||
        "porcentaje",

      valor_generacion_puntos:
        guardada?.valor_generacion_puntos != null
          ? String(
              guardada.valor_generacion_puntos
            )
          : "",

      cada_monto_generacion_puntos:
        guardada?.cada_monto_generacion_puntos != null
          ? String(
              guardada.cada_monto_generacion_puntos
            )
          : "",

      puntos_por_tramo_generacion:
        guardada?.puntos_por_tramo_generacion != null
          ? String(
              guardada.puntos_por_tramo_generacion
            )
          : "",
    };
  }
);

setPuntosCategorias(mapaConfiguraciones);
  } catch (error) {
    console.error("Error cargando configuración de catálogo:", error);

    setCatalogoHabilitado(false);
    setCatalogoGestionModo("ambos");
    setPermiteRetiro(true);
    setPermiteEnvioDomicilio(false);
    setCostoEnvio("0");
    setPermitePagoAlRecibir(true);
    setPermiteTransferencia(false);
    setBancoTransferencia("");
    setTitularTransferencia("");
    setCbuTransferencia("");
    setAliasTransferencia("");
    setCuitCuilTitularTransferencia("");
    setPermiteCanjePuntos(true);
    setGeneraPuntosConCanje(false);

  } finally {
    setCargandoCatalogo(false);
  }

  setMostrarFormulario(true);
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

      const comercioIdGuardado = editingId || data?.id;

      if (comercioIdGuardado) {
        const catalogoRes = await fetch("/api/admin/catalogo/configuracion", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comercio_id: comercioIdGuardado,
            habilitado: catalogoHabilitado,
            gestion_modo: catalogoGestionModo,
            permite_retiro: permiteRetiro,
            permite_envio_domicilio: permiteEnvioDomicilio,
            costo_envio: Number(costoEnvio || 0),
            permite_pago_al_recibir: permitePagoAlRecibir,
            permite_transferencia: permiteTransferencia,

            banco_transferencia: bancoTransferencia,
            titular_transferencia: titularTransferencia,
            cbu_transferencia: cbuTransferencia,
            alias_transferencia: aliasTransferencia,
            cuit_cuil_titular_transferencia:
              cuitCuilTitularTransferencia,

            permite_canje_puntos: permiteCanjePuntos,
            genera_puntos_con_canje: generaPuntosConCanje,

            modo_generacion_puntos: modoGeneracionPuntos,
            tipo_generacion_puntos:
              modoGeneracionPuntos === "todo_catalogo"
                ? tipoGeneracionPuntos
                : null,

            valor_generacion_puntos:
              modoGeneracionPuntos === "todo_catalogo" &&
              tipoGeneracionPuntos !== "tramo" &&
              valorGeneracionPuntos !== ""
                ? Number(valorGeneracionPuntos)
                : null,

            cada_monto_generacion_puntos:
              modoGeneracionPuntos === "todo_catalogo" &&
              tipoGeneracionPuntos === "tramo" &&
              cadaMontoGeneracionPuntos !== ""
                ? Number(cadaMontoGeneracionPuntos)
                : null,

            puntos_por_tramo_generacion:
              modoGeneracionPuntos === "todo_catalogo" &&
              tipoGeneracionPuntos === "tramo" &&
              puntosPorTramoGeneracion !== ""
                ? Number(puntosPorTramoGeneracion)
                : null,
          }),
        });

        const catalogoData = await catalogoRes.json();

        if (!catalogoRes.ok) {
          setMensaje(
            catalogoData?.error ||
              "El comercio se guardó, pero no se pudo guardar la configuración del catálogo"
          );
          setMensajeTipo("error");
          return;
        }
        if (modoGeneracionPuntos === "por_categoria") {
          const categoriasAGuardar = categoriasCatalogo.filter(
            (categoria) => categoria.activa !== false
          );

          for (const categoria of categoriasAGuardar) {
            const config = puntosCategorias[categoria.id];

            if (!config) continue;

            const puntosCategoriaRes = await fetch(
              "/api/admin/catalogo/puntos-categorias",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  comercio_id: comercioIdGuardado,
                  categoria_id: categoria.id,
                  activa: config.activa,

                  tipo_generacion_puntos:
                    config.tipo_generacion_puntos,

                  valor_generacion_puntos:
                    config.tipo_generacion_puntos !== "tramo" &&
                    config.valor_generacion_puntos !== ""
                      ? Number(config.valor_generacion_puntos)
                      : null,

                  cada_monto_generacion_puntos:
                    config.tipo_generacion_puntos === "tramo" &&
                    config.cada_monto_generacion_puntos !== ""
                      ? Number(
                          config.cada_monto_generacion_puntos
                        )
                      : null,

                  puntos_por_tramo_generacion:
                    config.tipo_generacion_puntos === "tramo" &&
                    config.puntos_por_tramo_generacion !== ""
                      ? Number(
                          config.puntos_por_tramo_generacion
                        )
                      : null,
                }),
              }
            );

            const puntosCategoriaData =
              await puntosCategoriaRes.json();

            if (!puntosCategoriaRes.ok) {
              setMensaje(
                puntosCategoriaData?.error ||
                  `No se pudo guardar la configuración de puntos de ${categoria.nombre}`
              );
              setMensajeTipo("error");
              return;
            }
          }
        }
      }

      await fetchData();
      resetForm();

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
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Comercios</h1>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Creá comercios, editá sus datos, definí sus credenciales y copiales la URL del portal de usuarios para compartir registro o generar el QR más adelante.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (mostrarFormulario) {
                resetForm();
              }
              setMostrarFormulario((prev) => !prev);
            }}
            className="whitespace-nowrap rounded-xl bg-slate-950 px-5 py-3 text-base font-medium text-white hover:bg-slate-800"
          >
            {mostrarFormulario ? "Ocultar formulario" : "+ Nuevo comercio"}
          </button>
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

        {/* MÉTRICAS */}
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Comercios
        </div>

        <div className="mt-3 text-5xl font-black text-[#C1121F]">
          {comercios.length}
        </div>

        <div className="mt-2 text-sm text-slate-500">
          Comercios registrados
        </div>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl">
        🏪
      </div>
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Campañas activas
        </div>

        <div className="mt-3 text-5xl font-black text-[#C1121F]">
          {campaniasActivas}
        </div>

        <div className="mt-2 text-sm text-slate-500">
          Campañas disponibles
        </div>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl">
        🎁
      </div>
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Con campaña asignada
        </div>

        <div className="mt-3 text-5xl font-black text-[#C1121F]">
          {campaniasAsignadas}
        </div>

        <div className="mt-2 text-sm text-slate-500">
          Comercios configurados
        </div>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-3xl">
        ✅
      </div>
    </div>
  </div>
</div>

{/* FORMULARIO ALTA / EDICIÓN */}
{mostrarFormulario && (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-6 py-5">
      <h2 className="text-2xl font-semibold text-slate-900">
        {editingId ? "Editar comercio" : "Nuevo comercio"}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {editingId
          ? "Modificá los datos y accesos del comercio."
          : "Completá los datos para incorporar un nuevo comercio."}
      </p>
    </div>

    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-base font-medium text-slate-700">
            Nombre fantasía
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={form.nombre_fantasia}
            onChange={(e) =>
              setField("nombre_fantasia", e.target.value)
            }
            placeholder="Ej: Kiosco Centro"
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-medium text-slate-700">
            Razón social
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={form.razon_social}
            onChange={(e) =>
              setField("razon_social", e.target.value)
            }
            placeholder="Ej: Kiosco Centro SRL"
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-medium text-slate-700">
            Email de acceso
          </label>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={form.campaign_id}
            onChange={(e) =>
              setField("campaign_id", e.target.value)
            }
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
          <label className="inline-flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-700">
            <input
              type="checkbox"
              checked={!!form.activo}
              onChange={(e) =>
                setField("activo", e.target.checked)
              }
            />
            Comercio activo
          </label>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-base font-semibold text-slate-900">
                Catálogo de productos
              </div>

              <div className="mt-1 text-sm text-slate-500">
                Habilitá el catálogo para que este comercio pueda ofrecer productos,
                canjes y pedidos a sus usuarios.
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3 text-base text-slate-700">
              <input
                type="checkbox"
                checked={catalogoHabilitado}
                onChange={(e) => setCatalogoHabilitado(e.target.checked)}
                disabled={cargandoCatalogo}
              />

              Catálogo habilitado
            </label>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Administración del catálogo
              </label>

              <select
                value={catalogoGestionModo}
                onChange={(e) =>
                  setCatalogoGestionModo(
                    e.target.value as "benefi" | "comercio" | "ambos"
                  )
                }
                disabled={cargandoCatalogo || !catalogoHabilitado}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="benefi">BENEFI</option>
                <option value="comercio">Comercio</option>
                <option value="ambos">BENEFI y Comercio</option>
              </select>
            </div>

            <div className="mt-2 border-t border-slate-200 pt-5">
              <div className="text-sm font-semibold text-slate-900">
                Configuración de entrega
              </div>

              <div className="mt-4 space-y-4">
                <label className="flex cursor-pointer items-center gap-3 text-base text-slate-700">
                  <input
                    type="checkbox"
                    checked={permiteRetiro}
                    onChange={(e) => setPermiteRetiro(e.target.checked)}
                    disabled={cargandoCatalogo || !catalogoHabilitado}
                  />

                  Permitir retiro en el comercio
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-base text-slate-700">
                  <input
                    type="checkbox"
                    checked={permiteEnvioDomicilio}
                    onChange={(e) =>
                      setPermiteEnvioDomicilio(e.target.checked)
                    }
                    disabled={cargandoCatalogo || !catalogoHabilitado}
                  />

                  Permitir envío a domicilio
                </label>

                {permiteEnvioDomicilio && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Costo de envío
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                        $
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          costoEnvio
                            ? Number(
                                String(costoEnvio).replace(/\D/g, "")
                              ).toLocaleString("es-AR")
                            : ""
                        }
                        onChange={(e) => {
                          const soloNumeros = e.target.value.replace(/\D/g, "");
                          setCostoEnvio(soloNumeros);
                        }}
                        disabled={cargandoCatalogo || !catalogoHabilitado}
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="0"
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Ingresá 0 si el envío es sin cargo.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-sm font-semibold text-slate-900">
                Formas de pago
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Definí cómo puede pagar el usuario al realizar un pedido.
              </p>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={permitePagoAlRecibir}
                    onChange={(e) =>
                      setPermitePagoAlRecibir(e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer"
                  />

                  <span className="text-sm text-slate-700">
                    Permitir pago al recibir o retirar
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={permiteTransferencia}
                    onChange={(e) =>
                      setPermiteTransferencia(e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer"
                  />

                  <span className="text-sm text-slate-700">
                    Permitir transferencia bancaria
                  </span>
                </label>
              </div>

              {permiteTransferencia && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Banco
                    </label>

                    <input
                      type="text"
                      value={bancoTransferencia}
                      onChange={(e) =>
                        setBancoTransferencia(e.target.value)
                      }
                      placeholder="Ej. Banco Macro"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Titular de la cuenta
                    </label>

                    <input
                      type="text"
                      value={titularTransferencia}
                      onChange={(e) =>
                        setTitularTransferencia(e.target.value)
                      }
                      placeholder="Nombre o razón social"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      CBU
                    </label>

                    <input
                      type="text"
                      value={cbuTransferencia}
                      onChange={(e) =>
                        setCbuTransferencia(e.target.value)
                      }
                      placeholder="22 dígitos"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Alias
                    </label>

                    <input
                      type="text"
                      value={aliasTransferencia}
                      onChange={(e) =>
                        setAliasTransferencia(e.target.value)
                      }
                      placeholder="Ej. CAFE.CENTRO"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      CUIT / CUIL del titular
                    </label>

                    <input
                      type="text"
                      value={cuitCuilTitularTransferencia}
                      onChange={(e) =>
                        setCuitCuilTitularTransferencia(
                          e.target.value
                        )
                      }
                      placeholder="Ej. 30-12345678-9"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-sm font-semibold text-slate-900">
                Puntos y canjes
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Configurá cómo se utilizan y generan puntos en los pedidos.
              </p>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={permiteCanjePuntos}
                    onChange={(e) =>
                      setPermiteCanjePuntos(e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer"
                  />

                  <span className="text-sm text-slate-700">
                    Permitir canje de puntos en pedidos
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 ${
                    permiteCanjePuntos
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={generaPuntosConCanje}
                    disabled={!permiteCanjePuntos}
                    onChange={(e) =>
                      setGeneraPuntosConCanje(e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                  />

                  <span className="text-sm text-slate-700">
                    Generar puntos cuando el pedido incluye un canje
                  </span>
                </label>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="text-sm font-semibold text-slate-900">
                  Generación de puntos en pedidos
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Definí si las compras del catálogo generan puntos y cómo se calculan.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      modoGeneracionPuntos === "ninguno"
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modo_generacion_puntos"
                      value="ninguno"
                      checked={modoGeneracionPuntos === "ninguno"}
                      onChange={() => setModoGeneracionPuntos("ninguno")}
                      className="mr-2 cursor-pointer"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      No genera puntos
                    </span>
                  </label>

                  <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      modoGeneracionPuntos === "todo_catalogo"
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modo_generacion_puntos"
                      value="todo_catalogo"
                      checked={modoGeneracionPuntos === "todo_catalogo"}
                      onChange={() =>
                        setModoGeneracionPuntos("todo_catalogo")
                      }
                      className="mr-2 cursor-pointer"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      Todo el catálogo
                    </span>
                  </label>

                  <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      modoGeneracionPuntos === "por_categoria"
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modo_generacion_puntos"
                      value="por_categoria"
                      checked={modoGeneracionPuntos === "por_categoria"}
                      onChange={() =>
                        setModoGeneracionPuntos("por_categoria")
                      }
                      className="mr-2 cursor-pointer"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      Por categoría
                    </span>
                  </label>
                </div>

                {modoGeneracionPuntos === "todo_catalogo" && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tipo de beneficio
                    </label>

                    <select
                      value={tipoGeneracionPuntos}
                      onChange={(e) =>
                        setTipoGeneracionPuntos(
                          e.target.value as
                            | "porcentaje"
                            | "tramo"
                            | "puntos_fijos"
                        )
                      }
                      className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="porcentaje">
                        % de puntos por compra
                      </option>

                      <option value="tramo">
                        Puntos por cada $X de compra
                      </option>

                      <option value="puntos_fijos">
                        Puntos fijos por compra
                      </option>
                    </select>

                    {tipoGeneracionPuntos === "porcentaje" && (
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Porcentaje de puntos
                        </label>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorGeneracionPuntos}
                            onChange={(e) =>
                              setValorGeneracionPuntos(e.target.value)
                            }
                            placeholder="Ej. 10"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500"
                          />

                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                            %
                          </span>
                        </div>
                      </div>
                    )}

                    {tipoGeneracionPuntos === "tramo" && (
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Por cada monto de compra
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={cadaMontoGeneracionPuntos}
                            onChange={(e) =>
                              setCadaMontoGeneracionPuntos(e.target.value)
                            }
                            placeholder="Ej. 5000"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Puntos a generar
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={puntosPorTramoGeneracion}
                            onChange={(e) =>
                              setPuntosPorTramoGeneracion(e.target.value)
                            }
                            placeholder="Ej. 100"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {tipoGeneracionPuntos === "puntos_fijos" && (
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Puntos fijos por compra
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={valorGeneracionPuntos}
                          onChange={(e) =>
                            setValorGeneracionPuntos(e.target.value)
                          }
                          placeholder="Ej. 100"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {modoGeneracionPuntos === "por_categoria" && (
                  <div className="mt-5 space-y-4">
                    {categoriasCatalogo.filter(
                      (categoria) => categoria.activa !== false
                    ).length === 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Este comercio todavía no tiene categorías creadas en el catálogo.
                      </div>
                    ) : (
                      categoriasCatalogo
                        .filter((categoria) => categoria.activa !== false)
                        .map((categoria) => {
                          const config = puntosCategorias[categoria.id] || {
                            activa: false,
                            tipo_generacion_puntos: "porcentaje",
                            valor_generacion_puntos: "",
                            cada_monto_generacion_puntos: "",
                            puntos_por_tramo_generacion: "",
                          };

                          return (
                            <div
                              key={categoria.id}
                              className={`overflow-hidden rounded-2xl border-2 shadow-sm transition ${
                                config.activa
                                  ? "border-green-200 bg-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              <div
                                className={`border-b px-5 py-4 ${
                                    config.activa
                                      ? "border-emerald-200 bg-emerald-100"
                                      : "border-slate-300 bg-slate-100"
                                  }`}
                                >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-lg font-bold text-slate-900">
                                    {categoria.nombre}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    Configuración de puntos para esta categoría
                                  </div>
                                </div>

                                <label className="flex cursor-pointer items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={config.activa}
                                    onChange={(e) => {
                                      const activa = e.target.checked;

                                      setPuntosCategorias((prev) => ({
                                        ...prev,
                                        [categoria.id]: {
                                          ...config,
                                          activa,
                                        },
                                      }));
                                    }}
                                    className="h-4 w-4 cursor-pointer"
                                  />

                                  <span
                                    className={`text-sm font-semibold ${
                                      config.activa
                                        ? "text-green-700"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {config.activa
                                      ? "Genera puntos"
                                      : "No genera puntos"}
                                  </span>
                                  </label>
                              </div>
                            </div>


                              {config.activa && (
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Tipo de beneficio
                                  </label>

                                  <select
                                    value={config.tipo_generacion_puntos}
                                    onChange={(e) => {
                                      const tipo = e.target.value as
                                        | "porcentaje"
                                        | "tramo"
                                        | "puntos_fijos";

                                      setPuntosCategorias((prev) => ({
                                        ...prev,
                                        [categoria.id]: {
                                          ...config,
                                          tipo_generacion_puntos: tipo,
                                          valor_generacion_puntos: "",
                                          cada_monto_generacion_puntos: "",
                                          puntos_por_tramo_generacion: "",
                                        },
                                      }));
                                    }}
                                    className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 md:max-w-md"
                                  >
                                    <option value="porcentaje">
                                      % de puntos por compra
                                    </option>

                                    <option value="tramo">
                                      Puntos por cada $X de compra
                                    </option>

                                    <option value="puntos_fijos">
                                      Puntos fijos
                                    </option>
                                  </select>

                                  {config.tipo_generacion_puntos ===
                                    "porcentaje" && (
                                    <div className="mt-4 md:max-w-md">
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Porcentaje de puntos
                                      </label>

                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={
                                            config.valor_generacion_puntos
                                          }
                                          onChange={(e) => {
                                            const valor = e.target.value;

                                            setPuntosCategorias((prev) => ({
                                              ...prev,
                                              [categoria.id]: {
                                                ...config,
                                                valor_generacion_puntos:
                                                  valor,
                                              },
                                            }));
                                          }}
                                          placeholder="Ej. 20"
                                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500"
                                        />

                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {config.tipo_generacion_puntos ===
                                    "tramo" && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                      <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                          Por cada monto de compra
                                        </label>

                                        <input
                                          type="number"
                                          min="0"
                                          value={
                                            config.cada_monto_generacion_puntos
                                          }
                                          onChange={(e) => {
                                            const valor = e.target.value;

                                            setPuntosCategorias((prev) => ({
                                              ...prev,
                                              [categoria.id]: {
                                                ...config,
                                                cada_monto_generacion_puntos:
                                                  valor,
                                              },
                                            }));
                                          }}
                                          placeholder="Ej. 5000"
                                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                          Puntos a generar
                                        </label>

                                        <input
                                          type="number"
                                          min="0"
                                          value={
                                            config.puntos_por_tramo_generacion
                                          }
                                          onChange={(e) => {
                                            const valor = e.target.value;

                                            setPuntosCategorias((prev) => ({
                                              ...prev,
                                              [categoria.id]: {
                                                ...config,
                                                puntos_por_tramo_generacion:
                                                  valor,
                                              },
                                            }));
                                          }}
                                          placeholder="Ej. 100"
                                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {config.tipo_generacion_puntos ===
                                    "puntos_fijos" && (
                                    <div className="mt-4 md:max-w-md">
                                      <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Puntos fijos
                                      </label>

                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          config.valor_generacion_puntos
                                        }
                                        onChange={(e) => {
                                          const valor = e.target.value;

                                          setPuntosCategorias((prev) => ({
                                            ...prev,
                                            [categoria.id]: {
                                              ...config,
                                              valor_generacion_puntos:
                                                valor,
                                            },
                                          }));
                                        }}
                                        placeholder="Ej. 100"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                El costo de envío nunca genera puntos.
              </p>
            </div>

            {cargandoCatalogo && (
              <div className="text-sm text-slate-500">
                Cargando configuración del catálogo...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          URL de acceso del comercio
        </div>

        <div className="mt-2 font-medium text-slate-900">
          https://fidelizacion.benefi.com.ar/comercio/login
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={savingForm}
          className="rounded-xl bg-slate-950 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {savingForm
            ? "Guardando..."
            : editingId
              ? "Actualizar comercio"
              : "Crear comercio"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            disabled={savingForm}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  </div>
)}
        

        {/* BUSCADOR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-base font-medium text-slate-700">
            Buscar comercio
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, CUIT, slug o URL..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                        <div className="max-w-[280px] break-words text-sm leading-6 text-blue-700 underline">
                          {buildPortalUrl(comercio) || "-"}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <a
                            href={buildPortalUrl(comercio)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Abrir
                          </a>

                          <button
                            type="button"
                            onClick={() => copiarUrl(buildPortalUrl(comercio))}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Copiar
                          </button>

                          <button
                            type="button"
                            onClick={() => generarQR(buildPortalUrl(comercio))}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            QR
                          </button>

                          <a
                            href={buildComercioLoginUrl(comercio)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Login
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
                          className="min-w-[320px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"                        >
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
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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

    </div>
  );
}