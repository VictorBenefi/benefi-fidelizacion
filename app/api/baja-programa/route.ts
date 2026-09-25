import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PROGRAMAS: Record<string, string> = {
  petrasol: 'PETRASOL',
  clubdiez: 'CLUB DIEZ',
  bocata: 'BOCATA',
  laslomas: 'LAS LOMAS',
  octano: 'OCTANO',
  hiperunico: 'HIPER ÚNICO',
}
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { programa_slug, nombre_apellido, dni, email } = body

    const slug = String(programa_slug || '')
      .trim()
      .toLowerCase()

    const programaNombre = PROGRAMAS[slug]

    if (!programaNombre) {
      return NextResponse.json(
        { error: 'Programa no válido.' },
        { status: 400 }
      )
    }

    if (!dni || !String(dni).trim()) {
    return NextResponse.json(
        { error: 'El DNI es obligatorio.' },
        { status: 400 }
    )
    }

    const { error } = await supabaseAdmin
      .from('bajas_ahorro_plus')
      .insert({
        programa_slug: slug,
        programa_nombre: programaNombre,
        nombre_apellido: nombre_apellido
        ? String(nombre_apellido).trim()
        : '',
        dni: String(dni).trim(),
        email: email
        ? String(email).trim().toLowerCase()
        : '',
        estado: 'pendiente',
      })

    if (error) {
      console.error('Error registrando solicitud de baja:', error)

      return NextResponse.json(
        { error: 'No se pudo registrar la solicitud.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error en baja-programa:', error)

    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud.' },
      { status: 500 }
    )
  }
}