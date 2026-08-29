'use client'

import { useEffect, useState } from 'react'
import { getCurrentComercio } from '@/lib/getCurrentComercio'

type Terminal = {
  id: string
  comercio_id: string
  nombre_sucursal: string
  pin: string
  activa: boolean
  created_at: string
}

export default function TerminalesPage() {
  const [comercioId, setComercioId] = useState('')
  const [terminales, setTerminales] = useState<Terminal[]>([])
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [mostrarNuevaTerminal, setMostrarNuevaTerminal] = useState(false)
    const [nombreSucursal, setNombreSucursal] = useState('')
    const [nuevoPin, setNuevoPin] = useState('')
    const [guardando, setGuardando] = useState(false)
const [terminalEditando, setTerminalEditando] = useState<Terminal | null>(null)
const [nombreSucursalEditar, setNombreSucursalEditar] = useState('')
const [pinEditar, setPinEditar] = useState('')
const [activaEditar, setActivaEditar] = useState(true)
const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  useEffect(() => {
    async function cargarComercio() {
      try {
        const comercio = await getCurrentComercio()

        if (!comercio?.id) {
          setMensaje('No se encontró el comercio')
          setLoading(false)
          return
        }

        setComercioId(comercio.id)
      } catch (error) {
        console.error(error)
        setMensaje('No se pudo identificar el comercio')
        setLoading(false)
      }
    }

    cargarComercio()
  }, [])

  useEffect(() => {
    if (!comercioId) return

    async function cargarTerminales() {
      try {
        setLoading(true)

        const res = await fetch(
          `/api/terminales?comercio_id=${comercioId}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!data.ok) {
          setMensaje(data.error || 'No se pudieron cargar las terminales')
          setTerminales([])
          return
        }

        setTerminales(data.terminales || [])
      } catch (error) {
        console.error(error)
        setMensaje('Ocurrió un error al cargar las terminales')
      } finally {
        setLoading(false)
      }
    }

    cargarTerminales()
  }, [comercioId])

  const crearTerminal = async () => {
  setMensaje('')

  if (!comercioId) {
    setMensaje('No se encontró el comercio')
    return
  }

  if (!nombreSucursal.trim()) {
    setMensaje('Ingresá el nombre de la sucursal')
    return
  }

  if (!/^\d{4,6}$/.test(nuevoPin)) {
    setMensaje('El PIN debe contener entre 4 y 6 números')
    return
  }

  try {
    setGuardando(true)

    const res = await fetch('/api/terminales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comercio_id: comercioId,
        nombre_sucursal: nombreSucursal.trim(),
        pin: nuevoPin,
      }),
    })

    const data = await res.json()

    if (!data.ok) {
      setMensaje(data.error || 'No se pudo crear la terminal')
      return
    }

    setTerminales((actuales) => [
      ...actuales,
      data.terminal,
    ])

    setNombreSucursal('')
    setNuevoPin('')
    setMostrarNuevaTerminal(false)
  } catch (error) {
    console.error(error)
    setMensaje('Ocurrió un error al crear la terminal')
  } finally {
    setGuardando(false)
  }
}

const abrirEditarTerminal = (terminal: Terminal) => {
  setMensaje('')
  setTerminalEditando(terminal)
  setNombreSucursalEditar(terminal.nombre_sucursal)
  setPinEditar(terminal.pin)
  setActivaEditar(terminal.activa)
}

const guardarEdicionTerminal = async () => {
  if (!terminalEditando) return

  setMensaje('')

  if (!nombreSucursalEditar.trim()) {
    setMensaje('Ingresá el nombre de la sucursal')
    return
  }

  if (!/^\d{4,6}$/.test(pinEditar)) {
    setMensaje('El PIN debe contener entre 4 y 6 números')
    return
  }

  try {
    setGuardandoEdicion(true)

    const res = await fetch('/api/terminales', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: terminalEditando.id,
        comercio_id: comercioId,
        nombre_sucursal: nombreSucursalEditar.trim(),
        pin: pinEditar,
        activa: activaEditar,
      }),
    })

    const data = await res.json()

    if (!data.ok) {
      setMensaje(data.error || 'No se pudo actualizar la terminal')
      return
    }

    setTerminales((actuales) =>
      actuales.map((terminal) =>
        terminal.id === data.terminal.id
          ? data.terminal
          : terminal
      )
    )

    setTerminalEditando(null)
  } catch (error) {
    console.error(error)
    setMensaje('Ocurrió un error al actualizar la terminal')
  } finally {
    setGuardandoEdicion(false)
  }
}

  return (
  <div className="min-h-screen px-4 py-6 sm:p-8">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#2563eb',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Configuración
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  color: '#0f172a',
                }}
              >
                Terminales
              </h1>

              <p
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                  color: '#64748b',
                  fontSize: 14,
                }}
              >
                Administrá las sucursales y sus accesos por PIN.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarNuevaTerminal(true)}
              style={{
                height: 44,
                padding: '0 18px',
                borderRadius: 12,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Nueva terminal
            </button>
          </div>

          {mensaje && (
            <div
              style={{
                marginBottom: 18,
                padding: '12px 14px',
                borderRadius: 12,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontWeight: 700,
              }}
            >
              {mensaje}
            </div>
          )}

          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 140px 140px',
                gap: 12,
                padding: '14px 18px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: 12,
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
              className="hidden md:grid"
            >
              <div>Sucursal</div>
              <div>PIN</div>
              <div>Estado</div>
              <div>Acciones</div>
            </div>

            {loading && (
              <div
                style={{
                  padding: 24,
                  color: '#64748b',
                }}
              >
                Cargando terminales...
              </div>
            )}

            {!loading && terminales.length === 0 && (
              <div
                style={{
                  padding: 30,
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                No hay terminales creadas.
              </div>
            )}

            {!loading &&
              terminales.map((terminal) => (
                <div
                  key={terminal.id}
                  className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-4 md:grid-cols-[1fr_160px_140px_140px] md:items-center md:px-[18px]"
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        color: '#0f172a',
                        fontSize: 15,
                      }}
                    >
                      {terminal.nombre_sucursal}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color: '#94a3b8',
                        fontSize: 12,
                      }}
                    >
                      ID: {terminal.id}
                    </div>
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      color: '#334155',
                    }}
                  >
                    {terminal.pin}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '5px 10px',
                        borderRadius: 999,
                        background: terminal.activa ? '#dcfce7' : '#fee2e2',
                        color: terminal.activa ? '#166534' : '#991b1b',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {terminal.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => abrirEditarTerminal(terminal)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {mostrarNuevaTerminal && (
            <div
                onClick={() => {
                if (!guardando) setMostrarNuevaTerminal(false)
                }}
                style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                }}
            >
                <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 460,
                    background: '#ffffff',
                    borderRadius: 20,
                    padding: 24,
                    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
                }}
                >
                <div
                    style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 20,
                    }}
                >
                    <div>
                    <div
                        style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#2563eb',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                        }}
                    >
                        Nueva terminal
                    </div>

                    <h2
                        style={{
                        margin: 0,
                        fontSize: 24,
                        color: '#0f172a',
                        }}
                    >
                        Crear sucursal
                    </h2>
                    </div>

                    <button
                    type="button"
                    onClick={() => {
                        if (!guardando) setMostrarNuevaTerminal(false)
                    }}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontSize: 20,
                        cursor: 'pointer',
                    }}
                    >
                    ×
                    </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label
                    style={{
                        display: 'block',
                        marginBottom: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#334155',
                    }}
                    >
                    Nombre de sucursal
                    </label>

                    <input
                    type="text"
                    value={nombreSucursal}
                    onChange={(e) => setNombreSucursal(e.target.value)}
                    placeholder="Ej. Sucursal Shopping"
                    style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                        padding: '0 14px',
                        fontSize: 15,
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
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
                    value={nuevoPin}
                    onChange={(e) =>
                        setNuevoPin(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="4 a 6 números"
                    style={{
                        width: '100%',
                        height: 46,
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                        padding: '0 14px',
                        fontSize: 18,
                        letterSpacing: 4,
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                    />
                </div>

                <div
                    style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    }}
                >
                    <button
                    type="button"
                    onClick={() => setMostrarNuevaTerminal(false)}
                    disabled={guardando}
                    style={{
                        height: 44,
                        padding: '0 16px',
                        borderRadius: 12,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontWeight: 700,
                        cursor: guardando ? 'not-allowed' : 'pointer',
                    }}
                    >
                    Cancelar
                    </button>

                    <button
                    type="button"
                    onClick={crearTerminal}
                    disabled={guardando}
                    style={{
                        height: 44,
                        padding: '0 18px',
                        borderRadius: 12,
                        border: 'none',
                        background: guardando ? '#94a3b8' : '#2563eb',
                        color: '#ffffff',
                        fontWeight: 800,
                        cursor: guardando ? 'not-allowed' : 'pointer',
                    }}
                    >
                    {guardando ? 'Guardando...' : 'Crear terminal'}
                    </button>
                </div>
                </div>
            </div>
            )}
            {terminalEditando && (
                <div
                    onClick={() => {
                    if (!guardandoEdicion) setTerminalEditando(null)
                    }}
                    style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    }}
                >
                    <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: 460,
                        background: '#ffffff',
                        borderRadius: 20,
                        padding: 24,
                        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
                    }}
                    >
                    <div
                        style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 20,
                        }}
                    >
                        <div>
                        <div
                            style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#2563eb',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                            }}
                        >
                            Editar terminal
                        </div>

                        <h2
                            style={{
                            margin: 0,
                            fontSize: 24,
                            color: '#0f172a',
                            }}
                        >
                            Configurar sucursal
                        </h2>
                        </div>

                        <button
                        type="button"
                        onClick={() => {
                            if (!guardandoEdicion) setTerminalEditando(null)
                        }}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontSize: 20,
                            cursor: 'pointer',
                        }}
                        >
                        ×
                        </button>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label
                        style={{
                            display: 'block',
                            marginBottom: 8,
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#334155',
                        }}
                        >
                        Nombre de sucursal
                        </label>

                        <input
                        type="text"
                        value={nombreSucursalEditar}
                        onChange={(e) => setNombreSucursalEditar(e.target.value)}
                        style={{
                            width: '100%',
                            height: 46,
                            borderRadius: 12,
                            border: '1px solid #cbd5e1',
                            padding: '0 14px',
                            fontSize: 15,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
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
                        value={pinEditar}
                        onChange={(e) =>
                            setPinEditar(e.target.value.replace(/\D/g, ''))
                        }
                        style={{
                            width: '100%',
                            height: 46,
                            borderRadius: 12,
                            border: '1px solid #cbd5e1',
                            padding: '0 14px',
                            fontSize: 18,
                            letterSpacing: 4,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                        />
                    </div>

                    <div
                        style={{
                        marginBottom: 22,
                        padding: 14,
                        borderRadius: 14,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        }}
                    >
                        <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 14,
                            cursor: 'pointer',
                        }}
                        >
                        <div>
                            <div
                            style={{
                                fontWeight: 800,
                                color: '#0f172a',
                                fontSize: 14,
                            }}
                            >
                            Terminal activa
                            </div>

                            <div
                            style={{
                                marginTop: 3,
                                color: '#64748b',
                                fontSize: 12,
                            }}
                            >
                            Si la desactivás, el PIN dejará de permitir el ingreso.
                            </div>
                        </div>

                        <input
                            type="checkbox"
                            checked={activaEditar}
                            onChange={(e) => setActivaEditar(e.target.checked)}
                            style={{
                            width: 20,
                            height: 20,
                            cursor: 'pointer',
                            }}
                        />
                        </label>
                    </div>

                    <div
                        style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 10,
                        }}
                    >
                        <button
                        type="button"
                        onClick={() => setTerminalEditando(null)}
                        disabled={guardandoEdicion}
                        style={{
                            height: 44,
                            padding: '0 16px',
                            borderRadius: 12,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontWeight: 700,
                            cursor: guardandoEdicion ? 'not-allowed' : 'pointer',
                        }}
                        >
                        Cancelar
                        </button>

                        <button
                        type="button"
                        onClick={guardarEdicionTerminal}
                        disabled={guardandoEdicion}
                        style={{
                            height: 44,
                            padding: '0 18px',
                            borderRadius: 12,
                            border: 'none',
                            background: guardandoEdicion ? '#94a3b8' : '#2563eb',
                            color: '#ffffff',
                            fontWeight: 800,
                            cursor: guardandoEdicion ? 'not-allowed' : 'pointer',
                        }}
                        >
                        {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                    </div>
                </div>
                )}
        </div>
    )
}