import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { runResumeAnalysisWorkflow } from "@/features/ai-analysis/services/analysis-orchestrator.service";
import { normalizeGroqError } from "@/lib/groq/client";

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

    const body = await req.json();
    const { resumeId, rawText, sessionId } = body;

    if (!resumeId || !rawText) {
      return NextResponse.json(
        { error: "resumeId dan rawText wajib dikirim" },
        { status: 400 },
      );
    }

    // Verify resume ownership to prevent IDOR attacks
    const { data: resumeRecord, error: resumeFetchError } = await supabaseAdmin
      .from("resumes")
      .select("id, profile_id")
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
      rawText,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: "Analisis selesai",
      ...result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("API Analyze Controller Error:", err);
    const friendlyMessage = normalizeGroqError(err);
    return NextResponse.json({ error: friendlyMessage }, { status: 500 });
  }
}
