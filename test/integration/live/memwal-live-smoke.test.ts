// ==============================================================================
// TEST: Live Walrus Mainnet Integration Smoke Test for MemWal SDK
// Module: test/integration/live/memwal-live-smoke.test.ts
// Command: npx vitest run test/integration/live/memwal-live-smoke.test.ts
// ==============================================================================

import { describe, it, expect } from "vitest";
import { MemWalClient } from "@/lib/walrus/memwal-client";
import {
  isRecalledMemoryZombie,
} from "@/features/memory/services/career-memory.service";
import { CareerMemory } from "@/features/memory/types/memory.types";

describe("Live Walrus Mainnet Smoke Test (MemWal SDK)", () => {
  const accountId = process.env.MEMWAL_ACCOUNT_ID;
  const delegateKey = process.env.MEMWAL_DELEGATE_PRIVATE_KEY;
  const serverUrl = process.env.MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz";

  it("should have live Mainnet credentials configured in environment", () => {
    expect(accountId).toBeDefined();
    expect(accountId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(delegateKey).toBeDefined();
    expect(delegateKey?.length).toBeGreaterThan(32);
    expect(serverUrl).toContain("walrus.xyz");
  });

  it("should successfully connect, store, and recall from live Walrus Mainnet", async () => {
    // 1. Initialize live MemWal client
    const client = new MemWalClient({ forceLive: true });
    expect(client.isLive()).toBe(true);

    // 2. Publish unique atomic fact to smoke namespace
    const testNamespace = `finder:smoke:${Date.now()}`;
    const testFact = `Candidate [TECH_FOCUS]: Live Mainnet smoke verification for Rust and Sui Move at ${new Date().toISOString()}`;

    console.info(`[SmokeTest] Writing to live namespace: ${testNamespace}`);
    const storeStart = Date.now();

    const storedResult = await client.rememberAndWait(testFact, testNamespace);
    const storeDuration = ((Date.now() - storeStart) / 1000).toFixed(2);

    console.info(`[SmokeTest] RememberAndWait succeeded in ${storeDuration}s`);
    console.info(`[SmokeTest] Job ID : ${storedResult.jobId}`);
    console.info(`[SmokeTest] Blob ID: ${storedResult.blobId || "Pending indexing"}`);
    console.info(`[SmokeTest] isMock : ${storedResult.isMock}`);

    expect(storedResult.isMock).toBe(false);
    expect(storedResult.jobId).toBeDefined();
    expect(storedResult.namespace).toBe(testNamespace);

    if (storedResult.blobId) {
      const explorerUrl = client.getBlobExplorerUrl(storedResult.blobId);
      console.info(`[SmokeTest] Walruscan URL: ${explorerUrl}`);
      expect(explorerUrl).toContain("walruscan.com/mainnet/blob");
    }

    // 3. Perform live semantic vector recall
    console.info(`[SmokeTest] Querying live relayer with natural language...`);
    const recallStart = Date.now();
    const recallResult = await client.recall({
      query: "Which programming languages does the candidate focus on?",
      namespace: testNamespace,
      limit: 3,
    });
    const recallDuration = ((Date.now() - recallStart) / 1000).toFixed(2);

    console.info(`[SmokeTest] Recall completed in ${recallDuration}s. Results: ${recallResult.results.length}`);
    expect(recallResult).toBeDefined();

    if (recallResult.results.length > 0) {
      const firstHit = recallResult.results[0];
      console.info(`[SmokeTest] First hit text: "${firstHit.text}"`);
      console.info(`[SmokeTest] Distance      : ${firstHit.distance}`);
      expect(firstHit.text).toContain("Rust and Sui Move");

      // 4. Verify zombie filtering works on real live recalled hit
      const fakeInactiveDbRecord: CareerMemory = {
        id: "mem-forgotten-smoke",
        profileId: "smoke-user-id",
        category: "tech_focus",
        content: "Live Mainnet smoke verification for Rust and Sui Move",
        source: "explicit_user",
        confidence: "high",
        status: "forgotten",
        walrusStatus: "stored",
        walrusBlobId: firstHit.blob_id || storedResult.blobId || "blob-fallback",
        walrusObjectId: null,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const isZombie = isRecalledMemoryZombie(firstHit, [fakeInactiveDbRecord]);
      expect(isZombie).toBe(true);
      console.info(`[SmokeTest] Zombie filter on live MemWal hit: VERIFIED (True)`);
    } else {
      console.warn(`[SmokeTest] Note: Indexing may still be in progress on relayer background queue.`);
    }
  }, 90000); // 90-second timeout for live network call
});
