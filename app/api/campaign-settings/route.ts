import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const slug = searchParams.get('slug') || 'club-diez'

    const { data, error } = await supabaseAdmin
      .from('campaign_settings')
      .select('*')
      .eq('slug', slug)
      .eq('activa', true)
      .single()

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, campaign: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      campaign: data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || 'Error interno', campaign: null },
      { status: 500 }
    )
  }
}