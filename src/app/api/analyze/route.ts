import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { runResumeAnalysisWorkflow } from "@/features/ai-analysis/services/analysis-orchestrator.service";
import { normalizeGroqError } from "@/lib/groq/client";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized! Silakan login kembali." },
        { status: 401 },
      );
    }

    // Rate Limit Guard: max 5 resume analyses per minute per user
    const rateLimit = checkRateLimit({
      key: `analyze:${user.id}`,
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan analisis dalam waktu singkat. Silakan tunggu ${rateLimit.resetInSeconds} detik sebelum mencoba lagi.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        },
      );
    }

    const body = await req.json();
    const { resumeId, sessionId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: "resumeId wajib dikirim." },
        { status: 400 },
      );
    }

    // Verify resume ownership and fetch canonical stored raw_text to prevent tampering
    const { data: resumeRecord, error: resumeFetchError } = await supabaseAdmin
      .from("resumes")
      .select("id, profile_id, raw_text")
      .eq("id", resumeId)
      .single();

    if (resumeFetchError || !resumeRecord) {
      return NextResponse.json(
        { error: "Dokumen resume tidak ditemukan" },
        { status: 404 },
      );
    }

    if (resumeRecord.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden! Anda tidak memiliki izin untuk resume ini." },
        { status: 403 },
      );
    }

    // Security P1: Strictly use canonical database raw_text to eliminate synthetic injection via request payload
    const canonicalRawText = resumeRecord.raw_text?.trim() || "";

    if (!canonicalRawText || canonicalRawText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Dokumen resume tidak memiliki teks yang valid di server. Silakan unggah ulang dokumen Anda.",
        },
        { status: 400 },
      );
    }

    // Verify session ownership if sessionId is provided
    if (sessionId) {
      const { data: sessionRecord, error: sessionFetchError } =
        await supabaseAdmin
          .from("chat_sessions")
          .select("id, user_id")
          .eq("id", sessionId)
          .single();

      if (
        sessionFetchError ||
        !sessionRecord ||
        sessionRecord.user_id !== user.id
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden! Sesi percakapan tidak valid atau bukan milik Anda.",
          },
          { status: 403 },
        );
      }
    }

    // Delegate execution to domain orchestrator service
    const result = await runResumeAnalysisWorkflow({
      userId: user.id,
      resumeId,
      rawText: canonicalRawText,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: "Analisis selesai",
      ...result,
    });
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number };
    console.error("API Analyze Controller Error:", err);
    if (err.statusCode === 409) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const friendlyMessage = normalizeGroqError(err);
    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
