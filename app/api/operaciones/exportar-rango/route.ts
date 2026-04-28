import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Movimiento = {
  id: string
  operacion_id: string | null
  tipo: 'carga' | 'canje'
  puntos: number
  monto_compra: number | null
  nro_ticket: string | null
  observaciones: string | null
  fecha: string
  estado: 'activo' | 'anulado' | null
  es_reverso: boolean | null
  usuario_id: string | null
  usuarios: {
    nombre_completo?: string | null
    dni?: string | null
  } | null
}

type OperacionExportable = {
  fecha: string
  ticket: string
  estado: 'OPERACION' | 'ANULADA' | 'ANULACION'
  cliente: string
  dni: string
  importe: number
  puntos_generados: number
  puntos_canjeados: number
  resultado_neto: number
  observaciones: string
  detalle: string
  operacion_id: string
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function formatearFecha(fechaIso: string) {
  try {
    return new Date(fechaIso).toLocaleString('es-AR')
  } catch {
    return fechaIso
  }
}

function agruparOperaciones(movimientos: Movimiento[]): OperacionExportable[] {
  const mapa = new Map<string, Movimiento[]>()

  for (const mov of movimientos) {
    const key = mov.operacion_id || `sin-operacion-${mov.id}`

    if (!mapa.has(key)) {
      mapa.set(key, [])
    }

    mapa.get(key)!.push(mov)
  }

  const operaciones: OperacionExportable[] = []

  for (const [operacionId, items] of mapa.entries()) {
    const ordenados = [...items].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    })

    const primero = ordenados[0]

    const puntosGenerados = items
      .filter((m) => m.tipo === 'carga')
      .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

    const puntosCanjeados = items
      .filter((m) => m.tipo === 'canje')
      .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

    const resultadoNeto = puntosGenerados - puntosCanjeados
    const esAnulacion = items.length > 0 && items.every((m) => m.es_reverso === true)
    const anulada = items.some((m) => m.estado === 'anulado')

    let estado: OperacionExportable['estado'] = 'OPERACION'
    if (esAnulacion) estado = 'ANULACION'
    else if (anulada) estado = 'ANULADA'

    const detalle = items
      .map((m) => {
        const nombre = m.es_reverso ? `${m.tipo} (anulación)` : m.tipo
        const signo = m.tipo === 'carga' ? '+' : '-'
        return `${nombre}: ${signo}${Number(m.puntos || 0)}`
      })
      .join(' | ')

    operaciones.push({
      fecha: primero?.fecha || '',
      ticket: primero?.nro_ticket || '-',
      estado,
      cliente: primero?.usuarios?.nombre_completo || '-',
      dni: primero?.usuarios?.dni || '-',
      importe: Number(primero?.monto_compra || 0),
      puntos_generados: puntosGenerados,
      puntos_canjeados: puntosCanjeados,
      resultado_neto: resultadoNeto,
      observaciones: primero?.observaciones || '',
      detalle,
      operacion_id: operacionId,
    })
  }

  return operaciones.sort((a, b) => {
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  })
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
        { ok: false, error: 'Debés informar fecha_desde y fecha_hasta' },
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
      .select(`
        id,
        operacion_id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        observaciones,
        fecha,
        estado,
        es_reverso,
        usuario_id,
        usuarios:usuario_id (
          nombre_completo,
          dni
        )
      `)
      .eq('comercio_id', comercio_id)
      .gte('fecha', desde.toISOString())
      .lte('fecha', hasta.toISOString())
      .order('fecha', { ascending: false })

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      )
    }

    const operaciones = agruparOperaciones((data || []) as unknown as Movimiento[])

    const encabezados = [
      'Fecha',
      'Ticket',
      'Estado',
      'Cliente',
      'DNI',
      'Importe',
      'Puntos generados',
      'Puntos canjeados',
      'Resultado neto',
      'Observaciones',
      'Detalle',
      'Operacion ID',
    ]

    const filas = operaciones.map((op) => [
      formatearFecha(op.fecha),
      op.ticket,
      op.estado,
      op.cliente,
      op.dni,
      op.importe,
      op.puntos_generados,
      op.puntos_canjeados,
      op.resultado_neto,
      op.observaciones,
      op.detalle,
      op.operacion_id,
    ])

    const csv =
      '\ufeff' +
      [encabezados, ...filas]
        .map((row) => row.map(escapeCsv).join(';'))
        .join('\n')

    const nombreArchivo = `operaciones_${fecha_desde}_a_${fecha_hasta}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
