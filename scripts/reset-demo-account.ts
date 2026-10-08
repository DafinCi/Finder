// SCRIPT: Reset the shared demo account (destructive)
// Run: npx tsx --env-file=.env.local scripts/reset-demo-account.ts --yes
//
// Clears the demo account's conversations, memories, saved jobs, feedback, and
// telemetry so the demo looks fresh. It keeps the account, its profile, and the
// uploaded resume, so onboarding stays complete.

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const demoEmail =
    process.env.NEXT_PUBLIC_DEMO_EMAIL || process.env.DEMO_EMAIL || "";

  if (!url || !serviceKey) {
    console.error("[!] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  if (!demoEmail) {
    console.error("[!] Set NEXT_PUBLIC_DEMO_EMAIL or DEMO_EMAIL to target the demo account.");
    process.exit(1);
  }
  if (!process.argv.includes("--yes")) {
    console.error(
      `[!] This deletes data for ${demoEmail}. Re-run with --yes to confirm.`,
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("[!] Failed to list auth users:", listError.message);
    process.exit(1);
  }

  const user = users.users.find(
    (candidate) => candidate.email?.toLowerCase() === demoEmail.toLowerCase(),
  );
  if (!user) {
    console.error(`[!] No auth user found for ${demoEmail}.`);
    process.exit(1);
  }

  const profileId = user.id;

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", profileId);

  const sessionIds = (sessions ?? []).map((session) => session.id);

  if (sessionIds.length > 0) {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .in("session_id", sessionIds);
    if (error) {
      console.error("[!] Failed to delete chat messages:", error.message);
      process.exit(1);
    }
  }

  const results = await Promise.all([
    supabase.from("chat_sessions").delete().eq("user_id", profileId),
    supabase.from("career_memories").delete().eq("profile_id", profileId),
    supabase.from("saved_jobs").delete().eq("profile_id", profileId),
    supabase.from("job_feedback_events").delete().eq("profile_id", profileId),
    supabase
      .from("job_interaction_telemetry")
      .delete()
      .eq("profile_id", profileId),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error("[!] Reset failed:", failed.error.message);
    process.exit(1);
  }

  console.log(
    `[+] Demo account reset. Sessions removed: ${sessionIds.length}. Profile and resume kept.`,
  );
}

main().catch((err) => {
  console.error("[!] Unexpected error:", err);
  process.exit(1);
});
