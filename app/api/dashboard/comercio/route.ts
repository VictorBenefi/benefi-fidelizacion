import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Movimiento = {
  id: string
  usuario_id: string | null
  operacion_id: string | null
  tipo: 'carga' | 'canje'
  puntos: number
  monto_compra: number | null
  nro_ticket: string | null
  observaciones: string | null
  fecha: string
  estado: 'activo' | 'anulado' | null
  es_reverso: boolean | null
}

type OperacionResumen = {
  operacion_id: string
  fecha: string
  ticket: string
  importe: number
  puntos_generados: number
  puntos_canjeados: number
  resultado_neto: number
  estado: 'OPERACION' | 'ANULADA' | 'ANULACION'
  detalle: string
}

function agruparOperaciones(movimientos: Movimiento[]): OperacionResumen[] {
  const mapa = new Map<string, Movimiento[]>()

  for (const mov of movimientos) {
    const key = mov.operacion_id || `sin-operacion-${mov.id}`
    if (!mapa.has(key)) mapa.set(key, [])
    mapa.get(key)!.push(mov)
  }

  const operaciones: OperacionResumen[] = []

  for (const [operacionId, items] of mapa.entries()) {
    const ordenados = [...items].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )

    const primero = ordenados[0]

    const puntosGenerados = items
      .filter((m) => m.tipo === 'carga')
      .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

    const puntosCanjeados = items
      .filter((m) => m.tipo === 'canje')
      .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

    const resultadoNeto = puntosGenerados - puntosCanjeados

    const esAnulacion =
      items.length > 0 && items.every((m) => m.es_reverso === true)

    const estaAnulada =
      !esAnulacion && items.some((m) => m.estado === 'anulado')

    let estado: OperacionResumen['estado'] = 'OPERACION'
    if (esAnulacion) estado = 'ANULACION'
    else if (estaAnulada) estado = 'ANULADA'

    const detalle = items
      .map((m) => {
        const etiqueta = m.es_reverso ? `${m.tipo} (anulación)` : m.tipo
        const signo = m.tipo === 'carga' ? '+' : '-'
        return `${etiqueta}: ${signo}${Number(m.puntos || 0)}`
      })
      .join(' | ')

    operaciones.push({
      operacion_id: operacionId,
      fecha: primero?.fecha || '',
      ticket: primero?.nro_ticket || '-',
      importe: Number(primero?.monto_compra || 0),
      puntos_generados: puntosGenerados,
      puntos_canjeados: puntosCanjeados,
      resultado_neto: resultadoNeto,
      estado,
      detalle,
    })
  }

  return operaciones.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { comercio_id, fecha_desde, fecha_hasta } = body

    if (!comercio_id) {
      return NextResponse.json(
        { ok: false, error: 'comercio_id es obligatorio' },
        { status: 400 }
      )
    }

    if (!fecha_desde || !fecha_hasta) {
      return NextResponse.json(
        { ok: false, error: 'fecha_desde y fecha_hasta son obligatorias' },
        { status: 400 }
      )
    }

    const desde = new Date(`${fecha_desde}T00:00:00`)
    const hasta = new Date(`${fecha_hasta}T23:59:59`)

    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      return NextResponse.json(
        { ok: false, error: 'Las fechas son inválidas' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('movimientos_puntos')
      .select(
        `
        id,
        usuario_id,
        operacion_id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        observaciones,
        fecha,
        estado,
        es_reverso
      `
      )
      .eq('comercio_id', comercio_id)
      .gte('fecha', desde.toISOString())
      .lte('fecha', hasta.toISOString())
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error Supabase dashboard:', error)
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    const movimientos = (data || []) as Movimiento[]
    const operacionesAgrupadas = agruparOperaciones(movimientos)

    const operacionesActivas = operacionesAgrupadas.filter(
      (op) => op.estado === 'OPERACION'
    )

    const totalVentas = operacionesActivas.reduce(
      (acc, op) => acc + Number(op.importe || 0),
      0
    )

    const puntosGenerados = operacionesActivas.reduce(
      (acc, op) => acc + Number(op.puntos_generados || 0),
      0
    )

    const puntosCanjeados = operacionesActivas.reduce(
      (acc, op) => acc + Number(op.puntos_canjeados || 0),
      0
    )

    const clientesUnicos = new Set(
      movimientos.map((m) => m.usuario_id).filter(Boolean)
    ).size

    const operaciones = operacionesActivas.length

    const ticketPromedio = operaciones > 0 ? totalVentas / operaciones : 0

    const anulaciones = operacionesAgrupadas.filter(
      (op) => op.estado === 'ANULACION'
    ).length

    return NextResponse.json({
      ok: true,
      total_ventas: totalVentas,
      puntos_generados: puntosGenerados,
      puntos_canjeados: puntosCanjeados,
      clientes_unicos: clientesUnicos,
      operaciones,
      ticket_promedio: ticketPromedio,
      anulaciones,
      ultimas_operaciones: operacionesAgrupadas.slice(0, 20),
    })
  } catch (error: any) {
    console.error('Error interno dashboard:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}