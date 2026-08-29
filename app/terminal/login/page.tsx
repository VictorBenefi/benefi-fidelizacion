'use client'

import { useEffect, useState } from 'react'
import { getCurrentComercio } from '@/lib/getCurrentComercio'

export default function TerminalLoginPage() {
  const [comercioId, setComercioId] = useState('')
  const [pin, setPin] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function cargarComercio() {
      try {
        const comercio = await getCurrentComercio()

        if (comercio?.id) {
          setComercioId(comercio.id)
          return
        }

        setMensaje('No se encontró el comercio asociado')
      } catch (error) {
        console.error(error)
        setMensaje('No se pudo identificar el comercio')
      }
    }

    cargarComercio()
  }, [])

  const ingresar = async () => {
    setMensaje('')

    if (!comercioId) {
      setMensaje('No se encontró el comercio')
      return
    }

    if (!pin.trim()) {
      setMensaje('Ingresá el PIN')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/terminal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comercio_id: comercioId,
          pin: pin.trim(),
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        setMensaje(data.error || 'PIN incorrecto')
        return
      }

      sessionStorage.setItem(
        'benefi_terminal',
        JSON.stringify(data.terminal)
      )

      window.location.href = '/terminal'
    } catch (error) {
      console.error(error)
      setMensaje('Ocurrió un error al ingresar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 20,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 22,
          padding: 28,
          border: '1px solid #e2e8f0',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#2563eb',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Terminal BENEFI
        </div>

        <h1
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 30,
            color: '#0f172a',
          }}
        >
          Ingresar a la terminal
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 24,
            color: '#64748b',
            fontSize: 14,
            lineHeight: '20px',
          }}
        >
          Ingresá el PIN asignado a esta sucursal.
        </p>

        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 700,
            color: '#334155',
          }}
        >
          PIN
        </label>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, ''))
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void ingresar()
            }
          }}
          placeholder="••••"
          style={{
            width: '100%',
            height: 54,
            borderRadius: 14,
            border: '1px solid #cbd5e1',
            padding: '0 16px',
            fontSize: 24,
            letterSpacing: 8,
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />

        {mensaje && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {mensaje}
          </div>
        )}

        <button
          type="button"
          onClick={ingresar}
          disabled={loading}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}