import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Resume archival is intentionally disabled.
 *
 * Resumes contain personal data, and Walrus blobs are public by default. To
 * avoid publishing sensitive documents, resumes stay private in Supabase
 * Storage. This route returns a clear, honest response instead of attempting a
 * network write that may not be configured.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient(req);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      code: "RESUME_ARCHIVAL_DISABLED",
      error:
        "Resume archival is disabled. Resumes stay private in your account and are not published to a public network.",
    },
    { status: 410 },
  );
}
