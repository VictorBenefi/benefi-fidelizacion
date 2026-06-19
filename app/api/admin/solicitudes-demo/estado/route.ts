import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    const estadosValidos = [
      'pendiente',
      'produccion_prueba',
      'produccion_definitiva',
      'vencido',
    ]

    if (!body.id || !estadosValidos.includes(body.estado)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    const updateData: any = {
      estado: body.estado,
    }

    if (body.estado === 'produccion_prueba') {
      const hoy = new Date()
      const fin = new Date()
      fin.setDate(hoy.getDate() + 30)

      updateData.fecha_inicio_trial = hoy.toISOString().slice(0, 10)
      updateData.fecha_fin_trial = fin.toISOString().slice(0, 10)
      updateData.convertido_pago = false
    }

    if (body.estado === 'produccion_definitiva') {
      updateData.convertido_pago = true
    }

    const { data, error } = await supabaseAdmin
      .from('solicitudes_demo')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: 'Error al cambiar el estado' },
      { status: 500 }
    )
  }
}