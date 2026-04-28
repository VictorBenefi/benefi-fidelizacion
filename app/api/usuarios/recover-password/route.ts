import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '').trim()

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const { data: usuario, error: errorUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id, email')
      .eq('email', email)
      .maybeSingle()

    if (errorUsuario) {
      return NextResponse.json(
        { ok: false, error: errorUsuario.message },
        { status: 500 }
      )
    }

    if (!usuario) {
      return NextResponse.json(
        { ok: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const authUserId = usuario.auth_user_id || usuario.id

    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
      })

    if (authUpdateError) {
      return NextResponse.json(
        { ok: false, error: authUpdateError.message },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('usuarios')
      .update({ password })
      .eq('id', usuario.id)

    return NextResponse.json({
      ok: true,
      message: 'Contraseña actualizada correctamente',
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}