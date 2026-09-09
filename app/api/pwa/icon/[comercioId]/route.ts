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
        nombre_fantasia,
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

    const padding = Math.round(size * 0.18)
    const logoSize = size - padding * 2

    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 0,
        },
      })
      .png()
      .toBuffer()

    const esCorcho =
    comercio.id === '08d07a59-4874-4bc4-9bfc-39436fe426ba'

  const backgroundColor = esCorcho
    ? {
        r: 162,
        g: 116,
        b: 65,
        alpha: 1,
      }
    : {
        r: 255,
        g: 255,
        b: 255,
        alpha: 1,
      }

    const iconBuffer = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: backgroundColor,
      },
    })
      .composite([
        {
          input: resizedLogo,
          gravity: 'center',
        },
      ])
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