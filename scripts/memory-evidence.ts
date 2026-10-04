// SCRIPT: Walrus Memory Evidence Report (read-only)
// Run: npx tsx --env-file=.env.local scripts/memory-evidence.ts [--json] [--out report.md] [--all-blobs]
//
// Summarizes how many memories and Mainnet blobs each user has stored, with the
// user's name and linked wallet so a reviewer can tell the accounts apart. This
// is the evidence used for the hackathon submission form and the article. It
// never writes to the database.

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import {
  buildMemoryEvidenceReport,
  renderMemoryEvidenceMarkdown,
  type MemoryEvidenceRow,
  type MemoryEvidenceProfile,
} from "../src/features/memory/utils/memory-evidence";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "[!] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [memoriesResult, profilesResult] = await Promise.all([
    supabase
      .from("career_memories")
      .select("profile_id, status, walrus_status, walrus_blob_id, updated_at"),
    supabase.from("profiles").select("id, full_name, sui_address"),
  ]);

  if (memoriesResult.error) {
    console.error(
      "[!] Failed to read career_memories:",
      memoriesResult.error.message,
    );
    process.exit(1);
  }

  if (profilesResult.error) {
    console.warn(
      "[!] Failed to read profiles. Name and wallet columns will be empty:",
      profilesResult.error.message,
    );
  }

  const report = buildMemoryEvidenceReport(
    (memoriesResult.data ?? []) as MemoryEvidenceRow[],
    {
      agentId: process.env.MEMWAL_ACCOUNT_ID ?? null,
      network: process.env.NEXT_PUBLIC_WALRUS_NETWORK ?? "mainnet",
      profiles: (profilesResult.data ?? []) as MemoryEvidenceProfile[],
      ...(process.argv.includes("--all-blobs")
        ? { sampleBlobIdsPerUser: Number.POSITIVE_INFINITY }
        : {}),
    },
  );

  const asJson = process.argv.includes("--json");
  const output = asJson
    ? JSON.stringify(report, null, 2)
    : renderMemoryEvidenceMarkdown(report);

  console.log(output);

  const outIndex = process.argv.indexOf("--out");
  const outPath = outIndex !== -1 ? process.argv[outIndex + 1] : null;
  if (outPath) {
    writeFileSync(outPath, output, "utf8");
    console.log(`\nReport written to ${outPath}`);
  }
}

main().catch((err) => {
  console.error("[!] Unexpected error:", err);
  process.exit(1);
});
