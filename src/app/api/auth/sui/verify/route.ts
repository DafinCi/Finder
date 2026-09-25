import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { verifySiwsMessage, SiwsVerificationError } from "@/lib/sui/siws-verifier";
import { resolveSuiWalletIdentity } from "@/lib/sui/identity-resolver";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 15 verification attempts per minute per IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit({
      key: `sui:verify:${ip}`,
      limit: 15,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many verification attempts. Please wait a moment and try again.",
          code: "RATE_LIMITED",
          resetInSeconds: rateCheck.resetInSeconds,
        },
        { status: 429 },
      );
    }

    // 2. Parse request payload
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body provided.", code: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const { message, signature } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid SIWS message string.", code: "INVALID_MESSAGE" },
        { status: 400 },
      );
    }

    if (!signature || typeof signature !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid wallet signature.", code: "INVALID_SIGNATURE" },
        { status: 400 },
      );
    }

    // 3. Cryptographic and SIWS message verification
    const host = req.headers.get("host") || undefined;
    const verification = await verifySiwsMessage({
      message,
      signature,
      expectedPurpose: "SIWS_LOGIN",
      expectedDomain: host,
    });

    // 4. Resolve verified Sui address to canonical Supabase auth.users identity
    const resolved = await resolveSuiWalletIdentity(verification.suiAddress);

    // 5. Official Supabase Session Bridge (Guardrail 1 - Zero Forgery)
    // Step A: Admin client generates official single-use magiclink OTP
    const linkRes = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: resolved.email,
    });

    if (linkRes.error || !linkRes.data?.properties) {
      console.error("Failed to generate official auth link:", linkRes.error);
      return NextResponse.json(
        { error: "Authentication provider failed to generate session token.", code: "AUTH_LINK_FAILED" },
        { status: 500 },
      );
    }

    const { hashed_token, verification_type } = linkRes.data.properties;

    // Step B: Server client (@supabase/ssr) consumes the official token and writes official session cookies
    const cookiesToSetBuffer: Array<{ name: string; value: string; options?: any }> = [];
    let nextCookies: any;
    try {
      nextCookies = await cookies();
    } catch {
      // In test environments or outside Next.js request store
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            if (nextCookies) {
              return nextCookies.getAll();
            }
            return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
          },
          setAll(cookiesToSet) {
            cookiesToSetBuffer.push(...cookiesToSet);
            if (nextCookies) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  nextCookies.set(name, value, options),
                );
              } catch {
                // Read-only server component safe catch
              }
            }
          },
        },
      },
    );

    const { data: sessionData, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: hashed_token,
      type: verification_type,
    });

    if (otpError || !sessionData.session) {
      console.error("verifyOtp session bridge error:", otpError);
      return NextResponse.json(
        { error: "Failed to establish authenticated session.", code: "SESSION_FAILED" },
        { status: 500 },
      );
    }

    // 6. Build response, set verified cookies, and clear the transient nonce cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Sign in with Sui wallet successful.",
        user: {
          id: resolved.userId,
          suiAddress: resolved.suiAddress,
          isNewUser: resolved.isNewUser,
        },
      },
      { status: 200 },
    );

    for (const { name, value, options } of cookiesToSetBuffer) {
      response.cookies.set(name, value, options);
    }

    response.cookies.delete("sui-siws-nonce");

    return response;
  } catch (err: unknown) {
    if (err instanceof SiwsVerificationError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: 400 },
      );
    }

    const errorObj = err as Error;
    console.error("SIWS Verification Route Error:", errorObj);
    return NextResponse.json(
      {
        error: errorObj.message || "An unexpected error occurred during wallet verification.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
