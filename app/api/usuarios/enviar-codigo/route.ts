import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = String(body.email || '').trim().toLowerCase()
    const comercioId = String(body.comercio_id || '').trim()

    if (!email || !comercioId) {
      return NextResponse.json(
        { ok: false, error: 'Email y comercio son obligatorios.' },
        { status: 400 }
      )
    }

    const formatoEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formatoEmailValido.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Ingresá un email válido.' },
        { status: 400 }
      )
    }

    const { data: comercio, error: comercioError } = await supabaseAdmin
      .from('comercios')
      .select('nombre_fantasia, razon_social')
      .eq('id', comercioId)
      .maybeSingle()

    if (comercioError || !comercio) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo identificar el comercio.' },
        { status: 404 }
      )
    }

    const nombreComercio =
      comercio.nombre_fantasia ||
      comercio.razon_social ||
      'BENEFI'

    const codigo = Math.floor(100000 + Math.random() * 900000).toString()

    const expiraEn = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidamos códigos anteriores pendientes para este email/comercio.
    const { error: invalidarError } = await supabaseAdmin
      .from('verificaciones_email')
      .update({ verificado: true })
      .eq('email', email)
      .eq('comercio_id', comercioId)
      .eq('verificado', false)

    if (invalidarError) {
      console.error('Error invalidando códigos anteriores:', invalidarError)
    }

    const { data: verificacion, error: guardarError } = await supabaseAdmin
      .from('verificaciones_email')
      .insert({
        email,
        comercio_id: comercioId,
        codigo,
        expira_en: expiraEn,
        verificado: false,
        intentos: 0,
      })
      .select('id')
      .single()

    if (guardarError || !verificacion) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo generar el código de verificación.',
        },
        { status: 500 }
      )
    }

    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MAILTRAP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL,
          name: nombreComercio || process.env.MAILTRAP_FROM_NAME || 'BENEFI',
        },
        to: [
          {
            email,
          },
        ],
        subject: `Código de verificación - ${nombreComercio}`,
        text: `Tu código de verificación es ${codigo}. Vence en 10 minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
            <h2 style="margin-bottom: 12px;">
              Verificá tu correo
            </h2>

            <p>
              Recibimos una solicitud para registrarte en el programa de beneficios de
              <strong>${nombreComercio}</strong>.
            </p>

            <p>Tu código de verificación es:</p>

            <div
              style="
                margin: 24px 0;
                padding: 18px;
                background: #f1f5f9;
                border-radius: 12px;
                text-align: center;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
              "
            >
              ${codigo}
            </div>

            <p>
              El código vence en <strong>10 minutos</strong>.
            </p>

            <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
              Si no solicitaste este registro, podés ignorar este correo.
            </p>

            <p style="margin-top: 24px;">
              Equipo de ${nombreComercio}
            </p>
          </div>
        `,
        category: 'Verificacion registro',
      }),
    })

    const mailData = await response.json()

    if (!response.ok) {
      console.error('Error Mailtrap:', mailData)

      // Si el email no pudo enviarse, eliminamos el código que acabamos de crear.
      await supabaseAdmin
        .from('verificaciones_email')
        .delete()
        .eq('id', verificacion.id)

      return NextResponse.json(
        { ok: false, error: 'No se pudo enviar el código al email.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Código enviado correctamente.',
    })
  } catch (error) {
    console.error('Error enviando código de verificación:', error)

    return NextResponse.json(
      { ok: false, error: 'Ocurrió un error al enviar el código.' },
      { status: 500 }
    )
  }
}