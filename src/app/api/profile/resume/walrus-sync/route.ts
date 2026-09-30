// ==============================================================================
// RESUME WALRUS SYNC ROUTE
// Module: @/app/api/profile/resume/walrus-sync/route
//
// Purpose:
// Publishes an existing uploaded resume PDF from Supabase Storage to the
// Walrus Testnet decentralized network, ensuring durability and verifiable proof.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { walrusClient } from "@/lib/walrus/walrus-client";
import { careerProfileService } from "@/features/profile/services/career-profile.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    // 1. Locate user's active resume
    const profile = await careerProfileService.getProfile(user.id);
    let resumeRecord = null;

    if (profile?.resumeId) {
      const { data } = await supabaseAdmin
        .from("resumes")
        .select("id, profile_id, storage_path, file_name, walrus_blob_id, walrus_status")
        .eq("id", profile.resumeId)
        .maybeSingle();
      resumeRecord = data;
    }

    if (!resumeRecord) {
      const { data: fallbackRecord } = await supabaseAdmin
        .from("resumes")
        .select("id, profile_id, storage_path, file_name, walrus_blob_id, walrus_status")
        .eq("profile_id", user.id)
        .neq("status", "failed")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      resumeRecord = fallbackRecord;
    }

    if (!resumeRecord || !resumeRecord.storage_path) {
      return NextResponse.json(
        { error: "No active resume document found to sync." },
        { status: 404 },
      );
    }

    // 2. Download PDF buffer from Supabase Storage
    const { data: fileData, error: downloadError } =
      await supabaseAdmin.storage
        .from("resumes")
        .download(resumeRecord.storage_path);

    if (downloadError || !fileData) {
      throw new Error(
        downloadError?.message || "Could not retrieve resume from storage.",
      );
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Mark as pending
    await supabaseAdmin
      .from("resumes")
      .update({ walrus_status: "pending" })
      .eq("id", resumeRecord.id);

    // 4. Store blob on Walrus Testnet (epochs=50 for ~50 days testnet lifetime)
    const result = await walrusClient.storeBlob(buffer, { epochs: 50 });

    // 5. Update database with certified Walrus blob ID
    await supabaseAdmin
      .from("resumes")
      .update({
        walrus_blob_id: result.blobId,
        walrus_status: "stored",
      })
      .eq("id", resumeRecord.id);

    return NextResponse.json({
      success: true,
      blobId: result.blobId,
      suiObjectId: result.suiObjectId,
      explorerUrl: walrusClient.getExplorerUrl(result.blobId),
      aggregatorUrl: walrusClient.getAggregatorUrl(result.blobId),
      isAlreadyCertified: result.isAlreadyCertified,
    });
  } catch (err: unknown) {
    console.error("[API:ProfileResume:WalrusSync:Error]", err);
    return NextResponse.json(
      {
        error: "Failed to publish resume to Walrus decentralized network.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
