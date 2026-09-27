import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSyntheticSuiEmail } from "@/lib/sui/auth-abstraction";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 400 },
      );
    }

    // Guardrail 4: Block synthetic wallet emails from password authentication
    if (isSyntheticSuiEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Wallet authentication must be performed using Sign-In with Sui.",
          code: "SYNTHETIC_EMAIL_NOT_PERMITTED",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sign in successful.",
        user: data.user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Signin Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 },
    );
  }
}
