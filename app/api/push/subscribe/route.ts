import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } =
      await getAuthenticatedUser(req)

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error:
            authError ||
            'Usuario no autenticado.',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    const {
      usuario_id,
      comercio_id,
      endpoint,
      p256dh,
      auth,
    } = body

    if (
      !usuario_id ||
      !comercio_id ||
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        { error: 'Faltan datos de la suscripción' },
        { status: 400 }
      )
    }

    const { data: usuario, error: usuarioError } =
      await supabaseAdmin
        .from('usuarios')
        .select('id, auth_user_id')
        .eq('id', usuario_id)
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (usuarioError) {
      console.error(
        'Error validando usuario de la suscripción Push:',
        usuarioError
      )

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo validar el usuario.',
        },
        { status: 500 }
      )
    }

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error: 'El usuario no corresponde a la sesión autenticada.',
        },
        { status: 403 }
      )
    }

    const {
      data: usuarioComercio,
      error: usuarioComercioError,
    } = await supabaseAdmin
      .from('usuarios_comercios')
      .select('usuario_id, comercio_id')
      .eq('usuario_id', usuario.id)
      .eq('comercio_id', comercio_id)
      .maybeSingle()

    if (usuarioComercioError) {
      console.error(
        'Error validando vínculo usuario-comercio:',
        usuarioComercioError
      )

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo validar el comercio del usuario.',
        },
        { status: 500 }
      )
    }

    if (!usuarioComercio) {
      return NextResponse.json(
        {
          ok: false,
          error: 'El usuario no pertenece a este comercio.',
        },
        { status: 403 }
      )
    }

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          usuario_id,
          comercio_id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
        }
      )

    if (error) {
      console.error(
        'Error guardando suscripción Push:',
        error
      )

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    console.error(
      'Error en /api/push/subscribe:',
      error
    )

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}