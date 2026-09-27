import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasAlternativeAuthenticationMethod } from "@/lib/sui/auth-abstraction";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 15 unlink attempts per minute per IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit({
      key: `sui:unlink:${ip}`,
      limit: 15,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
          code: "RATE_LIMITED",
          resetInSeconds: rateCheck.resetInSeconds,
        },
        { status: 429 },
      );
    }

    // 2. Authenticate session: User MUST already be authenticated
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required to unlink wallet.",
          code: "UNAUTHENTICATED",
        },
        { status: 401 },
      );
    }

    // 3. Check if user currently has a linked wallet
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("sui_address")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Error checking profile during wallet unlink:",
        profileError,
      );
      return NextResponse.json(
        { error: "Failed to verify account state.", code: "DATABASE_ERROR" },
        { status: 500 },
      );
    }

    if (!profile?.sui_address) {
      return NextResponse.json(
        {
          error: "No Sui wallet is linked to this account.",
          code: "NO_WALLET_LINKED",
        },
        { status: 400 },
      );
    }

    // 4. Invariant: Check if user has an alternative authentication method
    // Sui-only users CANNOT unlink their only login mechanism
    if (!hasAlternativeAuthenticationMethod(user)) {
      return NextResponse.json(
        {
          error:
            "Cannot unlink wallet. You must have an alternative authentication method (e.g. email & password) before unlinking your only wallet.",
          code: "NO_ALTERNATIVE_AUTH_METHOD",
        },
        { status: 400 },
      );
    }

    // 5. Atomic unlinking: Set profiles.sui_address to NULL
    // Notice: auth.users is NOT deleted; only the Sui wallet association is cleared
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ sui_address: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to clear sui_address in profile:", updateError);
      return NextResponse.json(
        {
          error: "Failed to unlink wallet. Please try again.",
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sui wallet unlinked successfully.",
        userId: user.id,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("Sui Unlink Route Error:", errorObj);
    return NextResponse.json(
      {
        error:
          errorObj.message ||
          "An unexpected error occurred during wallet unlinking.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
