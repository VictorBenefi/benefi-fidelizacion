import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function PATCH(request: Request) {
  try {
    const { id, estado } = await request.json()

    if (!id || !['pendiente', 'procesada'].includes(estado)) {
      return NextResponse.json(
        { error: 'Datos inválidos.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('bajas_ahorro_plus')
      .update({
        estado,
        processed_at:
          estado === 'procesada'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando solicitud:', error)

      return NextResponse.json(
        { error: 'No se pudo actualizar la solicitud.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error actualizando baja:', error)

    return NextResponse.json(
      { error: 'No se pudo actualizar la solicitud.' },
      { status: 500 }
    )
  }
}