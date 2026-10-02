// ==============================================================================
// SERVICE: Sovereign Career Memory Service
// Module: @/features/memory/services/career-memory.service
// ==============================================================================

import {
  CareerMemoryRepository,
  careerMemoryRepository,
} from "../repositories/career-memory.repository";
import {
  CareerMemory,
  CreateMemoryInput,
  CreateMemorySchema,
  MemoryCategory,
} from "../types/memory.types";
import { walrusClient, WalrusClient } from "@/lib/walrus/walrus-client";
import { memwalClient, MemWalClient } from "@/lib/walrus/memwal-client";
import type { RecallMemory } from "@mysten-incubation/memwal";

export class CareerMemoryService {
  constructor(
    private readonly repository: CareerMemoryRepository = careerMemoryRepository,
    private readonly walrus: WalrusClient = walrusClient,
    private readonly memwal: MemWalClient = memwalClient,
  ) {}

  /**
   * Remembers a new career fact:
   * 1. Validates schema and sanitizes text.
   * 2. Runs deduplication / superseding check against existing active memories.
   * 3. Persists immediately into Supabase database (<15ms).
   * 4. Triggers asynchronous background sync to Walrus Mainnet / MemWal non-blockingly.
   */
  async rememberFact(
    profileId: string,
    input: Omit<CreateMemoryInput, "profileId">,
  ): Promise<CareerMemory> {
    const validated = CreateMemorySchema.parse(input);

    // 1. Keyword extraction for deduplication / superseding
    const words = validated.content
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    const existingSimilar = await this.repository.findSimilarActiveMemory(
      profileId,
      validated.category,
      words.slice(0, 5),
    );

    // If an active memory of the same category with overlapping topic exists, supersede it
    if (existingSimilar) {
      await this.repository.updateMemoryStatus(
        existingSimilar.id,
        profileId,
        "superseded",
      );
    }

    // 2. Persist new active memory
    const memory = await this.repository.createMemory({
      ...validated,
      profileId,
    });

    // 3. Fire-and-forget background sync to Walrus Mainnet and MemWal
    this.syncMemoryToWalrus(memory.id, profileId, memory).catch((err) => {
      console.warn(
        `[WalrusSync] Non-blocking upload for memory ${memory.id} failed:`,
        (err as Error).message,
      );
    });

    return memory;
  }

  /**
   * Forgets a memory by marking its status as 'forgotten'.
   */
  async forgetMemory(
    profileId: string,
    memoryId: string,
  ): Promise<CareerMemory> {
    return this.repository.updateMemoryStatus(memoryId, profileId, "forgotten");
  }

  /**
   * Retrieves active memories for a candidate.
   */
  async getActiveMemories(
    profileId: string,
    limit: number = 5,
  ): Promise<CareerMemory[]> {
    return this.repository.getActiveMemories(profileId, limit);
  }

  /**
   * Retrieves all memories for management dashboard.
   */
  async getAllMemories(profileId: string): Promise<CareerMemory[]> {
    return this.repository.getAllMemoriesForUser(profileId);
  }

  /**
   * Recalls semantically relevant memories from Walrus Memory (MemWal) using natural language query.
   */
  async recallFromWalrus(
    profileId: string,
    query: string,
    limit: number = 5,
  ): Promise<RecallMemory[]> {
    const namespace = this.memwal.getUserNamespace(profileId);
    const recallResult = await this.memwal.recall({
      query,
      limit,
      namespace,
    });
    return recallResult.results;
  }

  /**
   * Generates a compressed, token-efficient context block of memories.
   * If a natural language query is provided, it prioritizes semantic recall from Walrus Memory.
   * Otherwise, it loads active memories from the repository cache.
   */
  async getDurableContextSummary(
    profileId: string,
    limit: number = 5,
    query?: string,
  ): Promise<string> {
    // 1. If query is provided, attempt semantic recall from Walrus Memory (MemWal)
    if (query && query.trim().length > 0) {
      try {
        const recalled = await this.recallFromWalrus(profileId, query, limit);
        if (recalled.length > 0) {
          const lines = recalled.map((m) => `- ${m.text}`);
          return `\n\n<untrusted_career_memory>\n[RECALLED FROM WALRUS MEMORY (Mainnet)]:
${lines.join("\n")}
</untrusted_career_memory>\n(Use the verified decentralized memories above to tailor recommendations and advice).`;
        }
      } catch (err) {
        console.warn(
          "[CareerMemoryService] Walrus semantic recall failed, falling back to local memory cache:",
          (err as Error).message,
        );
      }
    }

    // 2. Fallback to active memories from database cache
    const memories = await this.repository.getActiveMemories(profileId, limit);
    if (memories.length === 0) return "";

    const categoryLabels: Record<MemoryCategory, string> = {
      career_goal: "Career Goal / Direction",
      role_transition: "Role Transition",
      work_preference: "Work Mode Preference",
      tech_focus: "Technology Focus",
      constraint_avoid: "Constraints to Avoid",
      user_correction: "User Correction",
    };

    const lines = memories.map((m) => {
      const label = categoryLabels[m.category] || m.category;
      return `- ${label}: ${m.content} (Confidence: ${m.confidence})`;
    });

    return `\n\n<untrusted_career_memory>\n[DURABLE CAREER MEMORIES]:
${lines.join("\n")}
</untrusted_career_memory>\n(Use the memories above as personalization context; do not contradict recent candidate preferences).`;
  }

  /**
   * Asynchronously publishes a memory snapshot to Walrus Mainnet and MemWal:
   * 1. Stores encrypted vector memory via MemWal SDK into user namespace.
   * 2. Also writes verifiable JSON backup snapshot to Walrus storage client.
   * 3. Updates database with the resulting certified blob ID.
   */
  async syncMemoryToWalrus(
    memoryId: string,
    profileId: string,
    memoryData?: CareerMemory,
  ): Promise<void> {
    try {
      const memory =
        memoryData ||
        (await this.repository.getMemoryById(memoryId, profileId));
      if (!memory || memory.status === "forgotten") {
        return;
      }

      // 1. Raw JSON snapshot via Walrus storage client
      const payload = {
        version: "1.0",
        schema: "finder.career_memory",
        memoryId: memory.id,
        category: memory.category,
        content: memory.content,
        source: memory.source,
        confidence: memory.confidence,
        timestamp: memory.createdAt,
        verifiedAt: new Date().toISOString(),
      };

      const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
      const storeResult = await this.walrus.storeBlob(buffer, {
        epochs: 50,
        deletable: true,
      });

      let blobId = storeResult.blobId;
      let suiObjectId = storeResult.suiObjectId;

      // 2. Store via MemWal SDK (semantic memory space with Seal encryption)
      try {
        const namespace = this.memwal.getUserNamespace(profileId);
        const atomicFactText = `Candidate [${memory.category.toUpperCase()}]: ${memory.content}`;
        const memwalResult = await this.memwal.rememberAndWait(
          atomicFactText,
          namespace,
        );
        if (memwalResult.blobId) {
          blobId = memwalResult.blobId;
        }
      } catch (memwalErr) {
        console.warn(
          `[WalrusSync] MemWal SDK rememberAndWait failed for ${memoryId}:`,
          (memwalErr as Error).message,
        );
      }

      // 3. Update repository with Walrus metadata
      if (blobId) {
        await this.repository.updateWalrusMetadata(
          memory.id,
          blobId,
          suiObjectId,
          "stored",
        );
      }
    } catch (error) {
      console.warn(
        `[WalrusSyncError] Failed to store memory ${memoryId} on Walrus:`,
        (error as Error).message,
      );
      // Mark as failed in DB so it can be retried later
      await this.repository
        .updateWalrusMetadata(memoryId, "", undefined, "failed")
        .catch(() => {});
    }
  }
}

export const careerMemoryService = new CareerMemoryService();
