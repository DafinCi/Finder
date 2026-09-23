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

    // Magic bytes verification for PDF (%PDF- / 0x25 0x50 0x44 0x46)
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46
    ) {
      return NextResponse.json(
        {
          error:
            "Format file tidak valid. Dokumen harus berupa file PDF murni.",
        },
        { status: 400 },
      );
    }

    let rawText = "";

    try {
      // Dynamic import to handle pdf-parse in ESM / Next.js server runtime
      const pdfModule: any = await import("pdf-parse");
      const PDFParse = pdfModule.PDFParse || pdfModule.default || pdfModule;
      if (
        typeof PDFParse === "function" &&
        PDFParse.prototype &&
        "getText" in PDFParse.prototype
      ) {
        const parser = new (PDFParse as any)({ data: buffer });
        const result = await parser.getText();
        rawText = result.text.trim();
        if (parser.destroy) await parser.destroy();
      } else if (typeof PDFParse === "function") {
        const data = await (PDFParse as any)(buffer);
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

    const sessionId = formData.get("sessionId") as string | null;
    const prompt = (formData.get("prompt") as string | null) || "";
    if (sessionId) {
      await supabaseAdmin
        .from("chat_sessions")
        .update({ resume_id: resumeRecord.id })
        .eq("id", sessionId)
        .eq("user_id", userId);

      // Check if session already has this attachment message to avoid duplicate on initial creation
      const { data: recentMsg } = await supabaseAdmin
        .from("chat_messages")
        .select("id, role, metadata")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      interface AttachmentMeta {
        attachment?: {
          name?: string;
        };
      }
      const lastMeta = recentMsg?.metadata as AttachmentMeta | undefined;
      const lastAttachmentName = lastMeta?.attachment?.name;

      if (!recentMsg || lastAttachmentName !== file.name) {
        await supabaseAdmin.from("chat_messages").insert({
          session_id: sessionId,
          role: "user",
          content:
            prompt.trim() ||
            "Please analyze my resume and find matching career opportunities.",
          metadata: {
            attachment: {
              name: file.name,
              size: file.size,
              type: file.type,
              resume_id: resumeRecord.id,
            },
          },
        });
      }
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
