'use client'

import { useEffect, useState } from 'react'
import {
  getCurrentComercioIdFromStorage,
  setCurrentComercioId,
} from '@/lib/getCurrentComercio'
import { getUserComercios, type ComercioActivo } from '@/lib/getUserComercios'

export default function ComercioSelector() {
  const [comercios, setComercios] = useState<ComercioActivo[]>([])
  const [activo, setActivo] = useState('')

  useEffect(() => {
    async function loadComercios() {
      const items = await getUserComercios()
      setComercios(items)

      const guardado = getCurrentComercioIdFromStorage()

      if (guardado && items.some((c) => c.id === guardado)) {
        setActivo(guardado)
        return
      }

      if (items.length > 0) {
        setActivo(items[0].id)
        setCurrentComercioId(items[0].id)
      }
    }

    loadComercios()
  }, [])

  if (comercios.length <= 1) {
    return null
  }

  return (
    <div
      style={{
        marginBottom: 18,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#6b7280',
          textTransform: 'uppercase',
          fontWeight: 800,
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        Comercio activo
      </div>

      <select
        value={activo}
        onChange={(e) => {
          const next = e.target.value
          setActivo(next)
          setCurrentComercioId(next)
          window.location.reload()
        }}
        style={{
          width: '100%',
          height: 42,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: '#ffffff',
          padding: '0 12px',
          fontSize: 14,
          outline: 'none',
        }}
      >
        {comercios.map((comercio) => (
          <option
            key={comercio.id}
            value={comercio.id}
            style={{ color: '#111827' }}
          >
            {comercio.razon_social || comercio.nombre || comercio.email || comercio.id}
          </option>
        ))}
      </select>
    </div>
  )
}