import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { careerProfileService } from "@/features/profile/services/career-profile.service";
import {
  ProfileNotFoundError,
  VersionConflictError,
  ProfileValidationError,
  InvalidProfileStateError,
} from "@/features/profile/errors/profile-errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/profile/confirm
 * Finalizes onboarding profile confirmation.
 * Sets status='active', onboarding_completed=true, and locks in confirmed user intent.
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

    if (typeof body?.expected_version !== "number") {
      return NextResponse.json(
        {
          error:
            "expected_version (number) is required for optimistic concurrency control.",
        },
        { status: 400 },
      );
    }

    const confirmedProfile = await careerProfileService.confirmProfile(
      user.id,
      body,
      body.expected_version,
    );

    return NextResponse.json({ profile: confirmedProfile }, { status: 200 });
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          expectedVersion: error.expectedVersion,
          currentVersion: error.currentVersion,
        },
        { status: 409 },
      );
    }

    if (error instanceof ProfileNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ProfileValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 422 },
      );
    }

    if (error instanceof InvalidProfileStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[API:Profile:Confirm:POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat mengonfirmasi profil karir." },
      { status: 500 },
    );
  }
}
