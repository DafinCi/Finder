import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { jobIngestionService } from "@/features/jobs/services/job-ingestion.service";

/**
 * Performs a timing-safe constant-time comparison between two secret strings.
 * Safely handles missing, empty, or mismatched length buffers to avoid timing side-channels.
 */
function timingSafeEqualSecret(
  provided: string | null | undefined,
  configured: string,
): boolean {
  if (!provided || typeof provided !== "string") {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);

  if (providedBuffer.length !== configuredBuffer.length) {
    // Prevent timing leaks based on length return by performing a dummy constant-time comparison
    crypto.timingSafeEqual(configuredBuffer, configuredBuffer);
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, configuredBuffer);
}

/**
 * Validates whether the incoming request contains an authorized sync secret.
 */
function isAuthorized(request: NextRequest): boolean {
  const configuredSecret =
    process.env.CRON_SECRET || process.env.JOB_SYNC_SECRET;

  if (!configuredSecret) {
    // In test or development environment where no secret is configured, allow local dev bypass
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    // If running in production or staging without secret configured, reject for security
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : null;
  const customSecret = request.headers.get("x-sync-secret");

  const providedSecret = bearerToken || customSecret;

  return timingSafeEqualSecret(providedSecret, configuredSecret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing sync authorization secret.",
      },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || "remotive";

    // In Phase 1, only Remotive is supported
    if (provider !== "remotive") {
      return NextResponse.json(
        {
          success: false,
          error: `Provider '${provider}' is not supported in Phase 1. Only 'remotive' is available.`,
        },
        { status: 400 },
      );
    }

    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Remotive public API ignores category and search; only limit is supported via client-side slicing
    const result = await jobIngestionService.syncRemotive({
      limit: limit && !isNaN(limit) ? limit : undefined,
    });

    const isFailure = result.failed > 0 && result.upserted === 0;

    return NextResponse.json(
      {
        success: !isFailure,
        data: result,
      },
      { status: isFailure ? 502 : 200 },
    );
  } catch (error: any) {
    console.error("[SyncApi] Unexpected ingestion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Internal server error during ingestion: ${error.message}`,
      },
      { status: 500 },
    );
  }
}
