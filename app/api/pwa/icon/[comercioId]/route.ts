import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  context: { params: Promise<{ comercioId: string }> }
) {
  try {
    const { comercioId } = await context.params

    const { searchParams } = new URL(request.url)

    const requestedSize = Number(searchParams.get('size'))
    const size = requestedSize === 192 ? 192 : 512

    const { data: comercio, error } = await supabaseAdmin
      .from('comercios')
      .select(`
        id,
        logo_url,
        campaign_id
      `)
      .eq('id', comercioId)
      .single()

    if (error || !comercio) {
      return NextResponse.json(
        { error: 'Comercio no encontrado' },
        { status: 404 }
      )
    }

    let logoUrl = comercio.logo_url || ''

    if (comercio.campaign_id) {
      const { data: campaign } = await supabaseAdmin
        .from('campaign_settings')
        .select('logo_comercio_url')
        .eq('id', comercio.campaign_id)
        .maybeSingle()

      if (campaign?.logo_comercio_url) {
        logoUrl = campaign.logo_comercio_url
      }
    }

    if (!logoUrl) {
      return NextResponse.json(
        { error: 'El comercio no tiene logo configurado' },
        { status: 404 }
      )
    }

    const logoResponse = await fetch(logoUrl)

    if (!logoResponse.ok) {
      throw new Error('No se pudo descargar el logo del comercio')
    }

    const logoBuffer = Buffer.from(
      await logoResponse.arrayBuffer()
    )

    const iconBuffer = await sharp(logoBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 1,
        },
      })
      .png()
      .toBuffer()

    return new NextResponse(new Uint8Array(iconBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Error generando icono PWA:', error)

    return NextResponse.json(
      { error: 'No se pudo generar el icono PWA' },
      { status: 500 }
    )
  }
}