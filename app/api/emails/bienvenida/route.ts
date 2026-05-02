import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, nombre, comercio, comercioId } = await req.json()

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
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bienvenido ${nombre} 👋</h2>

          <p>
            Ya formás parte del programa de beneficios de 
            <strong>${comercio}</strong>.
          </p>

          <p>
            A partir de ahora vas a poder:
          </p>

          <ul>
            <li>✨ Acumular puntos con tus compras</li>
            <li>🎁 Canjear beneficios exclusivos</li>
            <li>🏷️ Acceder a promociones especiales</li>
          </ul>

          <p>
            Te recomendamos ingresar a tu cuenta y comenzar a aprovechar tus beneficios.
          </p>
          <div style="margin-top: 20px;">
            <a 
              href="https://fidelizacion.benefi.com.ar/usuarios/${comercioId}" 
              style="
                background-color: #2563eb;
                color: white;
                padding: 12px 20px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;
              "
            >
              Ir a mi cuenta
            </a>
          </div>
          <br />

          <p>
            ¡Gracias por ser parte! 🚀
          </p>

          <p style="margin-top:20px; font-size:12px; color:#888;">
            Equipo BENEFI
          </p>
        </div>
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