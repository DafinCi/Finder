import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resumeProcessingService } from "@/features/ai-analysis/services/resume-processing.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/analyze/status?resumeId=...
 * Returns the persisted resume-processing pipeline state for the authenticated owner.
 * The UI polls this endpoint to show truthful, backend-driven progress.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json(
        { error: "resumeId is required." },
        { status: 400 },
      );
    }

    const { data: resume, error: resumeError } = await supabaseAdmin
      .from("resumes")
      .select("id, profile_id, status")
      .eq("id", resumeId)
      .maybeSingle();

    if (resumeError) throw resumeError;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume document not found." },
        { status: 404 },
      );
    }

    if (resume.profile_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Forbidden! You do not have permission to access this resume.",
        },
        { status: 403 },
      );
    }

    const processing = await resumeProcessingService.getStatus(
      resumeId,
      user.id,
    );

    return NextResponse.json(
      {
        resumeId,
        resumeStatus: resume.status,
        hasProcessingState: Boolean(processing),
        processing,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API:AnalyzeStatus:GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve resume processing status." },
      { status: 500 },
    );
  }
}
