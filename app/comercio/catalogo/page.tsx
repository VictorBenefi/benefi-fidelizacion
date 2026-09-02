"use client";

import { useEffect, useState } from "react";
import CatalogoManager from "@/components/catalogo/CatalogoManager";

type CatalogoConfiguracion = {
  habilitado: boolean;
  gestion_modo: "benefi" | "comercio" | "ambos";
};

export default function ComercioCatalogoPage() {
  const [loading, setLoading] = useState(true);
  const [configuracion, setConfiguracion] =
  useState<CatalogoConfiguracion | null>(null);

    const [comercioId, setComercioId] = useState("");
    const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function cargarConfiguracion() {
      try {
        setLoading(true);
        setError("");

        const comercioActivoId =
        typeof window !== "undefined"
            ? localStorage.getItem("comercio_id") ||
            localStorage.getItem("current_comercio_id")
            : null;

        if (!comercioActivoId) {
          if (mounted) {
            setError("No se pudo identificar el comercio activo.");
          }
          return;
        }
        if (mounted) {
        setComercioId(comercioActivoId);
        }

        const res = await fetch(
        `/api/admin/catalogo/configuracion?comercio_id=${comercioActivoId}`,
        {
            cache: "no-store",
        }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error ||
              "No se pudo cargar la configuración del catálogo."
          );
        }

        if (mounted) {
          setConfiguracion(data?.configuracion || null);
        }
      } catch (error) {
        console.error(error);

        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el catálogo."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    cargarConfiguracion();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">
              Cargando catálogo...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!configuracion?.habilitado) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Catálogo
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              El catálogo no está habilitado para este comercio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (configuracion.gestion_modo === "benefi") {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Catálogo
            </h1>

            <p className="mt-2 text-sm text-amber-800">
              El catálogo de este comercio es administrado por BENEFI.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <CatalogoManager comercioId={comercioId} />;
}