import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      )
    }

    if (file.type !== 'image/png') {
      return NextResponse.json(
        { error: 'El logo debe estar en formato PNG' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extension = file.name.split('.').pop()

    const nombreArchivo =
    `solicitudes-demo/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('campaign-assets')
      .upload(nombreArchivo, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 }
      )
    }

    const { data } = supabaseAdmin.storage
      .from('campaign-assets')
      .getPublicUrl(nombreArchivo)

    return NextResponse.json({
      logo_url: data.publicUrl,
      path: nombreArchivo,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al subir el logo' },
      { status: 500 }
    )
  }
}