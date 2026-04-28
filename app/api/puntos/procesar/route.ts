import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      usuario_id,
      comercio_id,
      promocion_id,
      monto_compra,
      nro_ticket,
      observaciones,
      puntos_canje,
    } = body

    if (!usuario_id) {
      return NextResponse.json(
        { ok: false, error: 'usuario_id es obligatorio' },
        { status: 400 }
      )
    }

    if (!comercio_id) {
      return NextResponse.json(
        { ok: false, error: 'comercio_id es obligatorio' },
        { status: 400 }
      )
    }

    if (!promocion_id) {
      return NextResponse.json(
        { ok: false, error: 'promocion_id es obligatorio' },
        { status: 400 }
      )
    }

     const importe = Number(monto_compra || 0)
     const canje = Number(puntos_canje || 0)
     const ticketFinal = nro_ticket || `TCK-${Date.now()}`
     const operacionId = randomUUID()
     const fechaAhora = new Date().toISOString()

    if (canje < 0) {
      return NextResponse.json(
        { ok: false, error: 'puntos_canje no puede ser negativo' },
        { status: 400 }
      )
    }

    // 1. Buscar promoción activa
    const { data: promo, error: promoError } = await supabaseAdmin
      .from('promociones')
      .select('*')
      .eq('id', promocion_id)
      .eq('comercio_id', comercio_id)
      .eq('activa', true)
      .single()

    if (promoError || !promo) {
      return NextResponse.json(
        { ok: false, error: 'Promoción no encontrada o inactiva' },
        { status: 400 }
      )
    }

    // 2. Obtener saldo anterior
    const { data: saldoData, error: saldoError } = await supabaseAdmin
      .from('saldos')
      .select('saldo')
      .eq('usuario_id', usuario_id)
      .eq('comercio_id', comercio_id)
      .maybeSingle()

    if (saldoError) {
      return NextResponse.json(
        { ok: false, error: saldoError.message },
        { status: 500 }
      )
    }

    const saldoAnterior = Number(saldoData?.saldo || 0)

    // 3. Validar canje contra saldo anterior
    if (canje > saldoAnterior) {
      return NextResponse.json(
        {
          ok: false,
          error: 'La descarga es mayor que los puntos disponibles',
          saldo_actual: saldoAnterior,
        },
        { status: 400 }
      )
    }

// 4. Calcular puntos generados
let puntosGenerados = 0

if (promo.tipo === 'porcentaje') {
  if (!importe || importe <= 0) {
    return NextResponse.json(
      { ok: false, error: 'monto_compra debe ser mayor a 0 para promociones por porcentaje' },
      { status: 400 }
    )
  }

  const porcentaje = Number(promo.valor || 0)
  puntosGenerados = Math.floor((importe * porcentaje) / 100)
}

if (promo.tipo === 'tramo') {
  if (!importe || importe <= 0) {
    return NextResponse.json(
      { ok: false, error: 'monto_compra debe ser mayor a 0 para promociones por tramo' },
      { status: 400 }
    )
  }

  const cadaMonto = Number(promo.cada_monto || 0)
  const puntosPorTramo = Number(promo.puntos_por_tramo || 0)

  if (cadaMonto > 0 && puntosPorTramo > 0) {
    puntosGenerados = Math.floor(importe / cadaMonto) * puntosPorTramo
  }
}

if (promo.tipo === 'puntos_fijos') {
  puntosGenerados = Number(promo.valor || 0)
}

if (puntosGenerados <= 0) {
  return NextResponse.json(
    {
      ok: false,
      error: 'La promoción seleccionada no genera puntos para esta operación',
    },
    { status: 400 }
  )
}

    // 5. Preparar movimientos de la operación
    const movimientosAInsertar = []

    if (canje > 0) {
      movimientosAInsertar.push({
        usuario_id,
        comercio_id,
        promocion_id: null,
        operacion_id: operacionId,
        tipo: 'canje',
        puntos: canje,
        monto_compra: importe,
        nro_ticket: ticketFinal,
        observaciones: observaciones || null,
        fecha: fechaAhora,
        estado: 'activo',
        es_reverso: false,
        movimiento_original_id: null,
        anulado_por_movimiento_id: null,
        anulado_en: null,
        anulado_por: null,
      })
    }

    movimientosAInsertar.push({
      usuario_id,
      comercio_id,
      promocion_id,
      operacion_id: operacionId,
      tipo: 'carga',
      puntos: puntosGenerados,
      monto_compra: importe,
      nro_ticket: ticketFinal,
      observaciones: observaciones || null,
      fecha: fechaAhora,
      estado: 'activo',
      es_reverso: false,
      movimiento_original_id: null,
      anulado_por_movimiento_id: null,
      anulado_en: null,
      anulado_por: null,
    })

    // 6. Insertar todos los movimientos de la operación
    const { error: insertError } = await supabaseAdmin
      .from('movimientos_puntos')
      .insert(movimientosAInsertar)

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      )
    }

    // 7. Leer saldo final
    const { data: saldoFinalData, error: saldoFinalError } = await supabaseAdmin
      .from('saldos')
      .select('saldo')
      .eq('usuario_id', usuario_id)
      .eq('comercio_id', comercio_id)
      .maybeSingle()

    if (saldoFinalError) {
      return NextResponse.json(
        { ok: false, error: saldoFinalError.message },
        { status: 500 }
      )
    }

    const { data: movimientosSaldo } = await supabaseAdmin
    .from("movimientos_puntos")
    .select("tipo, puntos, estado")
    .eq("usuario_id", usuario_id)
    .eq("comercio_id", comercio_id)

    const saldoFinal = (movimientosSaldo || [])
    .filter((m: any) => m.estado !== "anulado")
    .reduce((acc: number, m: any) => {
      const puntos = Number(m.puntos || 0)

    if (m.tipo === "carga") return acc + puntos
    if (m.tipo === "canje") return acc - puntos
    if (m.tipo === "reversion") return acc + puntos

    return acc
  }, 0)

    return NextResponse.json({
      ok: true,
      mensaje: 'Operación procesada correctamente',
      operacion_id: operacionId,
      saldo_anterior: saldoAnterior,
      puntos_canjeados: canje,
      puntos_generados: puntosGenerados,
      saldo_final: saldoFinal,
      nro_ticket: ticketFinal,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}