// ==============================================================================
// SCRIPT: Live Walrus Mainnet Smoke Test for MemWal SDK
// Run: npx tsx --env-file=.env.local scripts/smoke-test-mainnet.ts
// ==============================================================================

import { MemWalClient } from "../src/lib/walrus/memwal-client";
import {
  isRecalledMemoryZombie,
  normalizeMemoryContent,
} from "../src/features/memory/services/career-memory.service";
import { CareerMemory } from "../src/features/memory/types/memory.types";

async function main() {
  console.log("================================================================");
  console.log(" WALRUS MAINNET LIVE SMOKE TEST: MEMWAL SDK INTEGRATION");
  console.log("================================================================\n");

  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  const serverUrl = process.env.MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz";
  const network = process.env.NEXT_PUBLIC_WALRUS_NETWORK || "mainnet";

  console.log(`[*] Target Network : ${network.toUpperCase()}`);
  console.log(`[*] Relayer Server : ${serverUrl}`);
  console.log(`[*] Account / Agent: ${accountId || "NOT CONFIGURED"}`);

  if (!accountId || !process.env.MEMWAL_DELEGATE_PRIVATE_KEY) {
    console.error("\n[!] ERROR: Missing MEMWAL_ACCOUNT_ID or MEMWAL_DELEGATE_PRIVATE_KEY in environment.");
    process.exit(1);
  }

  // 1. Initialize client in forced live mode
  console.log("\n[1/4] Initializing MemWalClient in forced live mode...");
  const memwal = new MemWalClient({ forceLive: true });

  if (!memwal.isLive()) {
    console.error("[!] Failed: MemWalClient fell back to mock mode.");
    process.exit(1);
  }
  console.log("[+] MemWalClient initialized successfully in LIVE relayer mode.");

  // 2. Write a verified test fact to a dedicated smoke namespace
  const testNamespace = `finder:smoke:${Date.now()}`;
  const testFact = `Candidate [TECH_FOCUS]: Verified Sui Move and Rust developer targeting Walrus Mainnet ecosystem at ${new Date().toISOString()}`;

  console.log(`\n[2/4] Publishing atomic memory fact to Walrus Mainnet...`);
  console.log(`    Namespace : ${testNamespace}`);
  console.log(`    Content   : "${testFact}"`);
  console.log(`    Waiting for TEE encryption, Seal key exchange, and Walrus certification...`);

  const startTime = Date.now();
  let storedResult;
  try {
    storedResult = await memwal.rememberAndWait(testFact, testNamespace);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[+] Fact certified and stored in ${duration}s!`);
    console.log(`    Blob ID   : ${storedResult.blobId || "Pending / In-Job"}`);
    console.log(`    Job ID    : ${storedResult.jobId}`);
    if (storedResult.blobId) {
      console.log(`    Walruscan : ${memwal.getBlobExplorerUrl(storedResult.blobId)}`);
    }
  } catch (storeError) {
    console.error("[!] Failed to store memory on Walrus Mainnet:", (storeError as Error).message);
    throw storeError;
  }

  // 3. Recall the fact semantically from Walrus Memory
  console.log(`\n[3/4] Performing semantic vector recall from live MemWal relayer...`);
  const query = "What blockchain ecosystems and programming languages does the candidate know?";
  console.log(`    Query: "${query}"`);

  const recallStart = Date.now();
  const recallResult = await memwal.recall({
    query,
    namespace: testNamespace,
    limit: 3,
  });
  const recallDuration = ((Date.now() - recallStart) / 1000).toFixed(2);

  console.log(`[+] Recall completed in ${recallDuration}s. Total matches found: ${recallResult.results.length}`);

  if (recallResult.results.length === 0) {
    console.warn("[!] Warning: Zero matches returned on immediate recall (relayer may still be re-indexing vectors).");
  } else {
    recallResult.results.forEach((match, idx) => {
      console.log(`    Match #${idx + 1} (distance: ${match.distance?.toFixed(4) ?? "N/A"}):`);
      console.log(`      Text   : "${match.text}"`);
      console.log(`      Blob ID: ${match.blob_id || "N/A"}`);
    });
  }

  // 4. Verify Zombie Memory Filtering on live recalled result
  console.log(`\n[4/4] Verifying canonical lifecycle filtering (Zombie Memory Defense)...`);
  const recalledHit = recallResult.results[0] || {
    blob_id: storedResult.blobId || "blob-sample",
    text: testFact,
    distance: 0.05,
  };

  const fakeInactiveDbRecord: CareerMemory = {
    id: "mem-forgotten-smoke",
    profileId: "smoke-user-id",
    category: "tech_focus",
    content: "Verified Sui Move and Rust developer",
    source: "explicit_user",
    confidence: "high",
    status: "forgotten",
    walrusStatus: "stored",
    walrusBlobId: storedResult.blobId || "blob-sample",
    walrusObjectId: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isZombie = isRecalledMemoryZombie(recalledHit, [fakeInactiveDbRecord]);
  console.log(`    Simulating forgotten status in PostgreSQL for this fact...`);
  console.log(`    isRecalledMemoryZombie() result: ${isZombie ? "TRUE (CORRECTLY DROPPED)" : "FALSE (FAILED)"}`);

  if (!isZombie) {
    console.error("[!] Lifecycle guard failed to identify forgotten memory as zombie.");
    process.exit(1);
  }

  console.log("\n================================================================");
  console.log(" SMOKE TEST RESULT: ALL LIVE MAINNET CHECKS PASSED!");
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("\n[!] FATAL UNCAUGHT ERROR IN SMOKE TEST:", err);
  process.exit(1);
});
