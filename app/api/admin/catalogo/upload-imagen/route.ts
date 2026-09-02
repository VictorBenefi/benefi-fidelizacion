import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const archivo = formData.get("archivo");
    const comercioId = String(formData.get("comercio_id") || "").trim();

    if (!comercioId) {
      return NextResponse.json(
        { error: "Falta comercio_id" },
        { status: 400 }
      );
    }

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió una imagen válida" },
        { status: 400 }
      );
    }

    if (!archivo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    const extension =
      archivo.name.split(".").pop()?.toLowerCase() || "jpg";

    const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

    const ruta = `catalogo/${comercioId}/${nombreArchivo}`;

    const buffer = Buffer.from(await archivo.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("campaign-assets")
      .upload(ruta, buffer, {
        contentType: archivo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError);

      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage
      .from("campaign-assets")
      .getPublicUrl(ruta);

    return NextResponse.json({
      ok: true,
      imagen_url: data.publicUrl,
      ruta,
    });
  } catch (error) {
    console.error("Error inesperado subiendo imagen:", error);

    return NextResponse.json(
      { error: "Error interno al subir la imagen" },
      { status: 500 }
    );
  }
}