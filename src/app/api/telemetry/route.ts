import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { telemetryRepository } from "@/features/feedback/repositories/telemetry.repository";
import {
  TelemetryBatchRequestSchema,
  TelemetryItemSchema,
} from "@/features/feedback/schemas/feedback.schema";

export const dynamic = "force-dynamic";

/**
 * POST /api/telemetry
 * Records quarantined interaction telemetry (batch or single).
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
        { error: "Unauthorized. Please sign in again." },
        { status: 401 },
      );
    }

    const body = await req.json();

    // Check if batch
    if (body && Array.isArray(body.events)) {
      const batchValidation = TelemetryBatchRequestSchema.safeParse(body);
      if (!batchValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid telemetry batch payload",
            details: batchValidation.error.format(),
          },
          { status: 422 },
        );
      }

      const count = await telemetryRepository.recordBatch(
        user.id,
        batchValidation.data.events.map((e) => ({
          jobId: e.jobId,
          interactionType: e.interactionType,
          durationMs: e.durationMs,
        })),
      );

      return NextResponse.json({ success: true, count }, { status: 200 });
    }

    // Single item
    const singleValidation = TelemetryItemSchema.safeParse(body);
    if (!singleValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid telemetry payload",
          details: singleValidation.error.format(),
        },
        { status: 422 },
      );
    }

    const item = singleValidation.data;
    const recorded = await telemetryRepository.recordInteraction(
      user.id,
      item.jobId,
      item.interactionType,
      item.durationMs,
    );

    return NextResponse.json(
      { success: true, event: recorded },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API:Telemetry:POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing interaction telemetry." },
      { status: 500 },
    );
  }
}
