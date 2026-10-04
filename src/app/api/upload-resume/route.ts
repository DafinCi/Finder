import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { resumeProcessingService } from "@/features/ai-analysis/services/resume-processing.service";
import { scoreResumeHeuristic } from "@/features/ai-analysis/utils/resume-heuristic";
import type { ResumeProcessingPatch } from "@/features/ai-analysis/repositories/resume-processing.repository";

const NOT_A_RESUME_MESSAGE =
  "This document doesn't look like a resume. It has none of the usual sections such as work history, education, or skills, so we didn't save it. Upload a resume, or continue anyway if you're sure.";

/**
 * Pipeline tracking must never break the upload itself. Failures are logged so
 * the UI can fall back to the coarse resume status via /api/analyze/status.
 */
async function safeEnsureProcessingState(resumeId: string, userId: string) {
  try {
    await resumeProcessingService.ensureState(resumeId, userId);
  } catch (err) {
    console.error("[UPLOAD:PipelineState] ensure failed:", err);
  }
}

async function safeAdvanceProcessingStage(
  resumeId: string,
  userId: string,
  stage:
    | "received"
    | "text_extracted"
    | "heuristic_checked"
    | "stored"
    | "rejected"
    | "failed",
  patch?: ResumeProcessingPatch,
) {
  try {
    await resumeProcessingService.advance(resumeId, userId, stage, patch);
  } catch (err) {
    console.error(`[UPLOAD:PipelineState] advance '${stage}' failed:`, err);
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
        { error: "Your session has expired. Sign in again to upload a resume." },
        { status: 401 },
      );
    }

    const userId = user.id;

    // Rate Limit Guard: max 6 PDF uploads per minute per user
    const rateLimit = checkRateLimit({
      key: `upload:${userId}`,
      limit: 6,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many uploads in a short time. Try again in ${rateLimit.resetInSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetInSeconds),
          },
        },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "PDF file is required." },
        { status: 400 },
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File format must be PDF." },
        { status: 400 },
      );
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB hard limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "File size too large. Maximum resume file size is 5 MB.",
        },
        { status: 413 },
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
            "Invalid file format. Document must be a valid PDF.",
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
        {
          error:
            "Couldn't read the PDF. The file may be corrupted or password-protected.",
        },
        { status: 400 },
      );
    }

    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        {
          error:
            "This PDF has no readable text. Scanned or image-only files need a text-based PDF.",
        },
        { status: 400 },
      );
    }

    const MAX_RAW_TEXT_CHARS = 15000;
    if (rawText.length > MAX_RAW_TEXT_CHARS) {
      console.warn(
        `[UPLOAD] Truncating excessive raw text from ${rawText.length} to ${MAX_RAW_TEXT_CHARS} chars`,
      );
      rawText = rawText.slice(0, MAX_RAW_TEXT_CHARS);
    }

    const heuristic = scoreResumeHeuristic(rawText);

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `${userId}/${timestamp}_${safeFileName}`;

    // Insert the resume row first so processing state can reference it (FK) and so
    // raw text is only persisted after the document check passes.
    const { data: resumeRecord, error: dbError } = await supabaseAdmin
      .from("resumes")
      .insert({
        profile_id: userId,
        file_name: file.name,
        storage_path: storagePath,
        raw_text: null,
        status: "uploaded",
        walrus_status: null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      return NextResponse.json(
        { error: "Couldn't save file data. Please try again." },
        { status: 500 },
      );
    }

    await safeEnsureProcessingState(resumeRecord.id, userId);
    await safeAdvanceProcessingStage(resumeRecord.id, userId, "text_extracted");
    await safeAdvanceProcessingStage(
      resumeRecord.id,
      userId,
      "heuristic_checked",
      { heuristicScore: heuristic.score },
    );

    // Hard reject only when the document is clearly not a resume. Nuanced cases
    // continue to LLM classification in /api/analyze, where soft block + override applies.
    if (heuristic.verdict === "likely_not_resume") {
      await safeAdvanceProcessingStage(resumeRecord.id, userId, "rejected", {
        isResume: false,
        heuristicScore: heuristic.score,
        decision: "rejected",
        classificationReason: "Heuristic pre-filter: likely not a resume",
        errorCode: "NOT_A_RESUME_HEURISTIC",
        errorMessage: NOT_A_RESUME_MESSAGE,
        rawContentDeletedAt: new Date().toISOString(),
      });

      await supabaseAdmin
        .from("resumes")
        .update({
          raw_text: null,
          status: "failed",
          storage_path: `rejected/${userId}/${timestamp}`,
        })
        .eq("id", resumeRecord.id)
        .eq("profile_id", userId);

      return NextResponse.json(
        {
          error: NOT_A_RESUME_MESSAGE,
          code: "NOT_A_RESUME",
          resumeId: resumeRecord.id,
          decision: "rejected",
        },
        { status: 422 },
      );
    }

    // Persist raw text only after the document check passes.
    await supabaseAdmin
      .from("resumes")
      .update({ raw_text: rawText })
      .eq("id", resumeRecord.id)
      .eq("profile_id", userId);

    const { error: storageError } = await supabaseAdmin.storage
      .from("resumes")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (storageError) {
      console.error("Storage Upload Error:", storageError);
      await supabaseAdmin
        .from("resumes")
        .update({ status: "failed" })
        .eq("id", resumeRecord.id)
        .eq("profile_id", userId);
      await safeAdvanceProcessingStage(resumeRecord.id, userId, "failed", {
        errorCode: "STORAGE_UPLOAD_FAILED",
        errorMessage: "Couldn't upload the file. Please try again.",
      });
      return NextResponse.json(
        { error: "Couldn't upload the file. Please try again." },
        { status: 500 },
      );
    }

    await safeAdvanceProcessingStage(resumeRecord.id, userId, "stored");

    // Resumes are never published to Walrus: blobs are public by default and
    // deletion is not guaranteed, so the document stays private in storage.

    const sessionId = formData.get("sessionId") as string | null;
    const prompt = (formData.get("prompt") as string | null) || "";
    if (sessionId) {
      // Security P0: Explicitly verify session exists and belongs to the authenticated user
      const { data: sessionRecord, error: sessionFetchError } =
        await supabaseAdmin
          .from("chat_sessions")
          .select("id, user_id")
          .eq("id", sessionId)
          .maybeSingle();

      if (sessionFetchError || !sessionRecord) {
        return NextResponse.json(
          { error: "Conversation session not found." },
          { status: 404 },
        );
      }

      if (sessionRecord.user_id !== userId) {
        console.warn(
          `[SECURITY ALERT] User ${userId} attempted to attach resume to unauthorized session ${sessionId} (owned by ${sessionRecord.user_id})`,
        );
        return NextResponse.json(
          { error: "Forbidden! This conversation session does not belong to you." },
          { status: 403 },
        );
      }

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
        message: "File uploaded and text extracted",
        resumeId: resumeRecord.id,
        fileName: file.name,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unhandled Upload Error:", error);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
