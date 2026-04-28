import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    if (!data.activo) {
      return NextResponse.json(
        { error: "Usuario inactivo" },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Error login admin:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}