import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, nombre_completo, dni, telefono, comercio_id } = body

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      return NextResponse.json({ ok: false, error: authError.message })
    }

    const userId = authUser.user.id

    await supabaseAdmin.from('usuarios').insert({
      id: userId,
      nombre_completo,
      dni,
      email,
      telefono,
      auth_user_id: userId,
    })

    await supabaseAdmin.from('usuarios_comercios').insert({
      usuario_id: userId,
      comercio_id,
    })

    await supabaseAdmin.from('saldos').insert({
      usuario_id: userId,
      comercio_id,
      saldo: 0,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}