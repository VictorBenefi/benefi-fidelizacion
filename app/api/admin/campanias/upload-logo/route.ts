
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") || "comercio");
    const rawSlug = String(formData.get("slug") || "sin-slug");
    const slug = sanitizeSlug(rawSlug || "sin-slug");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    const bucket = "campaign-assets";
    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name || "archivo.png");
    const extension = safeName.includes(".")
      ? safeName.split(".").pop()
      : "png";

    const filePath = `${slug}/${type}-${timestamp}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      ok: true,
      path: filePath,
      publicUrl: data.publicUrl,
    });
  } catch (error) {
    console.error("Error subiendo logo:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al subir el logo" },
      { status: 500 }
    );
  }
}
