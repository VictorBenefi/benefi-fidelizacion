'use client'

import { useEffect, useState } from 'react'

type CampaignSettings = {
  portal_titulo?: string | null
  portal_descripcion?: string | null
  logo_comercio_url?: string | null
  color_sidebar?: string | null
  color_activo?: string | null
}

export function usePortalCampaign(slug?: string) {
  const [campaign, setCampaign] = useState<CampaignSettings>({})

  useEffect(() => {
    if (!slug) return

    const cargarCampania = async () => {
      try {
        const res = await fetch(`/api/campaign-settings?slug=${slug}`)
        const json = await res.json()

        if (json.ok && json.campaign) {
          setCampaign(json.campaign)
        }
      } catch (error) {
        console.error('Error cargando campaña:', error)
      }
    }

    cargarCampania()
  }, [slug])

  return campaign
}