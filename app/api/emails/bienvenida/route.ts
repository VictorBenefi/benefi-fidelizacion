import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, nombre, comercio } = await req.json()

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email requerido' },
        { status: 400 }
      )
    }

    const response = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAILTRAP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL,
          name: process.env.MAILTRAP_FROM_NAME,
        },
        to: [
          {
            email,
          },
        ],
        subject: 'Bienvenido a Benefi 🎉',
        text: `Hola ${nombre}, te damos la bienvenida a Benefi.`,
        html: `
          <h2>Bienvenido ${nombre} 👋</h2>
          <p>Ya podés empezar a usar tus beneficios en ${comercio}.</p>
        `,
        category: 'Bienvenida',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error Mailtrap:', data)

      return NextResponse.json(
        { ok: false, error: 'Error enviando email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error general email:', error)

    return NextResponse.json(
      { ok: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}