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
  MemoryConfidence,
} from "../types/memory.types";
import { memwalClient, MemWalClient } from "@/lib/walrus/memwal-client";
import type { RecallMemory } from "@mysten-incubation/memwal";
import { emitAiEvent } from "@/lib/observability/ai-events";

/**
 * Normalizes memory text for comparison by removing category prefixes, punctuation, and extra whitespace.
 */
export function normalizeMemoryContent(text: string): string {
  return text
    .toLowerCase()
    .replace(/^candidate\s*\[.*?\]:\s*/i, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type MemoryRecallSource = "walrus" | "cache" | "none";

export interface DurableMemoryItem {
  id: string | null;
  content: string;
  category: string | null;
  blobId: string | null;
  source: Exclude<MemoryRecallSource, "none">;
}

export interface DurableMemoryRecall {
  source: MemoryRecallSource;
  memories: DurableMemoryItem[];
  context: string;
}

/**
 * Splits the stored "Candidate [CATEGORY]: content" wrapper into parts.
 */
export function parseMemoryText(text: string): {
  category: string | null;
  content: string;
} {
  const match = /^\s*candidate\s*\[([^\]]+)\]:\s*(.*)$/i.exec(text || "");
  if (match) {
    return {
      category: match[1].toLowerCase(),
      content: match[2].trim(),
    };
  }
  return { category: null, content: (text || "").trim() };
}

const CONFIDENCE_LADDER: MemoryConfidence[] = ["low", "medium", "high"];

/**
 * Raises a confidence level by one step. Already-high memories stay high.
 */
export function bumpMemoryConfidence(
  confidence: MemoryConfidence,
): MemoryConfidence {
  const index = CONFIDENCE_LADDER.indexOf(confidence);
  if (index < 0) return "high";
  return CONFIDENCE_LADDER[
    Math.min(index + 1, CONFIDENCE_LADDER.length - 1)
  ];
}

/**
 * Checks if a recalled MemWal item matches an inactive (forgotten or superseded) memory record.
 * Uses exact Walrus blob ID matching when available, with normalized content fuzzy matching fallback.
 */
export function isRecalledMemoryZombie(
  recalled: RecallMemory,
  inactiveMemories: CareerMemory[],
): boolean {
  if (inactiveMemories.length === 0) return false;

  const recalledNorm = normalizeMemoryContent(recalled.text);
  if (!recalledNorm) return false;

  return inactiveMemories.some((inact) => {
    // 1. Exact Walrus blob ID match
    if (
      inact.walrusBlobId &&
      recalled.blob_id &&
      inact.walrusBlobId === recalled.blob_id
    ) {
      return true;
    }

    // 2. Normalized content match
    const inactNorm = normalizeMemoryContent(inact.content);
    if (!inactNorm) return false;

    return (
      recalledNorm.includes(inactNorm) ||
      inactNorm.includes(recalledNorm)
    );
  });
}

export class CareerMemoryService {
  private readonly repository: CareerMemoryRepository;
  private readonly memwal: MemWalClient;

  constructor(
    repository: CareerMemoryRepository = careerMemoryRepository,
    memwalOrWalrus?: any,
    memwalArg?: MemWalClient,
  ) {
    this.repository = repository;
    if (memwalArg) {
      this.memwal = memwalArg;
    } else if (memwalOrWalrus && typeof memwalOrWalrus.rememberAndWait === "function") {
      this.memwal = memwalOrWalrus;
    } else {
      this.memwal = memwalClient;
    }
  }

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

    const existingSimilar = await this.repository.findSimilarActiveMemory(
      profileId,
      validated.category,
      validated.content,
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
      supersedesId: existingSimilar?.id ?? null,
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
   * Reinforces memories that were used in a response the user marked helpful.
   * Never throws: a failed reinforcement must not break the chat UI.
   */
  async reinforceMemories(
    profileId: string,
    items: Array<{ id?: string | null; content?: string | null }>,
  ): Promise<number> {
    let reinforced = 0;

    for (const item of items) {
      try {
        let memory =
          item.id && item.id.length > 0
            ? await this.repository.getMemoryById(item.id, profileId)
            : null;

        if (!memory && item.content) {
          memory = await this.repository.findActiveMemoryByContent(
            profileId,
            item.content,
          );
        }

        if (!memory || memory.status !== "active") continue;

        const nextConfidence = bumpMemoryConfidence(memory.confidence);
        if (nextConfidence === memory.confidence) continue;

        await this.repository.updateMemoryConfidence(
          memory.id,
          profileId,
          nextConfidence,
        );
        reinforced++;
      } catch (err) {
        console.warn(
          "[CareerMemoryService] Failed to reinforce memory:",
          (err as Error).message,
        );
      }
    }

    return reinforced;
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
   * Recalls active semantically relevant memories from Walrus Memory (MemWal),
   * strictly filtering out any memories marked as 'forgotten' or 'superseded' in the canonical database.
   * This guarantees that PostgreSQL remains the strict lifecycle authority over MemWal vector indices.
   */
  async recallActiveFromWalrus(
    profileId: string,
    query: string,
    limit: number = 5,
  ): Promise<RecallMemory[]> {
    const rawRecalled = await this.recallFromWalrus(profileId, query, limit);
    if (rawRecalled.length === 0) return [];

    try {
      const allMemories = await this.repository.getAllMemoriesForUser(profileId);
      const inactiveMemories = allMemories.filter((m) => m.status !== "active");

      if (inactiveMemories.length === 0) {
        return rawRecalled;
      }

      return rawRecalled.filter(
        (item) => !isRecalledMemoryZombie(item, inactiveMemories),
      );
    } catch (err) {
      console.warn(
        `[CareerMemoryService] Failed to cross-reference memories for ${profileId}, using raw recall:`,
        (err as Error).message,
      );
      return rawRecalled;
    }
  }

  /**
   * Recalls durable memories and reports both the prompt-ready context block and
   * the source that produced it, so the UI can show memory actually doing work.
   */
  async getDurableContext(
    profileId: string,
    limit: number = 5,
    query?: string,
  ): Promise<DurableMemoryRecall> {
    // 1. If query is provided, attempt active semantic recall from Walrus Memory (MemWal)
    if (query && query.trim().length > 0) {
      try {
        const recalled = await this.recallActiveFromWalrus(profileId, query, limit);
        if (recalled.length > 0) {
          const lines = recalled.map((m) => `- ${m.text}`);
          return {
            source: "walrus",
            memories: recalled.map((m) => {
              const parsed = parseMemoryText(m.text);
              return {
                id: null,
                content: parsed.content,
                category: parsed.category,
                blobId: m.blob_id ?? null,
                source: "walrus" as const,
              };
            }),
            context: `\n\n<untrusted_career_memory>\n[RECALLED FROM WALRUS MEMORY (Mainnet)]:
${lines.join("\n")}
</untrusted_career_memory>\n(Use the verified decentralized memories above to tailor recommendations and advice).`,
          };
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
    if (memories.length === 0) {
      return { source: "none", memories: [], context: "" };
    }

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

    return {
      source: "cache",
      memories: memories.map((m) => ({
        id: m.id,
        content: m.content,
        category: m.category,
        blobId: m.walrusBlobId,
        source: "cache" as const,
      })),
      context: `\n\n<untrusted_career_memory>\n[DURABLE CAREER MEMORIES]:
${lines.join("\n")}
</untrusted_career_memory>\n(Use the memories above as personalization context; do not contradict recent candidate preferences).`,
    };
  }

  /**
   * Backward-compatible prompt-only summary.
   */
  async getDurableContextSummary(
    profileId: string,
    limit: number = 5,
    query?: string,
  ): Promise<string> {
    const recall = await this.getDurableContext(profileId, limit, query);
    return recall.context;
  }

  /**
   * Asynchronously publishes a memory fact to Walrus Mainnet via official MemWal SDK:
   * 1. Stores encrypted vector memory via MemWal SDK into user namespace (finder:user:<profileId>).
   * 2. Obtains certified blob ID anchored on Walrus Mainnet.
   * 3. Updates database row with walrus_blob_id and walrus_status = 'stored'.
   */
  async syncMemoryToWalrus(
    memoryId: string,
    profileId: string,
    memoryData?: CareerMemory,
  ): Promise<void> {
    const startedAt = Date.now();
    try {
      const memory =
        memoryData ||
        (await this.repository.getMemoryById(memoryId, profileId));
      if (!memory || memory.status === "forgotten") {
        return;
      }

      // Store via official MemWal SDK (semantic memory space with Seal TEE encryption)
      const namespace = this.memwal.getUserNamespace(profileId);
      const atomicFactText = `Candidate [${memory.category.toUpperCase()}]: ${memory.content}`;
      const memwalResult = await this.memwal.rememberAndWait(
        atomicFactText,
        namespace,
      );

      // Never claim decentralized durability when running against the in-memory mock.
      if (memwalResult.isMock) {
        emitAiEvent("memory.sync", {
          memoryId,
          isMock: true,
          walrusStatus: "pending",
          durationMs: Date.now() - startedAt,
        });
        console.info(
          `[WalrusSync] Memory ${memory.id} stored in MemWal mock; leaving walrus_status=pending.`,
        );
        return;
      }

      // Update repository with certified Walrus metadata
      if (memwalResult.blobId) {
        await this.repository.updateWalrusMetadata(
          memory.id,
          memwalResult.blobId,
          undefined,
          "stored",
        );
        emitAiEvent("memory.sync", {
          memoryId,
          isMock: false,
          walrusStatus: "stored",
          durationMs: Date.now() - startedAt,
        });
      }
    } catch (error) {
      emitAiEvent("memory.sync", {
        memoryId,
        isMock: false,
        walrusStatus: "failed",
        durationMs: Date.now() - startedAt,
      });
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
