import {
  createHmac,
  timingSafeEqual,
} from "crypto";

const COOKIE_NAME = "benefi_comercio_session";

const SESSION_DURATION_SECONDS =
  60 * 60 * 12; // 12 horas

type ComercioSessionPayload = {
  comercio_id: string;
  exp: number;
};

function getSecret() {
  const secret =
    process.env.COMERCIO_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Falta COMERCIO_SESSION_SECRET."
    );
  }

  return secret;
}

function encode(value: string) {
  return Buffer.from(value).toString(
    "base64url"
  );
}

function decode(value: string) {
  return Buffer.from(
    value,
    "base64url"
  ).toString("utf8");
}

function sign(payload: string) {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(payload)
    .digest("base64url");
}

export function createComercioSessionToken(
  comercioId: string
) {
  const payload: ComercioSessionPayload = {
    comercio_id: comercioId,
    exp:
      Math.floor(Date.now() / 1000) +
      SESSION_DURATION_SECONDS,
  };

  const encodedPayload = encode(
    JSON.stringify(payload)
  );

  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyComercioSessionToken(
  token?: string | null
): ComercioSessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] =
    token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature =
    sign(encodedPayload);

  const receivedBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    return null;
  }

  if (
    !timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decode(encodedPayload)
    ) as ComercioSessionPayload;

    if (
      !payload.comercio_id ||
      !payload.exp
    ) {
      return null;
    }

    if (
      payload.exp <
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getComercioSessionFromRequest(
  req: Request
) {
  const cookieHeader =
    req.headers.get("cookie") || "";

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const sessionCookie = cookies.find(
    (cookie) =>
      cookie.startsWith(
        `${COOKIE_NAME}=`
      )
  );

  if (!sessionCookie) {
    return null;
  }

  const token = sessionCookie.substring(
    COOKIE_NAME.length + 1
  );

  return verifyComercioSessionToken(token);
}

export const comercioSessionCookieName =
  COOKIE_NAME;

export const comercioSessionDuration =
  SESSION_DURATION_SECONDS;