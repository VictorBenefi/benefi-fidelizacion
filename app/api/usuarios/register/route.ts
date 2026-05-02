import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'



async function enviarBienvenida({
  email,
  nombre,
  comercio,
  comercioId,
}: {
  email: string
  nombre: string
  comercio: string
  comercioId: string
}) {
  console.log("ENTRO A enviarBienvenida", { email, nombre, comercio })

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")

    console.log("BASE URL EMAIL:", baseUrl)

    const response = await fetch(`${baseUrl}/api/emails/bienvenida`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        nombre,
        comercio,
        comercioId,
      }),
    })

    const data = await response.json()

    console.log("RESPUESTA EMAIL:", data)

    if (!response.ok) {
      console.error("ERROR RESPUESTA EMAIL:", data)
    }
  } catch (error) {
    console.error("Error enviando email bienvenida:", error)
  }
}

export async function POST(req: Request) {
  let createdAuthUserId: string | null = null

  try {
    const body = await req.json()

    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '').trim()
    const nombre_completo = String(body.nombre_completo || '').trim()
    const dni = String(body.dni || '').trim()
    const telefono = String(body.telefono || '').trim()
    const comercio_id = String(body.comercio_id || '').trim()

    if (!email || !password || !nombre_completo || !dni || !comercio_id) {
      return NextResponse.json(
        { ok: false, error: 'Faltan datos obligatorios.' },
        { status: 400 }
      )
    }

    const { data: usuarioExistente } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, dni, auth_user_id')
      .eq('dni', dni)
      .maybeSingle()

    if (usuarioExistente) {
      const { data: relacionExistente } = await supabaseAdmin
        .from('usuarios_comercios')
        .select('id')
        .eq('usuario_id', usuarioExistente.id)
        .eq('comercio_id', comercio_id)
        .maybeSingle()

      if (!relacionExistente) {
        const { error: relacionError } = await supabaseAdmin
          .from('usuarios_comercios')
          .insert({
            usuario_id: usuarioExistente.id,
            comercio_id,
          })

        if (relacionError) {
          return NextResponse.json(
            { ok: false, error: `No se pudo vincular el usuario al comercio: ${relacionError.message}` },
            { status: 400 }
          )
        }
      }

      const { data: saldoExistente } = await supabaseAdmin
        .from('saldos')
        .select('id')
        .eq('usuario_id', usuarioExistente.id)
        .eq('comercio_id', comercio_id)
        .maybeSingle()

      if (!saldoExistente) {
        const { error: saldoError } = await supabaseAdmin
          .from('saldos')
          .insert({
            usuario_id: usuarioExistente.id,
            comercio_id,
            saldo: 0,
          })

        if (saldoError) {
          return NextResponse.json(
            { ok: false, error: `No se pudo crear el saldo inicial: ${saldoError.message}` },
            { status: 400 }
          )
        }
      }

      return NextResponse.json({
        ok: true,
        usuario_id: usuarioExistente.id,
        usuario_existente: true,
      })
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError || !authUser?.user?.id) {
      return NextResponse.json(
        { ok: false, error: authError?.message || 'No se pudo crear el usuario.' },
        { status: 400 }
      )
    }

    createdAuthUserId = authUser.user.id

    const { error: usuarioError } = await supabaseAdmin.from('usuarios').insert({
      id: createdAuthUserId,
      nombre_completo,
      dni,
      email,
      telefono,
      auth_user_id: createdAuthUserId,
    })

    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)

      return NextResponse.json(
        { ok: false, error: `No se pudo guardar el usuario: ${usuarioError.message}` },
        { status: 400 }
      )
    }

    console.log("VOY A ENVIAR EMAIL BIENVENIDA", {
    email,
    nombre_completo,
    comercio_id,
    })
    
    const { data: comercioData, error: comercioError } = await supabaseAdmin
      .from("comercios")
      .select("nombre_fantasia, razon_social, email")
      .eq("id", comercio_id)
      .maybeSingle()

    console.log("COMERCIO DATA:", comercioData)
    console.log("COMERCIO ERROR:", comercioError)

    const nombreComercio =
      comercioData?.nombre_fantasia ||
      comercioData?.razon_social ||
      comercioData?.email ||
      "tu comercio"

    await enviarBienvenida({
      email,
      nombre: nombre_completo,
      comercio: nombreComercio,
      comercioId: comercio_id,
    })
    
    const { error: relacionError } = await supabaseAdmin
      .from('usuarios_comercios')
      .insert({
        usuario_id: createdAuthUserId,
        comercio_id,
      })

    if (relacionError) {
      await supabaseAdmin.from('usuarios').delete().eq('id', createdAuthUserId)
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)

      return NextResponse.json(
        { ok: false, error: `No se pudo vincular el usuario al comercio: ${relacionError.message}` },
        { status: 400 }
      )
    }

    const { error: saldoError } = await supabaseAdmin.from('saldos').insert({
      usuario_id: createdAuthUserId,
      comercio_id,
      saldo: 0,
    })

    if (saldoError) {
      await supabaseAdmin
        .from('usuarios_comercios')
        .delete()
        .eq('usuario_id', createdAuthUserId)
        .eq('comercio_id', comercio_id)

      await supabaseAdmin.from('usuarios').delete().eq('id', createdAuthUserId)
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)

      return NextResponse.json(
        { ok: false, error: `No se pudo crear el saldo inicial: ${saldoError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, usuario_id: createdAuthUserId })
  } catch (e: any) {
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
    }

    return NextResponse.json(
      { ok: false, error: e?.message || 'Ocurrió un error al registrar el usuario.' },
      { status: 500 }
    )
  }
}