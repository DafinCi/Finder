import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSyntheticSuiEmail } from "@/lib/sui/auth-abstraction";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required.", code: "INVALID_CREDENTIALS" },
        { status: 400 },
      );
    }

    // Guardrail 4: Block registration with synthetic wallet identity domain
    if (isSyntheticSuiEmail(email)) {
      return NextResponse.json(
        {
          error: "Registration with synthetic wallet identity email is not permitted.",
          code: "SYNTHETIC_EMAIL_NOT_PERMITTED",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Please check your email for confirmation if required.",
        user: data.user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 },
    );
  }
}
