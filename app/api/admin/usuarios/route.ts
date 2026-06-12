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
      .select('usuario_id, comercio_id')

    if (relError) {
      return NextResponse.json({ error: relError.message }, { status: 500 })
    }

    // 3. Traer comercios
    const { data: comercios, error: comerciosError } = await supabaseAdmin
      .from('comercios')
      .select('id, nombre_fantasia, razon_social')

    if (comerciosError) {
      return NextResponse.json({ error: comerciosError.message }, { status: 500 })
    }

    // 4. Mapa comercio_id → nombre
    const mapaComercios: Record<string, string> = {}

    comercios?.forEach((c: any) => {
      mapaComercios[c.id] =
        c.nombre_fantasia ||
        c.razon_social ||
        'Sin nombre'
    })

    // 5. Mapa usuario_id → comercios
    const mapaUsuarios: Record<string, string[]> = {}

    relaciones?.forEach((rel: any) => {
      const nombreComercio =
        mapaComercios[rel.comercio_id] || 'Sin comercio'

      if (!mapaUsuarios[rel.usuario_id]) {
        mapaUsuarios[rel.usuario_id] = []
      }

      mapaUsuarios[rel.usuario_id].push(nombreComercio)
    })

    // 6. Respuesta final
    const resultado = (usuarios || []).map((u: any) => ({
      ...u,
      comercio_nombre: mapaUsuarios[u.id]?.join(', ') || 'Sin comercio',
    }))

    return NextResponse.json({ ok: true, usuarios: resultado })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}