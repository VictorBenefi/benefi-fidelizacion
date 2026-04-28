import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const comercioId = String(body?.comercio_id || '').trim()

    if (!comercioId) {
      return NextResponse.json(
        { ok: false, error: 'Falta el comercio_id.' },
        { status: 400 }
      )
    }

    const { data: notificaciones, error: notificacionesError } = await supabaseAdmin
      .from('notificaciones')
      .select('id, titulo, mensaje, tipo, activa, created_at')
      .eq('comercio_id', comercioId)
      .order('created_at', { ascending: false })

    if (notificacionesError) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo obtener el historial.' },
        { status: 500 }
      )
    }

    const notificacionIds = (notificaciones || []).map((n: any) => n.id)

    if (!notificacionIds.length) {
      return NextResponse.json({ ok: true, historial: [] })
    }

    const { data: usuariosNotif, error: usuariosNotifError } = await supabaseAdmin
      .from('usuarios_notificaciones')
      .select('notificacion_id, leida')
      .in('notificacion_id', notificacionIds)

    if (usuariosNotifError) {
      return NextResponse.json(
        { ok: false, error: 'No se pudieron obtener los destinatarios.' },
        { status: 500 }
      )
    }

    const historial = (notificaciones || []).map((notif: any) => {
      const relacionados = (usuariosNotif || []).filter(
        (item: any) => item.notificacion_id === notif.id
      )

      const destinatarios = relacionados.length
      const leidas = relacionados.filter((item: any) => item.leida).length
      const pendientes = destinatarios - leidas

      return {
        notificacion_id: notif.id,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        tipo: notif.tipo,
        activa: notif.activa,
        created_at: notif.created_at,
        destinatarios,
        leidas,
        pendientes,
      }
    })

    return NextResponse.json({ ok: true, historial })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: 'Ocurrió un error inesperado al cargar el historial.' },
      { status: 500 }
    )
  }
}
