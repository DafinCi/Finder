import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  verifySiwsMessage,
  SiwsVerificationError,
} from "@/lib/sui/siws-verifier";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 15 link attempts per minute per IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit({
      key: `sui:link:${ip}`,
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
          error: "Authentication required to link a wallet.",
          code: "UNAUTHENTICATED",
        },
        { status: 401 },
      );
    }

    // 3. Parse request payload
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body provided.", code: "INVALID_SIWS" },
        { status: 400 },
      );
    }

    const { message, signature } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          error: "Missing or invalid SIWS message string.",
          code: "INVALID_SIWS",
        },
        { status: 400 },
      );
    }

    if (!signature || typeof signature !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid wallet signature.", code: "INVALID_SIWS" },
        { status: 400 },
      );
    }

    // 4. Verify SIWS proof: Purpose MUST be SIWS_LINK
    const host = req.headers.get("host") || undefined;
    const verification = await verifySiwsMessage({
      message,
      signature,
      expectedPurpose: "SIWS_LINK",
      expectedDomain: host,
    });

    // Signer address is derived strictly from cryptographic verification
    const verifiedSuiAddress = verification.suiAddress;

    // 5. Check if current user already has a wallet linked
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("sui_address")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Error checking current profile during wallet link:",
        profileError,
      );
      return NextResponse.json(
        { error: "Failed to verify account state.", code: "DATABASE_ERROR" },
        { status: 500 },
      );
    }

    if (currentProfile?.sui_address) {
      if (currentProfile.sui_address === verifiedSuiAddress) {
        return NextResponse.json(
          {
            success: true,
            message: "Wallet is already linked to this account.",
            suiAddress: verifiedSuiAddress,
            userId: user.id,
          },
          { status: 200 },
        );
      } else {
        // User already has a different wallet linked; do not silently overwrite
        return NextResponse.json(
          {
            error:
              "An existing wallet is already linked to this account. Please unlink it before linking a new wallet.",
            code: "WALLET_ALREADY_LINKED",
          },
          { status: 400 },
        );
      }
    }

    // 6. Check if target wallet is already linked to ANOTHER account (deterministic conflict check)
    const { data: existingBinding, error: bindingError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("sui_address", verifiedSuiAddress)
      .maybeSingle();

    if (bindingError) {
      console.error("Error checking wallet binding:", bindingError);
      return NextResponse.json(
        {
          error: "Failed to verify wallet uniqueness.",
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      );
    }

    if (existingBinding && existingBinding.id !== user.id) {
      return NextResponse.json(
        {
          error: "This Sui wallet is already linked to another account.",
          code: "WALLET_ALREADY_LINKED",
        },
        { status: 409 },
      );
    }

    // 7. Atomic update on profiles table
    // PostgreSQL constraint `uq_profiles_sui_address` protects against concurrent race conditions
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ sui_address: verifiedSuiAddress })
      .eq("id", user.id);

    if (updateError) {
      // 23505 is PostgreSQL unique_violation code
      if (
        updateError.code === "23505" ||
        updateError.message.includes("uq_profiles_sui_address")
      ) {
        return NextResponse.json(
          {
            error: "This Sui wallet is already linked to another account.",
            code: "WALLET_ALREADY_LINKED",
          },
          { status: 409 },
        );
      }

      console.error("Failed to update profile with Sui wallet:", updateError);
      return NextResponse.json(
        {
          error: "Failed to link wallet. Please try again.",
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      );
    }

    // 8. Success: delete transient nonce cookie and return confirmed identity
    const response = NextResponse.json(
      {
        success: true,
        message: "Sui wallet linked successfully.",
        suiAddress: verifiedSuiAddress,
        userId: user.id,
      },
      { status: 200 },
    );

    response.cookies.delete("sui-siws-nonce");
    return response;
  } catch (err: unknown) {
    if (err instanceof SiwsVerificationError) {
      let code: string = err.code;
      if (
        err.code === "INVALID_SIWS_MESSAGE" ||
        err.code === "INVALID_SIGNATURE" ||
        err.code === "DOMAIN_MISMATCH" ||
        err.code === "EXPIRED_MESSAGE"
      ) {
        code = "INVALID_SIWS";
      } else if (
        err.code === "EXPIRED_NONCE" ||
        err.code === "NONCE_ALREADY_USED"
      ) {
        code = "INVALID_NONCE";
      }

      return NextResponse.json(
        {
          error: err.message,
          code,
        },
        { status: 400 },
      );
    }

    const errorObj = err as Error;
    console.error("Sui Link Route Error:", errorObj);
    return NextResponse.json(
      {
        error:
          errorObj.message ||
          "An unexpected error occurred during wallet linking.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
