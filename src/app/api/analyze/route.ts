import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { runResumeAnalysisWorkflow } from "@/features/ai-analysis/services/analysis-orchestrator.service";
import { normalizeGroqError } from "@/lib/groq/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { classifyDocument } from "@/lib/groq/document-classifier";
import { resumeProcessingService } from "@/features/ai-analysis/services/resume-processing.service";
import { walrusClient } from "@/lib/walrus/walrus-client";
import type {
  ResumeProcessingPatch,
  ResumeProcessingStage,
} from "@/features/ai-analysis/types/resume-processing.types";

export const dynamic = "force-dynamic";

const CLASSIFICATION_CONFIDENCE_THRESHOLD = 0.5;
const NEEDS_REVIEW_MESSAGE =
  "This document doesn't look like a resume. We didn't find the usual sections such as work history, education, or skills, so the analysis didn't run. Upload a resume, or continue anyway if you're sure.";
const REJECTED_MESSAGE =
  "Document removed. We deleted the uploaded file and its extracted text, so nothing stays in our storage.";
const OVERRIDE_NOTICE =
  "Analysis complete. This document isn't a resume, so we removed the uploaded file and kept only the extracted profile.";

async function safeAdvanceProcessingStage(
  resumeId: string,
  userId: string,
  stage: ResumeProcessingStage,
  patch?: ResumeProcessingPatch,
) {
  try {
    await resumeProcessingService.advance(resumeId, userId, stage, patch);
  } catch (err) {
    console.error(`[ANALYZE:PipelineState] advance '${stage}' failed:`, err);
  }
}

async function deleteResumeContent(
  resumeId: string,
  userId: string,
  storagePath: string | null | undefined,
): Promise<string> {
  const deletedAt = new Date().toISOString();

  if (storagePath) {
    try {
      await supabaseAdmin.storage.from("resumes").remove([storagePath]);
    } catch (err) {
      console.error("[ANALYZE:Cleanup] Failed to remove storage object:", err);
    }
  }

  try {
    await supabaseAdmin
      .from("resumes")
      .update({
        raw_text: null,
        status: "failed",
        storage_path: `rejected/${userId}/${Date.now()}`,
      })
      .eq("id", resumeId)
      .eq("profile_id", userId);
  } catch (err) {
    console.error("[ANALYZE:Cleanup] Failed to clear resume content:", err);
  }

  return deletedAt;
}

async function syncResumeToWalrus(
  resumeId: string,
  userId: string,
  storagePath: string | null | undefined,
) {
  if (!storagePath || !supabaseAdmin.storage) return;

  try {
    const { data: fileData, error } = await supabaseAdmin.storage
      .from("resumes")
      .download(storagePath);
    if (error || !fileData) {
      throw error || new Error("Resume file not found in storage.");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const walrusResult = await walrusClient.storeBlob(buffer, {
      epochs: 50,
      deletable: true,
    });

    await supabaseAdmin
      .from("resumes")
      .update({
        walrus_blob_id: walrusResult.blobId,
        walrus_status: "stored",
      })
      .eq("id", resumeId)
      .eq("profile_id", userId);
  } catch (walrusErr) {
    console.warn(`[WALRUS] Resume ${resumeId} sync failed:`, walrusErr);
    try {
      await supabaseAdmin
        .from("resumes")
        .update({ walrus_status: "failed" })
        .eq("id", resumeId)
        .eq("profile_id", userId);
    } catch (updateErr) {
      console.error("[WALRUS] Failed to mark resume sync failure:", updateErr);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
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
          error: `Too many requests. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
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
    const { resumeId, sessionId, allowNonResume, decision } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: "resumeId is required." },
        { status: 400 },
      );
    }

    // Verify resume ownership and fetch canonical stored raw_text to prevent tampering
    const { data: resumeRecord, error: resumeFetchError } = await supabaseAdmin
      .from("resumes")
      .select("id, profile_id, raw_text, storage_path")
      .eq("id", resumeId)
      .single();

    if (resumeFetchError || !resumeRecord) {
      return NextResponse.json(
        { error: "Resume document not found." },
        { status: 404 },
      );
    }

    if (resumeRecord.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden! You do not have permission to access this resume." },
        { status: 403 },
      );
    }

    // Finalize a user rejection: remove content, keep only decision metadata.
    if (decision === "reject") {
      const deletedAt = await deleteResumeContent(
        resumeId,
        user.id,
        resumeRecord.storage_path,
      );
      await safeAdvanceProcessingStage(resumeId, user.id, "rejected", {
        decision: "rejected",
        rawContentDeletedAt: deletedAt,
        errorCode: "USER_REJECTED",
        errorMessage: REJECTED_MESSAGE,
      });
      return NextResponse.json(
        {
          code: "REJECTED",
          resumeId,
          decision: "rejected",
          contentDeleted: true,
          message: REJECTED_MESSAGE,
        },
        { status: 200 },
      );
    }

    // Security P1: Strictly use canonical database raw_text to eliminate synthetic injection via request payload
    const canonicalRawText = resumeRecord.raw_text?.trim() || "";

    if (!canonicalRawText || canonicalRawText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Resume document does not contain valid text on the server. Please re-upload your document.",
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
              "Forbidden! Conversation session is invalid or does not belong to you.",
          },
          { status: 403 },
        );
      }
    }

    // 1. Classification gate (LLM) before any extraction/matching work.
    await safeAdvanceProcessingStage(resumeId, user.id, "classifying");

    const existing = await resumeProcessingService
      .getStatus(resumeId, user.id)
      .catch(() => null);

    const canReuseExistingClassification = Boolean(
      allowNonResume &&
        existing?.stage === "needs_review" &&
        existing?.documentType &&
        existing?.isResume === false,
    );

    let classification: {
      isResume: boolean;
      documentType: string;
      confidence: number;
      reason: string;
    };

    if (canReuseExistingClassification && existing) {
      classification = {
        isResume: Boolean(existing.isResume),
        documentType: existing.documentType || "other",
        confidence: existing.classificationConfidence ?? 0,
        reason: existing.classificationReason || "",
      };
    } else {
      let llmClassification;
      try {
        llmClassification = await classifyDocument(canonicalRawText);
      } catch (classificationError) {
        await safeAdvanceProcessingStage(resumeId, user.id, "failed", {
          errorCode: "CLASSIFICATION_FAILED",
          errorMessage: (classificationError as Error).message,
        });
        throw classificationError;
      }

      classification = {
        isResume: llmClassification.is_resume,
        documentType: llmClassification.document_type,
        confidence: llmClassification.confidence,
        reason: llmClassification.reason,
      };
    }

    await safeAdvanceProcessingStage(resumeId, user.id, "classified", {
      documentType: classification.documentType,
      isResume: classification.isResume,
      classificationConfidence: classification.confidence,
      classificationReason: classification.reason,
    });

    const isConfidentResume =
      classification.isResume &&
      classification.confidence >= CLASSIFICATION_CONFIDENCE_THRESHOLD;

    // Soft block: the UI can ask the user to confirm before overriding.
    if (!isConfidentResume && !allowNonResume) {
      await safeAdvanceProcessingStage(resumeId, user.id, "needs_review");
      return NextResponse.json(
        {
          code: "NEEDS_REVIEW",
          error: NEEDS_REVIEW_MESSAGE,
          message: NEEDS_REVIEW_MESSAGE,
          resumeId,
          classification,
        },
        { status: 409 },
      );
    }

    if (allowNonResume) {
      await safeAdvanceProcessingStage(resumeId, user.id, "classified", {
        decision: "overridden",
        overriddenByUser: true,
      });
    } else if (isConfidentResume) {
      // Walrus policy: publish only confirmed resumes, never non-resume content.
      void syncResumeToWalrus(resumeId, user.id, resumeRecord.storage_path);
    }

    // 2. Delegate execution to domain orchestrator service.
    const result = await runResumeAnalysisWorkflow({
      userId: user.id,
      resumeId,
      rawText: canonicalRawText,
      sessionId,
      onStage: async (stage, patch) => {
        await resumeProcessingService.advance(resumeId, user.id, stage, patch);
      },
    });

    if (allowNonResume) {
      const deletedAt = await deleteResumeContent(
        resumeId,
        user.id,
        resumeRecord.storage_path,
      );
      await safeAdvanceProcessingStage(resumeId, user.id, "completed", {
        decision: "overridden",
        overriddenByUser: true,
        rawContentDeletedAt: deletedAt,
      });
      return NextResponse.json({
        success: true,
        message: OVERRIDE_NOTICE,
        contentDeleted: true,
        ...result,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Analysis complete",
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
