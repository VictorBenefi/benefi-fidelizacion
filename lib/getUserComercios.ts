import { supabaseClient } from '@/lib/supabaseClient'

export type ComercioActivo = {
  id: string
  razon_social?: string | null
  nombre?: string | null
  email?: string | null
  campaign_id?: string | null
  auth_user_id?: string | null
}

export async function getUserComercios(): Promise<ComercioActivo[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabaseClient.auth.getSession()

  console.log('SESSION ERROR:', sessionError)
  console.log('SESSION USER:', session?.user)

  if (sessionError || !session?.user) {
    return []
  }

  const authUserId = session.user.id
  console.log('AUTH USER ID EN SESIÓN:', authUserId)

  const res = await fetch(
    `/api/auth/comercios-por-auth?auth_user_id=${authUserId}`
  )

  const raw = await res.text()
  console.log('RAW API RESPONSE:', raw)

  let json: any = null
  try {
    json = JSON.parse(raw)
  } catch (e) {
    console.error('La API no devolvió JSON válido')
    return []
  }

  console.log('JSON API RESPONSE:', json)

  if (!res.ok || !json?.comercios) {
    return []
  }

  return json.comercios
}