// ==============================================================================
// WALRUS CAREER PASSPORT SNAPSHOT API
// Module: @/app/api/profile/snapshot/walrus/route
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { careerSnapshotService } from "@/features/walrus/services/career-snapshot.service";
import { walrusClient } from "@/lib/walrus/walrus-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshotBlobId = user.user_metadata?.career_snapshot_blob_id as
      | string
      | undefined;
    const updatedAt = user.user_metadata?.career_snapshot_updated_at as
      | string
      | undefined;

    return NextResponse.json({
      blobId: snapshotBlobId || null,
      updatedAt: updatedAt || null,
      explorerUrl: snapshotBlobId
        ? walrusClient.getExplorerUrl(snapshotBlobId)
        : null,
      aggregatorUrl: snapshotBlobId
        ? walrusClient.getAggregatorUrl(snapshotBlobId)
        : null,
    });
  } catch (err: unknown) {
    console.error("[API:CareerSnapshot:GET]", err);
    return NextResponse.json(
      { error: "Failed to load snapshot status." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await careerSnapshotService.generateAndPublish(user.id);

    return NextResponse.json({
      success: true,
      blobId: result.blobId,
      suiObjectId: result.suiObjectId,
      explorerUrl: result.explorerUrl,
      aggregatorUrl: result.aggregatorUrl,
      exportedAt: result.snapshot.exported_at,
    });
  } catch (err: unknown) {
    console.error("[API:CareerSnapshot:POST]", err);
    return NextResponse.json(
      {
        error: "Failed to generate sovereign snapshot on Walrus.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
