import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('bajas_ahorro_plus')
      .select(`
        id,
        programa_slug,
        programa_nombre,
        nombre_apellido,
        dni,
        email,
        estado,
        created_at,
        processed_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando bajas Ahorro Plus:', error)

      return NextResponse.json(
        { error: 'No se pudieron cargar las solicitudes.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
    })
  } catch (error) {
    console.error('Error en bajas Ahorro Plus:', error)

    return NextResponse.json(
      { error: 'No se pudieron cargar las solicitudes.' },
      { status: 500 }
    )
  }
}