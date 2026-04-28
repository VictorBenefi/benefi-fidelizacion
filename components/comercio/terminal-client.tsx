"use client";

import { useEffect, useState } from "react";

export default function TerminalClient() {
  const [dni, setDni] = useState("");
  const [monto, setMonto] = useState("");
  const [promociones, setPromociones] = useState<any[]>([]);
  const [promoSeleccionada, setPromoSeleccionada] = useState<any>(null);
  const [resultado, setResultado] = useState<number>(0);

  const comercio_id = "PONER_ID_COMERCIO_TEST"; // luego lo hacemos dinámico

useEffect(() => {
  fetch(`/api/comercio/promociones?comercio_id=${comercio_id}`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setPromociones(data);
        return;
      }

      if (Array.isArray(data.promociones)) {
        setPromociones(data.promociones);
        return;
      }

      setPromociones([]);
    });
}, []);

  function calcular() {
    if (!promoSeleccionada || !monto) return;

    const m = Number(monto);

    if (promoSeleccionada.tipo === "porcentaje") {
      setResultado((m * promoSeleccionada.valor) / 100);
    }

    if (promoSeleccionada.tipo === "tramo") {
      const tramos = Math.floor(m / promoSeleccionada.cada_monto);
      setResultado(tramos * promoSeleccionada.puntos_por_tramo);
    }

    if (promoSeleccionada.tipo === "puntos_fijos") {
      setResultado(promoSeleccionada.valor);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Terminal Comercio</h1>

      <input
        placeholder="DNI"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        className="w-full border p-3 rounded"
      />

      <input
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        className="w-full border p-3 rounded"
      />

      <select
        className="w-full border p-3 rounded"
        onChange={(e) => {
          const promo = promociones.find(p => p.id === e.target.value);
          setPromoSeleccionada(promo);
        }}
      >
        <option>Seleccionar promoción</option>
        {promociones.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

      <button
        onClick={calcular}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Calcular beneficio
      </button>

      {resultado > 0 && (
        <div className="text-xl font-bold">
          Resultado: {resultado} puntos
        </div>
      )}
    </div>
  );
}