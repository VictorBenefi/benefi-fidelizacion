'use client'

export default function TerminalLoginPage() {
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
          maxWidth: 460,
          background: '#ffffff',
          borderRadius: 22,
          padding: 32,
          border: '1px solid #e2e8f0',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#2563eb',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}
        >
          Terminal BENEFI
        </div>

        <h1
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 30,
            color: '#0f172a',
          }}
        >
          Acceso a terminal
        </h1>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: 15,
            lineHeight: '23px',
          }}
        >
          Para ingresar utilizá el enlace asignado a tu sucursal.
          Cada terminal posee un acceso único y un PIN propio.
        </p>

        <div
          style={{
            marginTop: 24,
            padding: '16px 18px',
            borderRadius: 14,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: 14,
            lineHeight: '21px',
            fontWeight: 600,
          }}
        >
          Si no tenés el enlace de acceso, solicitálo al administrador
          del comercio.
        </div>

        <div
          style={{
            marginTop: 26,
            paddingTop: 20,
            borderTop: '1px solid #e2e8f0',
            color: '#94a3b8',
            fontSize: 12,
          }}
        >
          Powered by BENEFI
        </div>
      </div>
    </div>
  )
}