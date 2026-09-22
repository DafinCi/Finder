import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized! Sesi telah habis, silakan login kembali." },
        { status: 401 },
      );
    }

    const userId = user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "File PDF wajib dikirim!" },
        { status: 400 },
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Format file harus PDF!" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";

    try {
      // Dynamic import to handle pdf-parse in ESM / Next.js server runtime
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = await import("pdf-parse");
      // @ts-expect-error pdf-parse export variability
      const PDFParse = pdfModule.PDFParse || pdfModule.default || pdfModule;
      if (typeof PDFParse === "function" && PDFParse.prototype?.getText) {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        rawText = result.text.trim();
        if (parser.destroy) await parser.destroy();
      } else {
        const data = await PDFParse(buffer);
        rawText = data.text?.trim() || "";
      }
    } catch (parseError) {
      console.error("PDF Parse Error:", parseError);
      return NextResponse.json(
        { error: "Gagal membaca teks dari PDF. File corrupt atau dipasword." },
        { status: 400 },
      );
    }

    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        {
          error:
            "PDF kosong atau berupa hasil scan gambar. AI membutuhkan teks murni.",
        },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${userId}/${timestamp}_${safeFileName}`;

    const { error: storageError } = await supabaseAdmin.storage
      .from("resumes")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage Upload Error:", storageError);
      return NextResponse.json(
        { error: "Gagal mengunggah file ke Supabase Storage." },
        { status: 500 },
      );
    }

    const { data: resumeRecord, error: dbError } = await supabaseAdmin
      .from("resumes")
      .insert({
        profile_id: userId,
        file_name: file.name,
        storage_path: storagePath,
        raw_text: rawText,
        status: "uploaded",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      await supabaseAdmin.storage.from("resumes").remove([storagePath]);
      return NextResponse.json(
        { error: "Gagal menyimpan metadata ke database." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Upload dan ekstraksi teks berhasil",
        resumeId: resumeRecord.id,
        rawText: rawText,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unhandled Upload Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem internal server." },
      { status: 500 },
    );
  }
}
