'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type TerminalAcceso = {
  id: string
  comercio_id: string
  nombre_sucursal: string
  comercio: string | null
  logo_url: string | null
}

export default function TerminalAccesoLoginPage() {
  const params = useParams()

  const terminalId = String(
    params?.terminalId || ''
  ).trim()

  const [terminal, setTerminal] =
    useState<TerminalAcceso | null>(null)

  const [pin, setPin] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [ingresando, setIngresando] = useState(false)

  useEffect(() => {
    async function cargarTerminal() {
      if (!terminalId) {
        setMensaje('No se encontró la terminal')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(
          `/api/terminal/acceso?terminal_id=${terminalId}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!res.ok || !data.ok) {
          setMensaje(
            data.error ||
              'No se pudo identificar la terminal'
          )
          return
        }

        setTerminal(data.terminal)
      } catch (error) {
        console.error(error)
        setMensaje(
          'Ocurrió un error al cargar la terminal'
        )
      } finally {
        setLoading(false)
      }
    }

    cargarTerminal()
  }, [terminalId])

  const ingresar = async () => {
    setMensaje('')

    if (!terminal) {
      setMensaje('No se encontró la terminal')
      return
    }

    if (!pin.trim()) {
      setMensaje('Ingresá el PIN')
      return
    }

    try {
      setIngresando(true)

      const res = await fetch('/api/terminal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terminal_id: terminal.id,
          pin: pin.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setMensaje(
          data.error || 'PIN incorrecto'
        )
        return
      }

      if (data.terminal.id !== terminal.id) {
        setMensaje(
          'El PIN no corresponde a esta terminal'
        )
        return
      }

      sessionStorage.setItem(
        'benefi_terminal',
        JSON.stringify(data.terminal)
      )

      window.location.href = '/terminal'
    } catch (error) {
      console.error(error)
      setMensaje(
        'Ocurrió un error al ingresar'
      )
    } finally {
      setIngresando(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#64748b',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Cargando terminal...
      </div>
    )
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
          boxShadow:
            '0 18px 40px rgba(15, 23, 42, 0.10)',
        }}
      >
        {terminal && (
            <>
            <div
            style={{
                textAlign: 'center',
                marginBottom: 26,
            }}
            >
            {terminal.logo_url && (
                <img
                src={terminal.logo_url}
                alt={terminal.comercio || 'Comercio'}
                style={{
                    maxWidth: 150,
                    maxHeight: 70,
                    objectFit: 'contain',
                    marginBottom: 16,
                }}
                />
            )}

            <div
                style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
                }}
            >
                Terminal de fidelización
            </div>

            <h1
                style={{
                margin: 0,
                color: '#0f172a',
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1.15,
                }}
            >
                {terminal.comercio || 'Comercio'}
            </h1>

            <div
                style={{
                marginTop: 8,
                fontSize: 17,
                fontWeight: 600,
                color: '#64748b',
                }}
            >
                {terminal.nombre_sucursal}
            </div>

            <p
                style={{
                margin: '18px 0 0',
                color: '#64748b',
                fontSize: 14,
                lineHeight: '20px',
                }}
            >
                Ingresá el PIN asignado a esta sucursal para continuar.
            </p>
            </div>
        </>
        )}

        
        {!terminal && mensaje && (
          <div
            style={{
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

        {terminal && (
          <>
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
                setPin(
                  e.target.value.replace(/\D/g, '')
                )
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
              disabled={ingresando}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: ingresando
                  ? '#94a3b8'
                  : '#2563eb',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 800,
                cursor: ingresando
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {ingresando
                ? 'Ingresando...'
                : 'Ingresar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}