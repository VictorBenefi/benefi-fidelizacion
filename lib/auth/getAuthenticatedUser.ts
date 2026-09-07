import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAuthenticatedUser(
  req: Request
) {
  const authorization =
    req.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return {
      user: null,
      error: "Falta token de autenticación.",
    };
  }

  const accessToken = authorization
    .replace("Bearer ", "")
    .trim();

  if (!accessToken) {
    return {
      user: null,
      error: "Token de autenticación vacío.",
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(
    accessToken
  );

  if (error || !user) {
    return {
      user: null,
      error:
        error?.message ||
        "Usuario no autenticado.",
    };
  }

  return {
    user,
    error: null,
  };
}