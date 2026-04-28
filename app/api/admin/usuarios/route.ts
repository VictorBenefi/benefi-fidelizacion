import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // 1. Traer usuarios
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (usuariosError) {
      return NextResponse.json({ error: usuariosError.message }, { status: 500 })
    }

    // 2. Traer relaciones usuario-comercio
    const { data: relaciones, error: relError } = await supabaseAdmin
      .from('usuarios_comercios')
      .select(`
        usuario_id,
        comercios (
          nombre_fantasia,
          razon_social
        )
      `)

    if (relError) {
      return NextResponse.json({ error: relError.message }, { status: 500 })
    }

    // 3. Armar mapa usuario → comercios
    const mapa: Record<string, string[]> = {}

    relaciones?.forEach((rel: any) => {
      const nombre =
        rel.comercios?.nombre_fantasia ||
        rel.comercios?.razon_social ||
        'Sin nombre'

      if (!mapa[rel.usuario_id]) {
        mapa[rel.usuario_id] = []
      }

      mapa[rel.usuario_id].push(nombre)
    })

    // 4. Armar respuesta final
    const resultado = usuarios.map((u: any) => ({
      ...u,
      comercio_nombre: mapa[u.id]?.join(', ') || 'Sin comercio',
    }))

    return NextResponse.json({ ok: true, usuarios: resultado })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}