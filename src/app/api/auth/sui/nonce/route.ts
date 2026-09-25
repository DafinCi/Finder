import { NextRequest, NextResponse } from "next/server";
import { nonceManager, SiwsPurpose } from "@/lib/sui/nonce-manager";
import { getConfiguredSuiNetwork } from "@/lib/sui/network";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // 1. Rate limiting: 30 requests per minute per IP
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit({
      key: `sui:nonce:${ip}`,
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: "Too many authentication requests. Please try again later.",
          code: "RATE_LIMITED",
          resetInSeconds: rateCheck.resetInSeconds,
        },
        { status: 429 },
      );
    }

    // 2. Parse & validate purpose
    const { searchParams } = new URL(req.url);
    const rawPurpose = searchParams.get("purpose") || "SIWS_LOGIN";

    if (rawPurpose !== "SIWS_LOGIN" && rawPurpose !== "SIWS_LINK") {
      return NextResponse.json(
        {
          error: "Invalid purpose. Supported: 'SIWS_LOGIN', 'SIWS_LINK'.",
          code: "INVALID_PURPOSE",
        },
        { status: 400 },
      );
    }

    const purpose: SiwsPurpose = rawPurpose;
    const network = getConfiguredSuiNetwork();

    // 3. Generate secure nonce
    const record = nonceManager.generateNonce(purpose, network);

    // 4. Create response and attach secure HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        nonce: record.nonce,
        purpose: record.purpose,
        network: record.network,
        issuedAt: new Date(record.createdAt).toISOString(),
        expiresAt: new Date(record.expiresAt).toISOString(),
      },
      { status: 200 },
    );

    // Cookie TTL: 5 minutes matching nonce TTL
    response.cookies.set({
      name: "sui-siws-nonce",
      value: record.nonce,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });

    return response;
  } catch (error) {
    console.error("SIWS Nonce Route Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate authentication challenge.",
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
