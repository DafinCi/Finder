import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { careerProfileService } from "@/features/profile/services/career-profile.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile
 * Retrieves the current authenticated user's canonical CareerProfile.
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

    const profile = await careerProfileService.getProfile(user.id);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("[API:Profile:GET] Error retrieving profile:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memuat profil karir." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/profile
 * Initializes or retrieves candidate draft CareerProfile.
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

    let origin: "web" | "v1_migrated" = "web";
    try {
      const body = await req.json();
      if (body?.origin === "v1_migrated") {
        origin = "v1_migrated";
      }
    } catch {
      // Body is optional on draft init
    }

    const profile = await careerProfileService.getOrCreateDraft(
      user.id,
      origin,
    );
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error("[API:Profile:POST] Error initializing profile:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menginisialisasi profil karir." },
      { status: 500 },
    );
  }
}
