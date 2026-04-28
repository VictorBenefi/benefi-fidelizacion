import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const auth_user_id = searchParams.get('auth_user_id')

    if (!auth_user_id) {
      return NextResponse.json({ ok: false, error: 'Falta auth_user_id' })
    }

    // 1. Buscar usuario interno
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', auth_user_id)
      .single()

    if (userError || !usuario) {
      return NextResponse.json({
        ok: false,
        error: 'Usuario no encontrado'
      })
    }

    // 2. Buscar comercios vinculados
    const { data: relaciones, error: relError } = await supabaseAdmin
      .from('usuarios_comercios')
      .select('comercio_id')
      .eq('usuario_id', usuario.id)

    if (relError) {
      return NextResponse.json({
        ok: false,
        error: 'Error buscando relaciones'
      })
    }

    const comercioIds = relaciones?.map(r => r.comercio_id) || []

    if (comercioIds.length === 0) {
      return NextResponse.json({
        ok: true,
        usuario,
        comercios: []
      })
    }

    // 3. Traer comercios
    const { data: comercios, error: comError } = await supabaseAdmin
      .from('comercios')
      .select('*')
      .in('id', comercioIds)

    if (comError) {
      return NextResponse.json({
        ok: false,
        error: 'Error buscando comercios'
      })
    }

    return NextResponse.json({
      ok: true,
      usuario,
      comercios
    })

  } catch (error) {
    console.error('ERROR API comercios-por-auth:', error)

    return NextResponse.json({
      ok: false,
      error: 'Error interno'
    })
  }
}