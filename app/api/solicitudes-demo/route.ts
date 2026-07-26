import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('BODY COMPLETO')
    console.log(body)
    console.log(
      'Promociones recibidas API:',
      body.promociones_iniciales
    )
    console.log(

'Insertando en BD',

{

promociones_iniciales:
body.promociones_iniciales

}

)
    const { data, error } = await supabaseAdmin
      .from('solicitudes_demo')
      .insert({
        nombre_fantasia: body.nombre_fantasia,
        razon_social: body.razon_social,
        cuit: body.cuit,
        rubro: body.rubro,
        direccion: body.direccion,
        ciudad: body.ciudad,
        provincia: body.provincia,

        responsable_nombre: body.responsable_nombre,
        email: body.email,
        telefono: body.telefono,
        whatsapp: body.whatsapp,

        nombre_programa: body.nombre_programa,
        comentarios: body.comentarios,
        logo_url: body.logo_url,
        promociones_iniciales: body.promociones_iniciales || [],
      })
      .select()
      .single()
      console.log('DATA DEVUELTA POR SUPABASE')
      console.log(data)

      console.log('PROMOCIONES GUARDADAS')
      console.log(data?.promociones_iniciales)
      console.log(

      'Registro guardado',

      data

      )
      if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    try {
      await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MAILTRAP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: process.env.MAILTRAP_FROM_EMAIL,
            name: process.env.MAILTRAP_FROM_NAME || 'BENEFI',
          },
          to: [{ email: body.email }],
          subject: 'Recibimos tu solicitud para probar BENEFI 🎉',
          text: `Hola ${body.responsable_nombre}, recibimos correctamente la solicitud de ${body.nombre_fantasia} para probar BENEFI.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 640px; margin: auto; color: #0f172a;">
              <h2>¡Bienvenido a BENEFI! 🎉</h2>
              <p>Hola ${body.responsable_nombre || ''},</p>
              <p>Recibimos correctamente la solicitud de <strong>${body.nombre_fantasia}</strong> para probar nuestro sistema de puntos durante 30 días.</p>
              <p>En las próximas horas revisaremos la información y nos pondremos en contacto para avanzar con la activación.</p>
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin:24px 0;">
                <h3 style="margin-top:0;">Tu prueba incluye:</h3>
                <ul style="padding-left:20px; line-height:1.8;">
                  <li>Configuración inicial del programa</li>
                  <li>Carga del logo del comercio</li>
                  <li>Hasta 3 promociones iniciales</li>
                  <li>URL pública para registro de usuarios</li>
                  <li>Código QR para registro de usuarios</li>
                  <li>Panel para carga y canje de puntos</li>
                  <li>Reportes y movimientos del programa</li>
                </ul>
              </div>
              <p>Gracias por confiar en BENEFI.</p>
              <p style="font-size:12px; color:#64748b; margin-top:28px;">Equipo BENEFI</p>
            </div>
          `,
          category: 'Solicitud prueba gratis',
        }),
      })

      await fetch('https://send.api.mailtrap.io/api/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MAILTRAP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: process.env.MAILTRAP_FROM_EMAIL,
            name: 'BENEFI',
          },

          to: [
            {
              email: process.env.NOTIFICACION_SOLICITUD_EMAIL,
            },
          ],

          subject: `🚀 Nuevo comercio interesado: ${body.nombre_fantasia}`,

          html: `
            <div style="font-family:Arial,sans-serif;padding:30px;color:#0f172a;max-width:700px">

              <h2 style="margin-bottom:20px;">
                Nuevo comercio interesado en BENEFI
              </h2>

              <table style="width:100%;border-collapse:collapse">

                <tr>
                  <td style="padding:8px;font-weight:bold;">Comercio</td>
                  <td>${body.nombre_fantasia}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">Razón social</td>
                  <td>${body.razon_social}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">CUIT</td>
                  <td>${body.cuit}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">Rubro</td>
                  <td>${body.rubro}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">Ciudad</td>
                  <td>${body.ciudad}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">Provincia</td>
                  <td>${body.provincia}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">Responsable</td>
                  <td>${body.responsable_nombre}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">Email</td>
                  <td>${body.email}</td>
                </tr>

                <tr>
                  <td style="padding:8px;font-weight:bold;">WhatsApp</td>
                  <td>${body.whatsapp}</td>
                </tr>

              </table>

              <div
                style="
                  margin-top:30px;
                  padding:18px;
                  background:#f8fafc;
                  border-radius:12px;
                "
              >

                Ingresá al Backoffice para revisar la solicitud
                y comenzar la configuración del comercio.

              </div>

            </div>
          `,

          category: 'Notificación interna',
        }),
      })
    } catch (emailError) {
      console.error('Solicitud guardada, pero falló el email:', emailError)
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar la solicitud' },
      { status: 500 }
    )
  }
}