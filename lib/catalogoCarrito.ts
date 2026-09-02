export type CarritoItem = {
  producto_id: string;
  comercio_id: string;
  nombre: string;
  imagen_url: string;
  cantidad: number;
  observacion: string | null;
  precio_pesos: number;
  precio_puntos: number;
};

const STORAGE_KEY = "benefi_catalogo_carrito";

export function obtenerCarrito(): CarritoItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const guardado = localStorage.getItem(STORAGE_KEY);

    if (!guardado) {
      return [];
    }

    const data = JSON.parse(guardado);

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function guardarCarrito(items: CarritoItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  );
}

export function agregarAlCarrito(item: CarritoItem) {
  const carrito = obtenerCarrito();

  /*
   * Si es el mismo producto pero tiene una observación diferente,
   * lo conservamos como otro ítem.
   *
   * Ejemplo:
   * Hamburguesa x1 - Sin mayonesa
   * Hamburguesa x1 - Sin cebolla
   */
  const existente = carrito.findIndex(
    (actual) =>
      actual.producto_id === item.producto_id &&
      actual.comercio_id === item.comercio_id &&
      (actual.observacion || "") ===
        (item.observacion || "")
  );

  if (existente >= 0) {
    carrito[existente] = {
      ...carrito[existente],
      cantidad:
        carrito[existente].cantidad + item.cantidad,
    };
  } else {
    carrito.push(item);
  }

  guardarCarrito(carrito);

  return carrito;
}