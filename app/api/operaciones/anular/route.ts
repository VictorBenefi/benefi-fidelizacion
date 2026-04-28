import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type MovimientoDB = {
  id: string
  usuario_id: string
  comercio_id: string
  promocion_id: string | null
  operacion_id: string | null
  tipo: 'carga' | 'canje'
  puntos: number
  monto_compra: number | null
  nro_ticket: string | null
  observaciones: string | null
  fecha: string
  estado: 'activo' | 'anulado'
  es_reverso: boolean
  movimiento_original_id: string | null
  anulado_por_movimiento_id: string | null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const operacionId = String(body?.operacion_id || '').trim()
    const motivo = String(body?.motivo || '').trim()

    if (!operacionId) {
      return NextResponse.json(
        { ok: false, error: 'operacion_id es obligatorio' },
        { status: 400 }
      )
    }

    const { data: movimientos, error: movimientosError } = await supabaseAdmin
      .from('movimientos_puntos')
      .select(`
        id,
        usuario_id,
        comercio_id,
        promocion_id,
        operacion_id,
        tipo,
        puntos,
        monto_compra,
        nro_ticket,
        observaciones,
        fecha,
        estado,
        es_reverso,
        movimiento_original_id,
        anulado_por_movimiento_id
      `)
      .eq('operacion_id', operacionId)
      .order('fecha', { ascending: true })

    if (movimientosError) {
      return NextResponse.json(
        { ok: false, error: movimientosError.message },
        { status: 500 }
      )
    }

    const movimientosOperacion = (movimientos || []) as MovimientoDB[]

    if (movimientosOperacion.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No se encontraron movimientos para esa operación' },
        { status: 404 }
      )
    }

    const originales = movimientosOperacion.filter((m) => !m.es_reverso)

    if (originales.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'La operación no tiene movimientos originales anulables' },
        { status: 400 }
      )
    }

    const originalesActivos = originales.filter((m) => m.estado === 'activo')

    if (originalesActivos.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'La operación ya fue anulada' },
        { status: 400 }
      )
    }

    const usuarioId = originales[0].usuario_id
    const comercioId = originales[0].comercio_id

    const { data: saldoData, error: saldoError } = await supabaseAdmin
      .from('saldos')
      .select('saldo')
      .eq('usuario_id', usuarioId)
      .eq('comercio_id', comercioId)
      .maybeSingle()

    if (saldoError) {
      return NextResponse.json(
        { ok: false, error: saldoError.message },
        { status: 500 }
      )
    }

    const saldoActual = Number(saldoData?.saldo || 0)

    const puntosCargaOriginal = originalesActivos
      .filter((m) => m.tipo === 'carga')
      .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

    const puntosCanjeOriginal = originalesActivos
      .filter((m) => m.tipo === 'canje')
      .reduce((acc, m) => acc + Number(m.puntos || 0), 0)

    const puntosADescontarDelSaldo = Math.max(
      0,
      puntosCargaOriginal - puntosCanjeOriginal
    )

    if (puntosADescontarDelSaldo > saldoActual) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'No se puede anular la operación porque el cliente no tiene saldo suficiente para descontar los puntos generados por esa compra.',
          saldo_actual: saldoActual,
          puntos_a_descontar: puntosADescontarDelSaldo,
        },
        { status: 400 }
      )
    }

    const operacionAnulacionId = randomUUID()
    const fechaAhora = new Date().toISOString()
    const ticketAnulacion =
      originales[0].nro_ticket
        ? `${originales[0].nro_ticket}-ANUL`
        : `ANUL-${Date.now()}`

    /*
      IMPORTANTE:
      Los reversos se insertan con estado = 'anulado' para que queden como auditoría,
      pero NO vuelvan a impactar el saldo.

      El impacto real en el saldo lo produce el cambio de estado de los movimientos
      originales a "anulado". Esto evita el doble descuento:
      - antes: insertaba reverso activo y además anulaba el original
      - ahora: reverso auditado sin impacto + anulación del original
    */
    const reversosAInsertar = originalesActivos.map((mov) => ({
      usuario_id: mov.usuario_id,
      comercio_id: mov.comercio_id,
      promocion_id: mov.promocion_id,
      operacion_id: operacionAnulacionId,
      tipo: mov.tipo === 'carga' ? 'canje' : 'carga',
      puntos: mov.puntos,
      monto_compra: mov.monto_compra,
      nro_ticket: ticketAnulacion,
      observaciones: [
        `Reverso informativo por anulación de operación ${operacionId}`,
        motivo ? `Motivo: ${motivo}` : null,
        mov.observaciones ? `Obs. original: ${mov.observaciones}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
      fecha: fechaAhora,
      estado: 'anulado',
      es_reverso: true,
      movimiento_original_id: mov.id,
      anulado_por_movimiento_id: null,
      anulado_en: fechaAhora,
      anulado_por: null,
    }))

    const { data: reversosInsertados, error: reversosError } = await supabaseAdmin
      .from('movimientos_puntos')
      .insert(reversosAInsertar)
      .select('id, movimiento_original_id')

    if (reversosError) {
      return NextResponse.json(
        { ok: false, error: reversosError.message },
        { status: 500 }
      )
    }

    const reversos = reversosInsertados || []

    for (const original of originalesActivos) {
      const reversoAsociado = reversos.find(
        (r) => r.movimiento_original_id === original.id
      )

      const { error: updateError } = await supabaseAdmin
        .from('movimientos_puntos')
        .update({
          estado: 'anulado',
          anulado_por_movimiento_id: reversoAsociado?.id || null,
          anulado_en: fechaAhora,
        })
        .eq('id', original.id)

      if (updateError) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Se generaron reversos informativos pero falló la actualización del movimiento original. Revisar consistencia.',
          },
          { status: 500 }
        )
      }
    }

    const { data: saldoFinalData, error: saldoFinalError } = await supabaseAdmin
      .from('saldos')
      .select('saldo')
      .eq('usuario_id', usuarioId)
      .eq('comercio_id', comercioId)
      .maybeSingle()

    if (saldoFinalError) {
      return NextResponse.json(
        { ok: false, error: saldoFinalError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Operación anulada correctamente',
      operacion_original_id: operacionId,
      operacion_anulacion_id: operacionAnulacionId,
      saldo_anterior: saldoActual,
      saldo_final: Number(saldoFinalData?.saldo || 0),
      puntos_carga_original: puntosCargaOriginal,
      puntos_canje_original: puntosCanjeOriginal,
      puntos_a_descontar: puntosADescontarDelSaldo,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
