'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePortalCampaign } from '@/hooks/usePortalCampaign'
import { getCurrentComercio } from '@/lib/getCurrentComercio'
import SidebarLayout from '@/components/SidebarLayout'

type Cliente = {
  id: string
  nombre_completo: string
  dni: string
  email?: string
  telefono?: string
  saldo: number
}

type Promocion = {
  id: string
  nombre: string
  tipo: 'porcentaje' | 'tramo' | 'puntos_fijos'
  valor: number | null
  cada_monto: number | null
  puntos_por_tramo: number | null
}

type Movimiento = {
  id: string
  operacion_id?: string | null
  tipo: 'carga' | 'canje'
  puntos: number
  monto_compra: number | null
  nro_ticket: string | null
  observaciones: string | null
  fecha: string
  promocion_id: string | null
  estado?: 'activo' | 'anulado'
  es_reverso?: boolean
  movimiento_original_id?: string | null
  anulado_por_movimiento_id?: string | null
}

type OperacionAgrupada = {
  operacion_id: string
  fecha: string
  nro_ticket: string
  monto_compra: number
  observaciones: string
  puntos_generados: number
  puntos_canjeados: number
  resultado_neto: number
  movimientos: Movimiento[]
  es_anulacion: boolean
  esta_anulada: boolean
  puede_anular: boolean
}

export default function Home() {
  const campaign = usePortalCampaign()

  const [comercioId, setComercioId] = useState('')
  const [dni, setDni] = useState('')
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [promocionId, setPromocionId] = useState('')
  const [importeCompra, setImporteCompra] = useState('')
  const [nroTicket, setNroTicket] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [puntosCanje, setPuntosCanje] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [mensajeColor, setMensajeColor] = useState<'ok' | 'error' | ''>('')
  const [loading, setLoading] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const [anulandoOperacionId, setAnulandoOperacionId] = useState<string | null>(null)
  const [mostrarConfirmacionAnulacion, setMostrarConfirmacionAnulacion] = useState(false)
  const [operacionAAnular, setOperacionAAnular] = useState<OperacionAgrupada | null>(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  const [fechaDesdeCliente, setFechaDesdeCliente] = useState('')
  const [fechaHastaCliente, setFechaHastaCliente] = useState('')
  const [fechaDesdeComercio, setFechaDesdeComercio] = useState('')
  const [fechaHastaComercio, setFechaHastaComercio] = useState('')

useEffect(() => {
async function loadComercio() {
  try {
    const comercio = await getCurrentComercio();

    if (comercio?.id) {
      setComercioId(comercio.id);
      return;
    }

    console.warn("No se encontró comercio para el usuario logueado");

    if (typeof window !== "undefined") {
      window.location.href = "/comercio/login";
    }
    } catch (error) {
      console.error("Error obteniendo comercio actual", error);
    }
  }

  loadComercio();
}, []);
  
  const limpiarMensajes = () => {
    setMensaje('')
    setMensajeColor('')
  }

  const limpiarOperacion = () => {
    setImporteCompra('')
    setNroTicket('')
    setObservaciones('')
    setPuntosCanje('')
  }

  const cerrarModalAnulacion = () => {
    if (anulandoOperacionId) return
    setMostrarConfirmacionAnulacion(false)
    setOperacionAAnular(null)
    setMotivoAnulacion('')
  }

  const nuevaBusqueda = () => {
    setCliente(null)
    setPromociones([])
    setMovimientos([])
    setPromocionId('')
    setMensaje('')
    setMensajeColor('')
    setMostrarConfirmacion(false)
    setMostrarConfirmacionAnulacion(false)
    setOperacionAAnular(null)
    setMotivoAnulacion('')
    limpiarOperacion()
    setDni('')
  }

  const buscarCliente = async () => {
    limpiarMensajes()

    if (!comercioId) {
      setMensaje('No se encontró el comercio del usuario logueado')
      setMensajeColor('error')
      return
    }

    if (!dni.trim()) {
      setMensaje('Ingresá el DNI del cliente')
      setMensajeColor('error')
      return
    }

    try {
      const res = await fetch('/api/clientes/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dni.trim(), comercio_id: comercioId }),
      })

      const data = await res.json()

      if (!data.ok) {
        setCliente(null)
        setPromociones([])
        setMovimientos([])
        setPromocionId('')
        setMensaje(data.error || 'Cliente no encontrado')
        setMensajeColor('error')
        return
      }

      setCliente(data.cliente)
      await cargarPromociones()
      await cargarMovimientos(data.cliente.id)
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al buscar el cliente')
      setMensajeColor('error')
    }
  }

  const cargarPromociones = async () => {
    if (!comercioId) {
      setPromociones([])
      setPromocionId('')
      return
    }

    try {
      const res = await fetch('/api/promociones/listar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comercio_id: comercioId }),
      })

      const data = await res.json()

      if (!data.ok) {
        setPromociones([])
        setPromocionId('')
        setMensaje(data.error || 'No se pudieron cargar las promociones')
        setMensajeColor('error')
        return
      }

      const promos = data.promociones || []
      setPromociones(promos)

      if (promos.length > 0) {
        setPromocionId(promos[0].id)
      } else {
        setPromocionId('')
        setMensaje('No hay promociones activas para este comercio')
        setMensajeColor('error')
      }
    } catch (error) {
      console.error(error)
      setPromociones([])
      setPromocionId('')
      setMensaje('Ocurrió un error al cargar promociones')
      setMensajeColor('error')
    }
  }

  const cargarMovimientos = async (usuarioId: string) => {
    if (!comercioId) {
      setMovimientos([])
      return
    }

    try {
      const res = await fetch('/api/movimientos/cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          comercio_id: comercioId,
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        setMovimientos([])
        return
      }

      setMovimientos(data.movimientos || [])
    } catch (error) {
      console.error(error)
      setMovimientos([])
    }
  }

const calcularPuntos = () => {
  if (!promocionId) return 0

  const promo = promociones.find((p) => p.id === promocionId)
  if (!promo) return 0

  const importe = Number(importeCompra)

  // 🔹 PORCENTAJE
  if (promo.tipo === 'porcentaje') {
    if (!importe || importe <= 0) return 0
    const porcentaje = Number(promo.valor || 0)
    return Math.floor((importe * porcentaje) / 100)
  }

  // 🔹 TRAMO
  if (promo.tipo === 'tramo') {
    if (!importe || importe <= 0) return 0

    const cadaMonto = Number(promo.cada_monto || 0)
    const puntosPorTramo = Number(promo.puntos_por_tramo || 0)

    if (cadaMonto <= 0 || puntosPorTramo <= 0) return 0

    return Math.floor(importe / cadaMonto) * puntosPorTramo
  }

  // 🔹 PUNTOS FIJOS
  if (promo.tipo === 'puntos_fijos') {
    return Number(promo.valor || 0)
  }

  return 0
}

  const validarOperacion = () => {
    if (!comercioId) {
      setMensaje('No se encontró el comercio del usuario logueado')
      setMensajeColor('error')
      return false
    }

    if (!cliente) {
      setMensaje('Primero debés buscar un cliente')
      setMensajeColor('error')
      return false
    }

    if (!promocionId) {
      setMensaje('No hay promoción seleccionada')
      setMensajeColor('error')
      return false
    }

    const importe = Number(importeCompra)
    if (!importe || importe <= 0) {
      setMensaje('Ingresá un importe de compra válido')
      setMensajeColor('error')
      return false
    }

    const canje = Number(puntosCanje || 0)
    if (canje < 0) {
      setMensaje('Los puntos a canjear no pueden ser negativos')
      setMensajeColor('error')
      return false
    }

    return true
  }

  const abrirConfirmacion = () => {
    limpiarMensajes()
    if (!validarOperacion()) return
    setMostrarConfirmacion(true)
  }

  const procesarOperacion = async () => {
    if (loading || !cliente) return

    if (!comercioId) {
      setMensaje('No se encontró el comercio del usuario logueado')
      setMensajeColor('error')
      return
    }

    setLoading(true)
    limpiarMensajes()

    const importe = Number(importeCompra)
    const canje = Number(puntosCanje || 0)

    try {
      const res = await fetch('/api/puntos/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: cliente.id,
          comercio_id: comercioId,
          promocion_id: promocionId,
          monto_compra: importe,
          nro_ticket: nroTicket,
          observaciones,
          puntos_canje: canje,
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        setMensaje(data.error || 'No se pudo procesar la operación')
        setMensajeColor('error')
        setMostrarConfirmacion(false)
        return
      }

      setMensaje(
        `Operación procesada. Ticket: ${data.nro_ticket} | Canjeados: ${data.puntos_canjeados} | Generados: ${data.puntos_generados} | Saldo final: ${data.saldo_final}`
      )
      setMensajeColor('ok')

      limpiarOperacion()
      setMostrarConfirmacion(false)
      await buscarCliente()
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al procesar la operación')
      setMensajeColor('error')
    } finally {
      setLoading(false)
    }
  }

  const exportarClienteActual = async () => {
    if (!cliente) return

    if (!comercioId) {
      alert('No se encontró el comercio del usuario logueado')
      return
    }

    if (!fechaDesdeCliente || !fechaHastaCliente) {
      alert('Completá desde y hasta para exportar el cliente')
      return
    }

    if (fechaDesdeCliente > fechaHastaCliente) {
      alert('La fecha desde no puede ser mayor que la fecha hasta')
      return
    }

    try {
      const res = await fetch('/api/operaciones/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: cliente.id,
          comercio_id: comercioId,
          fecha_desde: fechaDesdeCliente,
          fecha_hasta: fechaHastaCliente,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(errorText)
        alert('Error al exportar el cliente')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cliente_${cliente.dni}_${fechaDesdeCliente}_a_${fechaHastaCliente}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert('Error inesperado al exportar el cliente')
    }
  }

  const exportarComercio = async () => {
    if (!comercioId) {
      alert('No se encontró el comercio del usuario logueado')
      return
    }

    if (!fechaDesdeComercio || !fechaHastaComercio) {
      alert('Completá desde y hasta para exportar el comercio')
      return
    }

    if (fechaDesdeComercio > fechaHastaComercio) {
      alert('La fecha desde no puede ser mayor que la fecha hasta')
      return
    }

    try {
      const res = await fetch('/api/operaciones/exportar-rango', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comercio_id: comercioId,
          fecha_desde: fechaDesdeComercio,
          fecha_hasta: fechaHastaComercio,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(errorText)
        alert('Error al exportar el comercio')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comercio_${fechaDesdeComercio}_a_${fechaHastaComercio}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert('Error inesperado al exportar el comercio')
    }
  }

  const operacionesAgrupadas = useMemo<OperacionAgrupada[]>(() => {
    const mapa = new Map<string, Movimiento[]>()

    for (const mov of movimientos) {
      const key = mov.operacion_id || `sin-operacion-${mov.id}`

      if (!mapa.has(key)) {
        mapa.set(key, [])
      }

      mapa.get(key)!.push(mov)
    }

    const operaciones: OperacionAgrupada[] = []

    for (const [operacion_id, items] of mapa.entries()) {
      const ordenados = [...items].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )

      const primero = ordenados[0]

      const puntos_generados = items
        .filter((m) => m.tipo === 'carga' && m.estado === 'activo')
        .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

      const puntos_canjeados = items
        .filter((m) => m.tipo === 'canje' && m.estado === 'activo')
        .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

      const resultado_neto = puntos_generados - puntos_canjeados
      const es_anulacion = items.length > 0 && items.every((m) => m.es_reverso === true)
      const esta_anulada = items.some((m) => m.estado === 'anulado')
      const tieneMovimientosActivosOriginales = items.some(
        (m) => (m.estado || 'activo') === 'activo' && !m.es_reverso
      )

      const puede_anular =
        !esta_anulada &&
        !es_anulacion &&
        tieneMovimientosActivosOriginales &&
        Boolean(primero.operacion_id)

      operaciones.push({
        operacion_id,
        fecha: primero.fecha,
        nro_ticket: primero.nro_ticket || '-',
        monto_compra: Number(primero.monto_compra || 0),
        observaciones: primero.observaciones || '',
        puntos_generados,
        puntos_canjeados,
        resultado_neto,
        movimientos: ordenados,
        es_anulacion,
        esta_anulada,
        puede_anular,
      })
    }

    return operaciones.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
  }, [movimientos])

  const abrirConfirmacionAnulacion = (operacion: OperacionAgrupada) => {
    limpiarMensajes()
    setOperacionAAnular(operacion)
    setMotivoAnulacion('')
    setMostrarConfirmacionAnulacion(true)
  }

  const anularOperacion = async () => {
    if (!operacionAAnular || anulandoOperacionId) return

    try {
      setAnulandoOperacionId(operacionAAnular.operacion_id)
      limpiarMensajes()

      const res = await fetch('/api/operaciones/anular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacion_id: operacionAAnular.operacion_id,
          motivo: motivoAnulacion.trim(),
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        setMensaje(data.error || 'No se pudo anular la operación')
        setMensajeColor('error')
        return
      }

      setMensaje('Operación anulada correctamente')
      setMensajeColor('ok')
      setMostrarConfirmacionAnulacion(false)
      setOperacionAAnular(null)
      setMotivoAnulacion('')

      await buscarCliente()
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al anular la operación')
      setMensajeColor('error')
    } finally {
      setAnulandoOperacionId(null)
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-AR')
    } catch {
      return fecha
    }
  }

  const formatMoney = (value: number) =>
    `$${Math.round(Number(value || 0)).toLocaleString('es-AR')}`

  const promoSeleccionada = promociones.find((p) => p.id === promocionId)
  const puntosCalculados = calcularPuntos()
  const canjeActual = Number(puntosCanje || 0)
  const resultadoFinal = puntosCalculados - canjeActual

  function formatearPesos(valor: string) {
  const numero = valor.replace(/\D/g, "")

  if (!numero) return ""

  return Number(numero).toLocaleString("es-AR")
}

  return (
    <SidebarLayout>
      <div style={{ minHeight: '100vh', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              borderRadius: 999,
              background: '#eff6ff',
              color: '#1d4ed8',
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Terminal operativa
          </div>

          <h1 style={{ margin: 0, marginBottom: 6, fontSize: 36, color: '#111827' }}>
            {campaign.portal_titulo || 'Terminal de Fidelización'}
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>
            {campaign.portal_descripcion ||
              'Buscá al cliente por DNI y procesá operaciones de forma rápida'}
          </p>
        </div>

        {!cliente && (
          <div
            style={{
              maxWidth: 880,
              background: '#ffffff',
              borderRadius: 22,
              boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
              padding: 28,
              border: '1px solid #edf2f7',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Buscar cliente
            </div>

            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 15,
                color: '#374151',
                fontWeight: 700,
              }}
            >
              DNI del cliente
            </label>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                placeholder="Ingresar DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void buscarCliente()
                }}
                style={{
                  flex: 1,
                  minWidth: 260,
                  height: 54,
                  borderRadius: 14,
                  border: '1px solid #d1d5db',
                  padding: '0 18px',
                  fontSize: 18,
                  outline: 'none',
                }}
              />

              <button
                onClick={buscarCliente}
                style={{
                  height: 54,
                  padding: '0 28px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 12px 24px rgba(37,99,235,0.25)',
                }}
              >
                Buscar
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                fontSize: 13,
                color: '#94a3b8',
              }}
            >
              Tip: presioná Enter para buscar más rápido.
            </div>

            {mensaje && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 16px',
                  borderRadius: 12,
                  fontWeight: 700,
                  background: mensajeColor === 'ok' ? '#ecfdf5' : '#fef2f2',
                  color: mensajeColor === 'ok' ? '#065f46' : '#991b1b',
                  border:
                    mensajeColor === 'ok'
                      ? '1px solid #a7f3d0'
                      : '1px solid #fecaca',
                }}
              >
                {mensaje}
              </div>
            )}
          </div>
        )}

        {cliente && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '360px 1fr',
                gap: 18,
                alignItems: 'start',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 22,
                    boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
                    padding: 24,
                    border: '1px solid #edf2f7',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Cliente
                  </div>

                  <div
                    style={{
                      fontSize: 34,
                      lineHeight: '38px',
                      fontWeight: 800,
                      color: '#111827',
                      marginBottom: 14,
                    }}
                  >
                    {cliente.nombre_completo}
                  </div>

                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)',
                      border: '1px solid #bbf7d0',
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: '#166534',
                        fontWeight: 700,
                        marginBottom: 6,
                        textTransform: 'uppercase',
                      }}
                    >
                      Saldo disponible
                    </div>
                    <div
                      style={{
                        fontSize: 38,
                        lineHeight: '42px',
                        fontWeight: 800,
                        color: '#166534',
                      }}
                    >
                      {cliente.saldo} puntos
                    </div>
                  </div>

                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 18 }}>
                    DNI: {cliente.dni}
                  </div>

                  <button
                    onClick={nuevaBusqueda}
                    style={{
                      width: '100%',
                      height: 46,
                      padding: '0 18px',
                      borderRadius: 14,
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      color: '#374151',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Nueva búsqueda
                  </button>
                </div>

                {mensaje && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 16,
                      fontWeight: 700,
                      background: mensajeColor === 'ok' ? '#ecfdf5' : '#fef2f2',
                      color: mensajeColor === 'ok' ? '#065f46' : '#991b1b',
                      border:
                        mensajeColor === 'ok'
                          ? '1px solid #a7f3d0'
                          : '1px solid #fecaca',
                    }}
                  >
                    {mensaje}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 22,
                  boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
                  padding: 24,
                  border: '1px solid #edf2f7',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                    marginBottom: 18,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      Operar
                    </div>
                    <h2 style={{ margin: 0, fontSize: 30, color: '#111827' }}>
                      Procesar operación
                    </h2>
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Resultado actual: <span style={{ color: resultadoFinal >= 0 ? '#166534' : '#991b1b' }}>{resultadoFinal >= 0 ? '+' : ''}{resultadoFinal} pts</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))',
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      background: '#f8fbff',
                      border: '1px solid #dbeafe',
                      borderRadius: 18,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: '#1d4ed8',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: 10,
                      }}
                    >
                      Acreditar puntos
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={labelStyle}>Promoción</label>
                      <select
                        value={promocionId}
                        onChange={(e) => setPromocionId(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Seleccionar promoción</option>
                        {promociones.map((promo) => (
                          <option key={promo.id} value={promo.id}>
                            {promo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Importe de compra</label>
                    <input
                      type="text"
                      placeholder="Ingresar importe"
                      value={
                        importeCompra
                          ? `$ ${formatearPesos(importeCompra)}`
                          : ""
                      }
                      onChange={(e) => {
                        const soloNumeros = e.target.value.replace(/\D/g, "")
                        setImporteCompra(soloNumeros)
                      }}
                      autoComplete="off"
                      name="importe_compra_unico_123"
                      style={inputStyle}
                    />
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        padding: 14,
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>
                        Vas a generar
                      </div>
                      <div style={{ fontSize: 30, lineHeight: '34px', color: '#1d4ed8', fontWeight: 800 }}>
                        +{puntosCalculados} puntos
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 18,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: '#a16207',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: 10,
                      }}
                    >
                      Canjear puntos
                    </div>

                    <div
                      style={{
                        marginBottom: 12,
                        padding: 14,
                        borderRadius: 14,
                        background: '#ffffff',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <div style={{ fontSize: 13, color: '#78716c', fontWeight: 700 }}>
                        Saldo disponible
                      </div>
                      <div style={{ fontSize: 30, lineHeight: '34px', color: '#92400e', fontWeight: 800 }}>
                        {cliente.saldo} puntos
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Puntos a usar</label>
                      <input
                        type="number"
                        placeholder="Opcional"
                        value={puntosCanje}
                        onChange={(e) => setPuntosCanje(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginTop: 14, fontSize: 13, color: '#78716c' }}>
                      El sistema validará automáticamente que no se puedan usar más puntos que los disponibles.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Nro. ticket</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={nroTicket}
                      onChange={(e) => setNroTicket(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Observaciones</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: 18,
                    padding: 18,
                    borderRadius: 18,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Resumen simple
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))',
                      gap: 12,
                    }}
                  >
                    <ResumenBox
                      titulo="Acredita"
                      valor={`+${puntosCalculados} pts`}
                      color="#1d4ed8"
                    />
                    <ResumenBox
                      titulo="Canjea"
                      valor={`-${canjeActual} pts`}
                      color="#a16207"
                    />
                    <ResumenBox
                      titulo="Resultado"
                      valor={`${resultadoFinal >= 0 ? '+' : ''}${resultadoFinal} pts`}
                      color={resultadoFinal >= 0 ? '#166534' : '#991b1b'}
                    />
                  </div>

                  <div style={{ marginTop: 12, fontSize: 14, color: '#475569' }}>
                    Promoción: <strong>{promoSeleccionada?.nombre || '-'}</strong> · Importe:{' '}
                    <strong>{formatMoney(Number(importeCompra || 0))}</strong>
                  </div>
                </div>

                <button
                  onClick={abrirConfirmacion}
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 54,
                    borderRadius: 16,
                    border: 'none',
                    background: loading ? '#9ca3af' : '#16a34a',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 17,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 14px 28px rgba(22,163,74,0.24)',
                  }}
                >
                  {loading ? 'Procesando...' : 'Confirmar operación'}
                </button>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: 22,
                boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
                padding: 24,
                border: '1px solid #edf2f7',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Historial
                  </div>
                  <h2 style={{ margin: 0, fontSize: 30, color: '#111827' }}>
                    Últimas operaciones
                  </h2>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#64748b',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 999,
                    padding: '8px 12px',
                    fontWeight: 700,
                  }}
                >
                  {operacionesAgrupadas.length} registros
                </div>
              </div>

              {operacionesAgrupadas.length === 0 && (
                <div style={{ color: '#6b7280', fontSize: 14 }}>
                  Este cliente no tiene operaciones todavía.
                </div>
              )}

              {operacionesAgrupadas.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    maxHeight: 720,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {operacionesAgrupadas.map((op) => {
                    const estado = op.es_anulacion
                      ? { bg: '#dbeafe', color: '#1d4ed8', label: 'ANULACIÓN' }
                      : op.esta_anulada
                        ? { bg: '#fee2e2', color: '#991b1b', label: 'ANULADA' }
                        : { bg: '#dcfce7', color: '#166534', label: 'OPERACIÓN' }

                    return (
                      <div
                        key={op.operacion_id}
                        style={{
                          border: op.esta_anulada
                            ? '1px solid #fecaca'
                            : op.es_anulacion
                              ? '1px solid #bfdbfe'
                              : '1px solid #e5e7eb',
                          borderRadius: 18,
                          padding: 16,
                          background: op.esta_anulada
                            ? '#fef2f2'
                            : op.es_anulacion
                              ? '#eff6ff'
                              : '#fafafa',
                          opacity: anulandoOperacionId === op.operacion_id
                            ? 0.7
                            : op.esta_anulada
                              ? 0.65
                              : 1,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'flex-start',
                            marginBottom: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: 17,
                                color: '#111827',
                                marginBottom: 8,
                              }}
                            >
                              {op.resultado_neto >= 0 ? '+' : ''}{op.resultado_neto} puntos
                            </div>

                            <div
                              style={{
                                fontSize: 14,
                                color: '#475569',
                                marginBottom: 8,
                              }}
                            >
                              Ticket: <strong>{op.nro_ticket}</strong> · Compra:{' '}
                              <strong>{formatMoney(op.monto_compra)}</strong>
                            </div>

                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '5px 12px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                background: estado.bg,
                                color: estado.color,
                              }}
                            >
                              {estado.label}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              whiteSpace: 'nowrap',
                              fontWeight: 700,
                            }}
                          >
                            {formatearFecha(op.fecha)}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))',
                            gap: 12,
                            marginBottom: 10,
                          }}
                        >
                          <MiniBox
                            label="Generados"
                            value={`+${op.puntos_generados}`}
                            color="#166534"
                          />
                          <MiniBox
                            label="Canjeados"
                            value={`-${op.puntos_canjeados}`}
                            color="#991b1b"
                          />
                          <MiniBox
                            label="Resultado"
                            value={`${op.resultado_neto >= 0 ? '+' : ''}${op.resultado_neto}`}
                            color={op.resultado_neto >= 0 ? '#166534' : '#991b1b'}
                          />
                        </div>

                        {op.observaciones && (
                          <div
                            style={{
                              marginBottom: 10,
                              fontSize: 13,
                              color: '#4b5563',
                              background: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 12,
                              padding: 12,
                            }}
                          >
                            <strong>Observaciones:</strong> {op.observaciones}
                          </div>
                        )}

                        <details
                          style={{
                            marginBottom: 12,
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: 12,
                            padding: 12,
                          }}
                        >
                          <summary
                            style={{
                              cursor: 'pointer',
                              fontWeight: 700,
                              color: '#334155',
                            }}
                          >
                            Ver detalle interno
                          </summary>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              marginTop: 12,
                            }}
                          >
                            {op.movimientos.map((mov) => (
                              <div
                                key={mov.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                  fontSize: 13,
                                  color: '#374151',
                                  borderBottom: '1px dashed #e5e7eb',
                                  paddingBottom: 6,
                                }}
                              >
                                <div>
                                  <strong>{mov.tipo.toUpperCase()}</strong>
                                  {mov.es_reverso ? ' · anulación' : ''}
                                </div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: mov.tipo === 'carga' ? '#166534' : '#991b1b',
                                  }}
                                >
                                  {mov.tipo === 'carga' ? '+' : '-'}
                                  {mov.puntos}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {op.puede_anular ? (
                            <button
                              onClick={() => abrirConfirmacionAnulacion(op)}
                              disabled={Boolean(anulandoOperacionId)}
                              style={{
                                height: 40,
                                padding: '0 16px',
                                borderRadius: 12,
                                border: 'none',
                                background: Boolean(anulandoOperacionId) ? '#9ca3af' : '#dc2626',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: Boolean(anulandoOperacionId) ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {anulandoOperacionId === op.operacion_id
                                ? 'Anulando...'
                                : 'Anular operación'}
                            </button>
                          ) : (
                            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                              {op.es_anulacion
                                ? 'Operación generada por anulación'
                                : op.esta_anulada
                                  ? 'Operación anulada'
                                  : 'No disponible'}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: 22,
                boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
                padding: 24,
                border: '1px solid #edf2f7',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Herramientas avanzadas
              </div>
              <h2 style={{ margin: 0, marginBottom: 18, fontSize: 28, color: '#111827' }}>
                Exportaciones
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))',
                  gap: 18,
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Historial del cliente
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Desde</label>
                      <input
                        type="date"
                        value={fechaDesdeCliente}
                        onChange={(e) => setFechaDesdeCliente(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Hasta</label>
                      <input
                        type="date"
                        value={fechaHastaCliente}
                        onChange={(e) => setFechaHastaCliente(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <button
                    onClick={exportarClienteActual}
                    style={{
                      height: 44,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#2563eb',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Exportar cliente
                  </button>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Operaciones del comercio
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>Desde</label>
                      <input
                        type="date"
                        value={fechaDesdeComercio}
                        onChange={(e) => setFechaDesdeComercio(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Hasta</label>
                      <input
                        type="date"
                        value={fechaHastaComercio}
                        onChange={(e) => setFechaHastaComercio(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <button
                    onClick={exportarComercio}
                    style={{
                      height: 44,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#7c3aed',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Exportar comercio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {mostrarConfirmacion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 26, color: '#111827' }}>
              Confirmar operación
            </h3>

            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: 16,
                lineHeight: '24px',
                color: '#374151',
              }}
            >
              <div><strong>Cliente:</strong> {cliente?.nombre_completo}</div>
              <div><strong>Promoción:</strong> {promoSeleccionada?.nombre || '-'}</div>
              <div><strong>Importe:</strong> {formatMoney(Number(importeCompra || 0))}</div>
              <div><strong>Canje:</strong> {canjeActual} puntos</div>
              <div><strong>Genera:</strong> {puntosCalculados} puntos</div>
              <div><strong>Resultado final:</strong> {resultadoFinal >= 0 ? '+' : ''}{resultadoFinal} puntos</div>
              <div><strong>Ticket:</strong> {nroTicket || 'Se generará automático'}</div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                disabled={loading}
                style={{
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={procesarOperacion}
                disabled={loading}
                style={{
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: loading ? '#9ca3af' : '#16a34a',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmacionAnulacion && operacionAAnular && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1001,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 24, color: '#111827' }}>
              Confirmar anulación
            </h3>

            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #fdba74',
                borderRadius: 12,
                padding: 16,
                lineHeight: '24px',
                color: '#9a3412',
                marginBottom: 16,
              }}
            >
              Esta acción no borra la operación original. Se generará una anulación automática y quedará auditada en el historial.
            </div>

            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                lineHeight: '24px',
                color: '#374151',
              }}
            >
              <div><strong>Cliente:</strong> {cliente?.nombre_completo}</div>
              <div><strong>Ticket:</strong> {operacionAAnular.nro_ticket}</div>
              <div><strong>Importe:</strong> {formatMoney(operacionAAnular.monto_compra)}</div>
              <div><strong>Generados:</strong> {operacionAAnular.puntos_generados} puntos</div>
              <div><strong>Canjeados:</strong> {operacionAAnular.puntos_canjeados} puntos</div>
              <div><strong>Resultado neto:</strong> {operacionAAnular.resultado_neto} puntos</div>
              <div><strong>Fecha:</strong> {new Date(operacionAAnular.fecha).toLocaleString('es-AR')}</div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#374151',
                  fontWeight: 700,
                }}
              >
                Motivo de anulación
              </label>

              <textarea
                placeholder="Opcional"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 90,
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  padding: 12,
                  fontSize: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={cerrarModalAnulacion}
                disabled={Boolean(anulandoOperacionId)}
                style={{
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 12,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  fontWeight: 700,
                  cursor: Boolean(anulandoOperacionId) ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={anularOperacion}
                disabled={Boolean(anulandoOperacionId)}
                style={{
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: Boolean(anulandoOperacionId) ? '#9ca3af' : '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: Boolean(anulandoOperacionId) ? 'not-allowed' : 'pointer',
                }}
              >
                {Boolean(anulandoOperacionId) ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  )
}

function ResumenBox({
  titulo,
  valor,
  color,
}: {
  titulo: string
  valor: string
  color: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 700 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 26, lineHeight: '30px', color, fontWeight: 800 }}>
        {valor}
      </div>
    </div>
  )
}

function MiniBox({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, color, fontWeight: 800 }}>
        {value}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 14,
  color: '#374151',
  fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 14,
  border: '1px solid #d1d5db',
  padding: '0 14px',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}
