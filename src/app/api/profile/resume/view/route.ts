// ==============================================================================
// RESUME SECURE VIEW ROUTE
// Module: @/app/api/profile/resume/view/route
//
// Purpose:
// Generates a secure, temporary Signed URL from Supabase Storage and redirects
// the user directly to view the PDF in browser, or returns the JSON signed URL.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { careerProfileService } from "@/features/profile/services/career-profile.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    // 1. Get active profile to locate resumeId
    const profile = await careerProfileService.getProfile(user.id);
    let resumeRecord = null;

    if (profile?.resumeId) {
      const { data } = await supabaseAdmin
        .from("resumes")
        .select("id, profile_id, storage_path, file_name")
        .eq("id", profile.resumeId)
        .maybeSingle();
      resumeRecord = data;
    }

    // Fallback: Latest active resume
    if (!resumeRecord) {
      const { data: fallbackRecord } = await supabaseAdmin
        .from("resumes")
        .select("id, profile_id, storage_path, file_name")
        .eq("profile_id", user.id)
        .neq("status", "failed")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      resumeRecord = fallbackRecord;
    }

    if (!resumeRecord || !resumeRecord.storage_path) {
      return NextResponse.json(
        { error: "No active resume document found for this account." },
        { status: 404 },
      );
    }

    // Security check: Owner verification
    if (resumeRecord.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. Document belongs to another user." },
        { status: 403 },
      );
    }

    // 2. Generate secure 1-hour signed URL from Supabase Storage
    const { data: signedData, error: storageError } =
      await supabaseAdmin.storage
        .from("resumes")
        .createSignedUrl(resumeRecord.storage_path, 3600);

    if (storageError || !signedData?.signedUrl) {
      throw new Error(storageError?.message || "Failed to create signed URL.");
    }

    // If client requested JSON
    const format = req.nextUrl.searchParams.get("format");
    if (format === "json") {
      return NextResponse.json({
        url: signedData.signedUrl,
        fileName: resumeRecord.file_name,
      });
    }

    // Otherwise redirect browser directly to signed URL
    return NextResponse.redirect(signedData.signedUrl, { status: 307 });
  } catch (err: unknown) {
    console.error("[API:ProfileResume:View:Error]", err);
    return NextResponse.json(
      { error: "Failed to generate resume preview link." },
      { status: 500 },
    );
  }
}
