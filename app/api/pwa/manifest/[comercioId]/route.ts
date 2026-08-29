import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  request: Request,
  context: { params: Promise<{ comercioId: string }> }
) {
  try {
    const { comercioId } = await context.params

    if (!comercioId) {
      return NextResponse.json(
        { error: 'Comercio no identificado' },
        { status: 400 }
      )
    }

    const { data: comercio, error } = await supabaseAdmin
      .from('comercios')
      .select(`
        id,
        nombre_fantasia,
        razon_social,
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

    let nombre =
      comercio.nombre_fantasia ||
      comercio.razon_social ||
      'Programa de beneficios'

    let logo = ''
    let colorPrincipal = '#1e3a8a'

    if (comercio.campaign_id) {
      const { data: campaign } = await supabaseAdmin
        .from('campaign_settings')
        .select(`
          nombre_campania,
          logo_comercio_url,
          color_sidebar
        `)
        .eq('id', comercio.campaign_id)
        .maybeSingle()

      if (campaign) {
        nombre =
          campaign.nombre_campania ||
          nombre

        logo =
          campaign.logo_comercio_url ||
          ''

        colorPrincipal =
          campaign.color_sidebar ||
          colorPrincipal
      }
    }

    const manifest = {
      name: `${nombre} Beneficios`,
      short_name: nombre,
      description: `Programa de beneficios de ${nombre}`,
      start_url: `/usuarios/${comercioId}/dashboard`,
      scope: `/usuarios/${comercioId}/`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: colorPrincipal,
      orientation: 'portrait',
      icons: logo
      ? [
          {
            src: `/api/pwa/icon/${comercioId}?size=192`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `/api/pwa/icon/${comercioId}?size=512`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ]
      : [],
        }

    return new NextResponse(
      JSON.stringify(manifest),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Error generando manifest PWA:', error)

    return NextResponse.json(
      { error: 'No se pudo generar el manifest' },
      { status: 500 }
    )
  }
}