import crypto from 'crypto'

export const terminalSessionCookieName =
  'benefi_terminal_session'

export const terminalSessionDuration =
  60 * 60 * 12 // 12 horas

type TerminalSession = {
  terminal_id: string
  comercio_id: string
  exp: number
}

function getSecret() {
  const secret = process.env.COMERCIO_SESSION_SECRET

  if (!secret) {
    throw new Error(
      'Falta COMERCIO_SESSION_SECRET.'
    )
  }

  return secret
}

function sign(payload: string) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url')
}

export function createTerminalSessionToken({
  terminal_id,
  comercio_id,
}: {
  terminal_id: string
  comercio_id: string
}) {
  const session: TerminalSession = {
    terminal_id,
    comercio_id,
    exp:
      Math.floor(Date.now() / 1000) +
      terminalSessionDuration,
  }

  const payload = Buffer.from(
    JSON.stringify(session)
  ).toString('base64url')

  const signature = sign(payload)

  return `${payload}.${signature}`
}

export function verifyTerminalSessionToken(
  token: string
): TerminalSession | null {
  try {
    const [payload, signature] = token.split('.')

    if (!payload || !signature) {
      return null
    }

    const expectedSignature = sign(payload)

    const signatureBuffer =
      Buffer.from(signature)

    const expectedBuffer =
      Buffer.from(expectedSignature)

    if (
      signatureBuffer.length !==
      expectedBuffer.length
    ) {
      return null
    }

    if (
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return null
    }

    const session = JSON.parse(
      Buffer.from(
        payload,
        'base64url'
      ).toString('utf8')
    ) as TerminalSession

    if (
      !session.terminal_id ||
      !session.comercio_id ||
      !session.exp
    ) {
      return null
    }

    if (
      session.exp <
      Math.floor(Date.now() / 1000)
    ) {
      return null
    }

    return session
  } catch {
    return null
  }
}

export function getTerminalSessionFromRequest(
  req: Request
): TerminalSession | null {
  const cookieHeader =
    req.headers.get('cookie')

  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())

  const sessionCookie = cookies.find(
    (cookie) =>
      cookie.startsWith(
        `${terminalSessionCookieName}=`
      )
  )

  if (!sessionCookie) {
    return null
  }

  const token = sessionCookie.substring(
    terminalSessionCookieName.length + 1
  )

  if (!token) {
    return null
  }

  return verifyTerminalSessionToken(token)
}