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
 * PATCH /api/profile/background
 * Updates background evidence (education, experience, projects) using CAS.
 */
export async function PATCH(req: NextRequest) {
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

    const profile = await careerProfileService.updateBackground(
      user.id,
      body.background,
      body.expected_version,
    );

    return NextResponse.json({ profile }, { status: 200 });
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

    console.error("[API:Profile:Background:PATCH] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan internal saat memperbarui data latar belakang.",
      },
      { status: 500 },
    );
  }
}
