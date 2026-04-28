"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ComercioSlugPage() {
  const params = useParams();
  const router = useRouter();
  const [mensaje, setMensaje] = useState("Cargando portal...");

  useEffect(() => {
    async function resolverSlug() {
      try {
        const slug = String(params?.slug || "").trim().toLowerCase();

        if (!slug) {
          setMensaje("Slug inválido");
          return;
        }

        const res = await fetch("/api/comercio/por-slug", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug }),
        });

        const data = await res.json();

        if (!res.ok || !data?.id) {
          setMensaje(data?.error || "No se encontró el comercio");
          return;
        }

        router.replace(`/usuarios/${data.id}`);
      } catch (error) {
        console.error(error);
        setMensaje("Ocurrió un error al abrir el portal");
      }
    }

    resolverSlug();
  }, [params, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          fontSize: 16,
          color: "#334155",
        }}
      >
        {mensaje}
      </div>
    </div>
  );
}