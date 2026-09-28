import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedbackRepository } from "@/features/feedback/repositories/feedback.repository";
import { FeedbackRequestSchema } from "@/features/feedback/schemas/feedback.schema";

export const dynamic = "force-dynamic";

/**
 * POST /api/feedback
 * Records user feedback events (save, unsave, reject, external_apply_clicked, interview).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized! Sesi telah habis, silakan login kembali." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validation = FeedbackRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid feedback payload",
          details: validation.error.format(),
        },
        { status: 422 },
      );
    }

    const { jobId, eventType, reason, metadata } = validation.data;

    if (eventType === "save") {
      const notes = (metadata?.notes as string) || null;
      const savedJob = await feedbackRepository.saveJob(user.id, jobId, notes);
      return NextResponse.json({ success: true, savedJob }, { status: 200 });
    }

    if (eventType === "unsave") {
      await feedbackRepository.unsaveJob(user.id, jobId);
      return NextResponse.json(
        { success: true, unsaved: true, jobId },
        { status: 200 },
      );
    }

    const event = await feedbackRepository.recordFeedback(
      user.id,
      jobId,
      eventType,
      reason,
      metadata,
    );

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error("[API:Feedback:POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses feedback pekerjaan." },
      { status: 500 },
    );
  }
}
