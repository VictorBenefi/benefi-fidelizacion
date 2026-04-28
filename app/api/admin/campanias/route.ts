import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("campaign_settings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data: existing } = await supabaseAdmin
    .from("campaign_settings")
    .select("id")
    .eq("slug", body.slug)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Slug ya existe" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("campaign_settings")
    .insert([{ ...body, updated_at: new Date() }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
