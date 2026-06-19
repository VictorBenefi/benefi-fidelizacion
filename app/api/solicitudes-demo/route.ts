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

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar la solicitud' },
      { status: 500 }
    )
  }
}