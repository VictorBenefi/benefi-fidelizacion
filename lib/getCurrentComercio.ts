export function getCurrentComercioIdFromStorage() {
  if (typeof window === "undefined") return null;

  const comercioId = localStorage.getItem("comercio_id");
  const currentId = localStorage.getItem("current_comercio_id");

  /* Si ambos existen y son distintos, usar comercio_id */
  if (comercioId) {
    if (currentId && currentId !== comercioId) {
      localStorage.setItem("current_comercio_id", comercioId);
    }

    return comercioId;
  }

  return currentId;
}

export function setCurrentComercioId(comercioId: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("comercio_id", comercioId);
  localStorage.setItem("current_comercio_id", comercioId);
}

export function clearCurrentComercioId() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("comercio_id");
  localStorage.removeItem("current_comercio_id");
}

export async function getCurrentComercio() {
  if (typeof window === "undefined") return null;

  const comercioId = getCurrentComercioIdFromStorage();

  if (!comercioId) return null;

  try {
    const res = await fetch(`/api/comercio/me?comercio_id=${comercioId}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) return null;

    return data;
  } catch (error) {
    console.error("Error obteniendo comercio actual:", error);
    return null;
  }
}