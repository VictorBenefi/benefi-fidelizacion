import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const terminalId = String(
      searchParams.get('terminal_id') || ''
    ).trim()

    if (!terminalId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'terminal_id es obligatorio',
        },
        { status: 400 }
      )
    }

    const { data: terminal, error: terminalError } =
      await supabaseAdmin
        .from('terminales')
        .select(
          'id, comercio_id, nombre_sucursal, activa'
        )
        .eq('id', terminalId)
        .maybeSingle()

    if (terminalError) {
      console.error(
        'Error buscando terminal:',
        terminalError
      )

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo obtener la terminal',
        },
        { status: 500 }
      )
    }

    if (!terminal) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Terminal no encontrada',
        },
        { status: 404 }
      )
    }

    if (!terminal.activa) {
      return NextResponse.json(
        {
          ok: false,
          error: 'La terminal está inactiva',
        },
        { status: 403 }
      )
    }

    const { data: comercio, error: comercioError } =
    await supabaseAdmin
      .from('comercios')
      .select('nombre_fantasia, campaign_id')
      .eq('id', terminal.comercio_id)
      .maybeSingle()

    if (comercioError) {
      console.error(
        'Error buscando comercio:',
        comercioError
      )

      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo obtener el comercio',
        },
        { status: 500 }
      )
    }
    let branding = {
  logo_comercio_url: null as string | null,
  color_activo: null as string | null,
  color_fondo: null as string | null,
  powered_by_texto: null as string | null,
}

if (comercio?.campaign_id) {
  const { data: campaign, error: campaignError } =
    await supabaseAdmin
      .from('campaign_settings')
      .select(
        'logo_comercio_url, color_activo, color_fondo, powered_by_texto'
      )
      .eq('id', comercio.campaign_id)
      .maybeSingle()

  if (campaignError) {
    console.error(
      'Error buscando branding de la campaña:',
      campaignError
    )
  }

  if (campaign) {
    branding = {
      logo_comercio_url:
        campaign.logo_comercio_url || null,
      color_activo:
        campaign.color_activo || null,
      color_fondo:
        campaign.color_fondo || null,
      powered_by_texto:
        campaign.powered_by_texto || null,
    }
  }
}

    return NextResponse.json({
      ok: true,
      terminal: {
        id: terminal.id,
        comercio_id: terminal.comercio_id,
        nombre_sucursal: terminal.nombre_sucursal,
        comercio: comercio?.nombre_fantasia || null,
        logo_url: branding.logo_comercio_url,
        color_activo: branding.color_activo,
        color_fondo: branding.color_fondo,
        powered_by_texto: branding.powered_by_texto,
      },
    })
  } catch (error) {
    console.error(
      'Error acceso terminal:',
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          'Ocurrió un error al obtener la terminal',
      },
      { status: 500 }
    )
  }
}