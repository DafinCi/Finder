// ==============================================================================
// REPOSITORY: Sovereign Career Memory Repository
// Module: @/features/memory/repositories/career-memory.repository
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  CareerMemory,
  CreateMemoryInput,
  MemoryCategory,
  MemoryStatus,
  WalrusMemoryStatus,
} from "../types/memory.types";

export interface CareerMemoryDbRow {
  id: string;
  profile_id: string;
  category: string;
  content: string;
  source: string;
  confidence: string;
  status: string;
  walrus_status: string;
  walrus_blob_id: string | null;
  walrus_object_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function mapDbRowToCareerMemory(row: CareerMemoryDbRow): CareerMemory {
  return {
    id: row.id,
    profileId: row.profile_id,
    category: row.category as CareerMemory["category"],
    content: row.content,
    source: row.source as CareerMemory["source"],
    confidence: row.confidence as CareerMemory["confidence"],
    status: row.status as MemoryStatus,
    walrusStatus: row.walrus_status as WalrusMemoryStatus,
    walrusBlobId: row.walrus_blob_id,
    walrusObjectId: row.walrus_object_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CareerMemoryRepository {
  constructor(private readonly client: any = supabaseAdmin) {}

  /**
   * Retrieves active, non-forgotten career memories for a specific user.
   */
  async getActiveMemories(
    profileId: string,
    limit: number = 10,
  ): Promise<CareerMemory[]> {
    const { data, error } = await this.client
      .from("career_memories")
      .select("*")
      .eq("profile_id", profileId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(mapDbRowToCareerMemory);
  }

  /**
   * Retrieves all memories for management dashboard (active + forgotten + superseded).
   */
  async getAllMemoriesForUser(profileId: string): Promise<CareerMemory[]> {
    const { data, error } = await this.client
      .from("career_memories")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapDbRowToCareerMemory);
  }

  /**
   * Retrieves a single memory by ID and profile ID.
   */
  async getMemoryById(
    id: string,
    profileId: string,
  ): Promise<CareerMemory | null> {
    const { data, error } = await this.client
      .from("career_memories")
      .select("*")
      .eq("id", id)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapDbRowToCareerMemory(data) : null;
  }

  /**
   * Inserts a new career memory into database.
   */
  async createMemory(payload: CreateMemoryInput): Promise<CareerMemory> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("career_memories")
      .insert({
        profile_id: payload.profileId,
        category: payload.category,
        content: payload.content.trim(),
        source: payload.source || "explicit_user",
        confidence: payload.confidence || "high",
        status: "active",
        walrus_status: "pending",
        metadata: payload.metadata || {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapDbRowToCareerMemory(data);
  }

  /**
   * Updates memory status (e.g. 'forgotten' or 'superseded').
   */
  async updateMemoryStatus(
    id: string,
    profileId: string,
    status: MemoryStatus,
  ): Promise<CareerMemory> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("career_memories")
      .update({
        status,
        updated_at: now,
      })
      .eq("id", id)
      .eq("profile_id", profileId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return mapDbRowToCareerMemory(data);
  }

  /**
   * Updates Walrus storage metadata conditionally.
   * Defensively guards against re-activating a memory that the user marked as 'forgotten'
   * while the 30-second Walrus upload was processing in background.
   */
  async updateWalrusMetadata(
    id: string,
    blobId: string,
    objectId?: string,
    status: WalrusMemoryStatus = "stored",
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("career_memories")
      .update({
        walrus_blob_id: blobId,
        walrus_object_id: objectId || null,
        walrus_status: status,
        updated_at: now,
      })
      .eq("id", id)
      .neq("status", "forgotten")
      .select("id");

    if (error) {
      throw error;
    }

    return Array.isArray(data) && data.length > 0;
  }

  /**
   * Finds an existing active memory with matching category to detect duplication / superseding candidates.
   */
  async findSimilarActiveMemory(
    profileId: string,
    category: MemoryCategory,
    keywords: string[],
  ): Promise<CareerMemory | null> {
    const activeMemories = await this.getActiveMemories(profileId, 20);
    const categoryMatches = activeMemories.filter(
      (m) => m.category === category,
    );

    if (categoryMatches.length === 0) return null;

    // Check keyword overlap
    for (const mem of categoryMatches) {
      const lower = mem.content.toLowerCase();
      const hasOverlap = keywords.some(
        (kw) => kw.length > 2 && lower.includes(kw.toLowerCase()),
      );
      if (hasOverlap) {
        return mem;
      }
    }

    return null;
  }
}

export const careerMemoryRepository = new CareerMemoryRepository();
