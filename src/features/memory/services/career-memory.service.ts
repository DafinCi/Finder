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

export class CareerMemoryService {
  constructor(
    private readonly repository: CareerMemoryRepository = careerMemoryRepository,
    private readonly walrus: WalrusClient = walrusClient,
  ) {}

  /**
   * Remembers a new career fact:
   * 1. Validates schema and sanitizes text.
   * 2. Runs deduplication / superseding check against existing active memories.
   * 3. Persists immediately into Supabase database (<15ms).
   * 4. Triggers asynchronous background sync to Walrus Testnet (epochs=50) non-blockingly.
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

    // 3. Fire-and-forget background sync to Walrus Testnet
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
   * Generates a compressed, token-efficient context block of active memories
   * for injection into Career Copilot system prompt (Pre-fetch pattern).
   */
  async getDurableContextSummary(
    profileId: string,
    limit: number = 5,
  ): Promise<string> {
    const memories = await this.repository.getActiveMemories(profileId, limit);
    if (memories.length === 0) return "";

    const categoryLabels: Record<MemoryCategory, string> = {
      career_goal: "Arah / Target Karier",
      role_transition: "Transisi Peran",
      work_preference: "Preferensi Kerja",
      tech_focus: "Fokus Teknologi",
      constraint_avoid: "Hal yang Dihindari",
      user_correction: "Koreksi Pengguna",
    };

    const lines = memories.map((m) => {
      const label = categoryLabels[m.category] || m.category;
      return `- ${label}: ${m.content} (Confidence: ${m.confidence})`;
    });

    return `\n\n<untrusted_career_memory>\n[DURABLE CAREER MEMORIES (Hal yang Diingat Finder)]:
${lines.join("\n")}
</untrusted_career_memory>\n(Gunakan memori di atas sebagai konteks personalisasi; jangan bertentangan dengan preferensi terbaru kandidat).`;
  }

  /**
   * Asynchronously publishes a memory snapshot to Walrus Testnet:
   * - Serializes memory object to JSON.
   * - Uses 50 epochs (~50 days) storage duration.
   * - Conditionally updates database with walrus_blob_id.
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

      await this.repository.updateWalrusMetadata(
        memory.id,
        storeResult.blobId,
        storeResult.suiObjectId,
        "stored",
      );
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
