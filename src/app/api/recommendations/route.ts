import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { matchingOrchestratorService } from "@/features/matching/services/matching-orchestrator.service";
import { ProfileNotFoundError } from "@/features/profile/errors/profile-errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations
 * Produces deterministic job recommendations and score breakdowns for authenticated candidate.
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
        { error: "Unauthorized! Sesi telah habis, silakan login kembali." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const rawLimit = searchParams.get("limit");
    let limit = 5;
    if (rawLimit) {
      const parsed = parseInt(rawLimit, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        limit = parsed;
      }
    }

    const recommendations =
      await matchingOrchestratorService.matchJobsForProfile(user.id, { limit });

    return NextResponse.json({ recommendations }, { status: 200 });
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return NextResponse.json(
        {
          error:
            "Profil karir belum ditemukan. Silakan lengkapi onboarding terlebih dahulu.",
          requiresOnboarding: true,
        },
        { status: 404 },
      );
    }

    console.error("[API:Recommendations:GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses rekomendasi pekerjaan." },
      { status: 500 },
    );
  }
}
