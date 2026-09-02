"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  CarritoItem,
  obtenerCarrito,
} from "@/lib/catalogoCarrito";

export default function ConfirmarPedidoPage() {
  const params = useParams();
  const router = useRouter();

  const comercioId = params.comercioId as string;

  const [items, setItems] = useState<CarritoItem[]>([]);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [nombreRetira, setNombreRetira] = useState("");
  const [observacionGeneral, setObservacionGeneral] = useState("");
  const [modalidadEntrega, setModalidadEntrega] = useState<
  "retiro" | "domicilio"
>("retiro");

const [direccionEntrega, setDireccionEntrega] = useState("");
const [costoEnvio, setCostoEnvio] = useState(0);

const [permiteRetiro, setPermiteRetiro] = useState(true);
const [permiteEnvioDomicilio, setPermiteEnvioDomicilio] =
  useState(false);
const [formaPago, setFormaPago] = useState<
  "al_recibir" | "transferencia"
>("al_recibir");

const [permitePagoAlRecibir, setPermitePagoAlRecibir] =
  useState(true);

const [permiteTransferencia, setPermiteTransferencia] =
  useState(false);

const [bancoTransferencia, setBancoTransferencia] = useState("");
const [titularTransferencia, setTitularTransferencia] = useState("");
const [cbuTransferencia, setCbuTransferencia] = useState("");
const [aliasTransferencia, setAliasTransferencia] = useState("");
const [
  cuitCuilTitularTransferencia,
  setCuitCuilTitularTransferencia,
] = useState("");

const [saldoPuntos, setSaldoPuntos] = useState(0);
const [usarPuntos, setUsarPuntos] = useState(false);
const [puntosACanjear, setPuntosACanjear] = useState(0);
const [permiteCanjePuntos, setPermiteCanjePuntos] = useState(true);
const [generaPuntosConCanje, setGeneraPuntosConCanje] =
  useState(false);
const [cargandoEntrega, setCargandoEntrega] = useState(true);
const [guardandoPedido, setGuardandoPedido] = useState(false);
const [errorPedido, setErrorPedido] = useState("");

const [pedidoCreado, setPedidoCreado] = useState<{
  numero_pedido: number;
  total_pesos: number;
  total_puntos: number;
  puntos_canjeados: number;
  monto_canje_puntos: number;
  total_a_pagar_pesos: number;
  forma_pago: "al_recibir" | "transferencia";
} | null>(null);

  useEffect(() => {
    if (!comercioId) return;

    async function cargarUsuario() {
      try {
        setCargandoUsuario(true);

        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push(`/usuarios/${comercioId}`);
          return;
        }

        const { data: usuarioData, error: usuarioError } =
          await supabaseClient
            .from("usuarios")
            .select("id, nombre_completo")
            .eq("auth_user_id", user.id)
            .single();

        if (usuarioError || !usuarioData) {
          router.push(`/usuarios/${comercioId}`);
          return;
        }

        const { data: relacion, error: relacionError } =
          await supabaseClient
            .from("usuarios_comercios")
            .select("id")
            .eq("usuario_id", usuarioData.id)
            .eq("comercio_id", comercioId)
            .maybeSingle();

        if (relacionError || !relacion) {
          await supabaseClient.auth.signOut();
          router.push(`/usuarios/${comercioId}`);
          return;
        }

        setUsuarioId(usuarioData.id);

        const { data: movimientosSaldo, error: saldoError } =
          await supabaseClient
            .from("movimientos_puntos")
            .select("tipo, puntos, estado")
            .eq("usuario_id", usuarioData.id)
            .eq("comercio_id", comercioId);

        if (saldoError) {
          console.error("Error cargando saldo de puntos:", saldoError);
          setSaldoPuntos(0);
        } else {
          const saldoCalculado = (movimientosSaldo || [])
            .filter((movimiento: any) => movimiento.estado !== "anulado")
            .reduce((total: number, movimiento: any) => {
              const puntos = Number(movimiento.puntos || 0);

              if (movimiento.tipo === "carga") {
                return total + puntos;
              }

              if (movimiento.tipo === "canje") {
                return total - puntos;
              }

              if (movimiento.tipo === "reversion") {
                return total + puntos;
              }

              return total;
            }, 0);

          setSaldoPuntos(saldoCalculado);
        }

        if (usuarioData.nombre_completo) {
          setNombreRetira(usuarioData.nombre_completo);
        }
      } catch (error) {
        console.error("Error cargando usuario:", error);
        router.push(`/usuarios/${comercioId}`);
      } finally {
        setCargandoUsuario(false);
      }
    }

    cargarUsuario();
  }, [comercioId, router]);

  useEffect(() => {
    if (!comercioId) return;

    const carrito = obtenerCarrito().filter(
      (item) => item.comercio_id === comercioId
    );

    setItems(carrito);
  }, [comercioId]);

  useEffect(() => {
  if (!comercioId) return;

  async function cargarConfiguracionEntrega() {
    try {
      setCargandoEntrega(true);

      const res = await fetch(
        `/api/admin/catalogo/configuracion?comercio_id=${comercioId}`
      );

      const data = await res.json();

      if (!res.ok || !data?.configuracion) {
        return;
      }

      const configuracion = data.configuracion;

      const retiro =
        configuracion.permite_retiro !== false;

      const domicilio =
        !!configuracion.permite_envio_domicilio;

      setPermiteRetiro(retiro);
      setPermiteEnvioDomicilio(domicilio);
      setCostoEnvio(
        Number(configuracion.costo_envio || 0)
      );

      const pagoAlRecibir =
  configuracion.permite_pago_al_recibir !== false;

const transferencia =
  !!configuracion.permite_transferencia;

setPermitePagoAlRecibir(pagoAlRecibir);
setPermiteTransferencia(transferencia);

setBancoTransferencia(
  configuracion.banco_transferencia || ""
);

setTitularTransferencia(
  configuracion.titular_transferencia || ""
);

setCbuTransferencia(
  configuracion.cbu_transferencia || ""
);

setAliasTransferencia(
  configuracion.alias_transferencia || ""
);

setCuitCuilTitularTransferencia(
  configuracion.cuit_cuil_titular_transferencia || ""
);

setPermiteCanjePuntos(
  configuracion.permite_canje_puntos !== false
);

setGeneraPuntosConCanje(
  !!configuracion.genera_puntos_con_canje
);

if (pagoAlRecibir) {
  setFormaPago("al_recibir");
} else if (transferencia) {
  setFormaPago("transferencia");
}

      if (retiro) {
        setModalidadEntrega("retiro");
      } else if (domicilio) {
        setModalidadEntrega("domicilio");
      }
    } catch (error) {
      console.error(
        "Error cargando configuración de entrega:",
        error
      );
    } finally {
      setCargandoEntrega(false);
    }
  }

  cargarConfiguracionEntrega();
}, [comercioId]);

  const totalProductos = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.cantidad,
        0
      ),
    [items]
  );

  const totalPesos = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.precio_pesos * item.cantidad,
        0
      ),
    [items]
  );

  const totalPesosFinal = useMemo(() => {
  return (
    totalPesos +
    (modalidadEntrega === "domicilio" ? costoEnvio : 0)
  );
}, [totalPesos, modalidadEntrega, costoEnvio]);

  const totalPuntos = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.precio_puntos * item.cantidad,
        0
      ),
    [items]
  );

  const totalPuntosFinal = totalPuntos;
  const maximoPuntosCanjeables = Math.min(
    saldoPuntos,
    totalPuntosFinal
  );

  const puntosAplicados = usarPuntos
    ? Math.min(puntosACanjear, maximoPuntosCanjeables)
    : 0;

    const pesosCubiertosConPuntos = Math.min(
    puntosAplicados,
    totalPesos
  );

  const saldoProductosEnPesos = Math.max(
    totalPesos - pesosCubiertosConPuntos,
    0
  );

  const totalAPagarEnPesos =
    saldoProductosEnPesos +
    (modalidadEntrega === "domicilio" ? costoEnvio : 0);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">
              No hay productos en tu pedido
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Agregá productos antes de continuar.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  router.push(`/usuarios/${comercioId}/dashboard`);
                }}
                className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-4 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Volver al portal
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(`/usuarios/${comercioId}/catalogo`);
                }}
                className="cursor-pointer rounded-xl bg-[#C1121F] px-5 py-4 font-bold text-white transition hover:opacity-90"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/usuarios/${comercioId}/catalogo/carrito`
            )
          }
          className="mb-5 cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          ← Volver al pedido
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">
            Confirmar pedido
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Revisá la información antes de confirmar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Productos
              </h2>

              <div className="mt-4 divide-y divide-slate-100">
                {items.map((item, index) => (
                  <div
                    key={`${item.producto_id}-${index}`}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900">
                        {item.nombre}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Cantidad: {item.cantidad}
                      </div>

                      {item.observacion && (
                        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          <span className="font-semibold">
                            Indicación:
                          </span>{" "}
                          {item.observacion}
                        </div>
                      )}

                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        $
                        {(
                          item.precio_pesos * item.cantidad
                        ).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Entrega del pedido
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Elegí cómo querés recibir tu pedido.
              </p>

              {cargandoEntrega ? (
                <div className="mt-5 text-sm text-slate-500">
                  Cargando opciones de entrega...
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {permiteRetiro && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalidadEntrega("retiro");
                        setDireccionEntrega("");
                      }}
                      className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                        modalidadEntrega === "retiro"
                          ? "border-[#1E3A5F] bg-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-slate-900">
                        Retiro en el comercio
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Retirá tu pedido cuando el comercio lo confirme.
                      </div>
                    </button>
                  )}

                  {permiteEnvioDomicilio && (
                    <button
                      type="button"
                      onClick={() => setModalidadEntrega("domicilio")}
                      className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                        modalidadEntrega === "domicilio"
                          ? "border-[#1E3A5F] bg-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-slate-900">
                        Enviar a domicilio
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {costoEnvio > 0
                          ? `Costo de envío: $${costoEnvio.toLocaleString("es-AR")}`
                          : "Envío sin cargo"}
                      </div>
                    </button>
                  )}
                </div>
              )}

              {modalidadEntrega === "domicilio" && (
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Dirección de entrega
                  </label>

                  <input
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                    placeholder="Ej: Av. Belgrano 1250, piso 2"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                  />
                </div>
              )}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre de quien recibe
                </label>

                <input
                  value={nombreRetira}
                  onChange={(e) => setNombreRetira(e.target.value)}
                  placeholder="Ej: Víctor"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Observación general del pedido
                </label>

                <textarea
                  value={observacionGeneral}
                  onChange={(e) => setObservacionGeneral(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Ej: llamar al llegar, tocar timbre 2B..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-500"
                />

                <div className="mt-1 text-right text-xs text-slate-400">
                  {observacionGeneral.length}/300
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Forma de pago
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Elegí cómo querés pagar tu pedido.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {permitePagoAlRecibir && (
                  <button
                    type="button"
                    onClick={() => setFormaPago("al_recibir")}
                    className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                      formaPago === "al_recibir"
                        ? "border-[#1E3A5F] bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold text-slate-900">
                      Pago al recibir o retirar
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Pagás directamente al comercio al recibir o retirar tu pedido.
                    </div>
                  </button>
                )}

                {permiteTransferencia && (
                  <button
                    type="button"
                    onClick={() => setFormaPago("transferencia")}
                    className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                      formaPago === "transferencia"
                        ? "border-[#1E3A5F] bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold text-slate-900">
                      Transferencia bancaria
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      Transferí el importe utilizando los datos bancarios del comercio.
                    </div>
                  </button>
                )}
              </div>

              {formaPago === "transferencia" && permiteTransferencia && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-bold text-slate-900">
                    Datos para realizar la transferencia
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    {bancoTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Banco</span>
                        <strong className="text-right text-slate-900">
                          {bancoTransferencia}
                        </strong>
                      </div>
                    )}

                    {titularTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Titular</span>
                        <strong className="text-right text-slate-900">
                          {titularTransferencia}
                        </strong>
                      </div>
                    )}

                    {cbuTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">CBU</span>
                        <strong className="break-all text-right text-slate-900">
                          {cbuTransferencia}
                        </strong>
                      </div>
                    )}

                    {aliasTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Alias</span>
                        <strong className="text-right text-slate-900">
                          {aliasTransferencia}
                        </strong>
                      </div>
                    )}

                    {cuitCuilTitularTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">
                          CUIT / CUIL
                        </span>
                        <strong className="text-right text-slate-900">
                          {cuitCuilTitularTransferencia}
                        </strong>
                      </div>
                    )}
                  </div>

                  <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                    La transferencia quedará pendiente de confirmación por parte del comercio.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <h2 className="text-xl font-bold text-slate-900">
              Resumen
            </h2>

            <div className="mt-5 space-y-3 border-b border-slate-200 pb-5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Productos</span>
                <strong>{totalProductos}</strong>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Productos</span>
                <strong className="text-slate-900">
                  ${totalPesos.toLocaleString("es-AR")}
                </strong>
              </div>

              {modalidadEntrega === "domicilio" && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Envío</span>
                  <strong className="text-slate-900">
                    {costoEnvio > 0
                      ? `$${costoEnvio.toLocaleString("es-AR")}`
                      : "Sin cargo"}
                  </strong>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <span className="font-bold text-slate-900">
                  Total del pedido
                </span>

                <strong className="text-slate-900">
                  ${totalPesosFinal.toLocaleString("es-AR")}
                </strong>
              </div>

              {usarPuntos && puntosAplicados > 0 && (
                <>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Canje con puntos</span>

                    <strong className="text-[#C1121F]">
                      -${pesosCubiertosConPuntos.toLocaleString("es-AR")}
                    </strong>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                    <span className="font-bold text-slate-900">
                      A pagar en dinero
                    </span>

                    <strong className="text-lg font-black text-slate-900">
                      ${totalAPagarEnPesos.toLocaleString("es-AR")}
                    </strong>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm text-slate-600">
                <span>Total en puntos</span>
                <strong className="text-[#C1121F]">
                  {totalPuntosFinal.toLocaleString("es-AR")} pts
                </strong>
              </div>
              {permiteCanjePuntos && saldoPuntos > 0 && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      Usar mis puntos
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Tenés {saldoPuntos.toLocaleString("es-AR")} pts disponibles
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (usarPuntos) {
                        setUsarPuntos(false);
                        setPuntosACanjear(0);
                      } else {
                        setUsarPuntos(true);
                        setPuntosACanjear(maximoPuntosCanjeables);
                      }
                    }}
                    className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition ${
                      usarPuntos
                        ? "border border-red-200 bg-white text-[#C1121F] hover:bg-red-50"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {usarPuntos ? "No utilizar puntos" : "Usar puntos"}
                  </button>
                </div>

                {usarPuntos && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-600">
                        Puntos a utilizar
                      </span>

                      <strong className="text-[#C1121F]">
                        {puntosAplicados.toLocaleString("es-AR")} pts
                      </strong>
                    </div>

                    {saldoPuntos >= totalPuntosFinal ? (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Tus puntos alcanzan para cubrir el total de los productos.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Se aplicará tu saldo disponible y podrás pagar el resto en dinero.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-800">
                {modalidadEntrega === "retiro"
                  ? "Retiro en el comercio"
                  : "Envío a domicilio"}
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {modalidadEntrega === "retiro"
                  ? "El comercio confirmará el pedido y comenzará la preparación."
                  : "El comercio confirmará el pedido y coordinará el envío."}
              </p>
            </div>

            <button
              type="button"
              disabled={
                cargandoUsuario ||
                !usuarioId ||
                guardandoPedido ||
                !nombreRetira.trim() ||
                (modalidadEntrega === "domicilio" &&
                  !direccionEntrega.trim())
              }
              onClick={async () => {
                try {
                  setErrorPedido("");
                  setGuardandoPedido(true);

                  const res = await fetch("/api/catalogo/pedidos", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      comercio_id: comercioId,
                      usuario_id: usuarioId,
                      items,
                      modalidad_entrega: modalidadEntrega,
                      forma_pago: formaPago,
                      puntos_canjeados: puntosAplicados,
                      nombre_receptor: nombreRetira.trim(),
                      direccion_entrega:
                        modalidadEntrega === "domicilio"
                          ? direccionEntrega.trim()
                          : null,
                      observacion_general:
                        observacionGeneral.trim() || null,
                    }),
                  });

                  const data = await res.json();

                  if (!res.ok) {
                    setErrorPedido(
                      data?.error || "No se pudo confirmar el pedido"
                    );
                    return;
                  }

                  console.log("Pedido creado:", data);

                  setPedidoCreado({
                    numero_pedido: data.pedido.numero_pedido,
                    total_pesos: Number(data.pedido.total_pesos || 0),
                    total_puntos: Number(data.pedido.total_puntos || 0),
                    puntos_canjeados: Number(data.pedido.puntos_canjeados || 0),
                    monto_canje_puntos: Number(data.pedido.monto_canje_puntos || 0),
                    total_a_pagar_pesos: Number(
                      data.pedido.total_a_pagar_pesos || 0
                    ),
                    forma_pago: data.pedido.forma_pago,
                  });
                  const carritoActual = obtenerCarrito();

                  const carritoRestante = carritoActual.filter(
                    (item) => item.comercio_id !== comercioId
                  );

                  localStorage.setItem(
                    "benefi_catalogo_carrito",
                    JSON.stringify(carritoRestante)
                  );
                } catch (error) {
                  console.error(error);
                  setErrorPedido("Ocurrió un error al confirmar el pedido");
                } finally {
                  setGuardandoPedido(false);
                }
              }}
              className="mt-5 w-full cursor-pointer rounded-xl bg-[#C1121F] px-5 py-4 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardandoPedido ? "Confirmando..." : "Confirmar pedido"}
            </button>
            {errorPedido && (
              <p className="mt-2 text-center text-sm font-medium text-red-600">
                {errorPedido}
              </p>
            )}

            {!nombreRetira.trim() ? (
              <p className="mt-2 text-center text-xs text-slate-400">
                Ingresá el nombre de quien recibe / retira para continuar.
              </p>
            ) : modalidadEntrega === "domicilio" &&
              !direccionEntrega.trim() ? (
              <p className="mt-2 text-center text-xs text-slate-400">
                Ingresá la dirección de entrega para continuar.
              </p>
            ) : null}
          </aside>
        </div>
      </div>
      {pedidoCreado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-center">
              <div className="text-4xl">✅</div>

              <h2 className="mt-4 text-2xl font-black text-slate-900">
                Pedido confirmado
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Tu pedido fue enviado correctamente al comercio.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between gap-4">
                <span>Número de pedido</span>
                <strong>#{pedidoCreado.numero_pedido}</strong>
              </div>

              <div className="flex justify-between gap-4">
                <span>Total del pedido</span>
                <strong>
                  ${pedidoCreado.total_pesos.toLocaleString("es-AR")}
                </strong>
              </div>

              {pedidoCreado.puntos_canjeados > 0 && (
                <>
                  <div className="flex justify-between gap-4">
                    <span>Puntos utilizados</span>
                    <strong className="text-[#C1121F]">
                      {pedidoCreado.puntos_canjeados.toLocaleString("es-AR")} pts
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Canje con puntos</span>
                    <strong className="text-[#C1121F]">
                      -${pedidoCreado.monto_canje_puntos.toLocaleString("es-AR")}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
                    <span className="font-bold text-slate-900">
                      A pagar en dinero
                    </span>
                    <strong className="text-base font-black text-slate-900">
                      ${pedidoCreado.total_a_pagar_pesos.toLocaleString("es-AR")}
                    </strong>
                  </div>
                </>
              )}

              {pedidoCreado.puntos_canjeados === 0 && (
                <div className="flex justify-between gap-4">
                  <span>Total en puntos</span>
                  <strong className="text-[#C1121F]">
                    {pedidoCreado.total_puntos.toLocaleString("es-AR")} pts
                  </strong>
                </div>
              )}

              <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
                {modalidadEntrega === "retiro"
                  ? "Retiro en el comercio"
                  : "Envío a domicilio"}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex justify-between gap-4 text-sm text-slate-600">
                  <span>Forma de pago</span>

                  <strong className="text-right text-slate-900">
                    {pedidoCreado.forma_pago === "transferencia"
                      ? "Transferencia bancaria"
                      : "Pago al recibir o retirar"}
                  </strong>
                </div>
              </div>

              {pedidoCreado.forma_pago === "transferencia" && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="font-bold text-slate-900">
                    Datos para realizar la transferencia
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    {bancoTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Banco</span>
                        <strong className="text-right text-slate-900">
                          {bancoTransferencia}
                        </strong>
                      </div>
                    )}

                    {titularTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Titular</span>
                        <strong className="text-right text-slate-900">
                          {titularTransferencia}
                        </strong>
                      </div>
                    )}

                    {cbuTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">CBU</span>
                        <strong className="break-all text-right text-slate-900">
                          {cbuTransferencia}
                        </strong>
                      </div>
                    )}

                    {aliasTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Alias</span>
                        <strong className="text-right text-slate-900">
                          {aliasTransferencia}
                        </strong>
                      </div>
                    )}

                    {cuitCuilTitularTransferencia && (
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">CUIT / CUIL</span>
                        <strong className="text-right text-slate-900">
                          {cuitCuilTitularTransferencia}
                        </strong>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                    Realizá la transferencia para completar el pago. El comercio
                    confirmará la acreditación.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const carritoActual = obtenerCarrito();

                const carritoRestante = carritoActual.filter(
                  (item) => item.comercio_id !== comercioId
                );

                localStorage.setItem(
                  "benefi_catalogo_carrito",
                  JSON.stringify(carritoRestante)
                );

                router.push(`/usuarios/${comercioId}/catalogo`);
              }}
              className="mt-6 w-full cursor-pointer rounded-xl bg-[#C1121F] px-5 py-4 font-bold text-white transition hover:opacity-90"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}