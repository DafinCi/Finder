// ==============================================================================
// TYPES: Sovereign Career Memory
// Module: @/features/memory/types/memory.types
// ==============================================================================

import { z } from "zod";

export type MemoryCategory =
  | "career_goal"
  | "role_transition"
  | "work_preference"
  | "tech_focus"
  | "constraint_avoid"
  | "user_correction";

export type MemorySource =
  | "explicit_user"
  | "inferred_pattern"
  | "user_correction";

export type MemoryConfidence = "high" | "medium" | "low";

export type MemoryStatus = "active" | "forgotten" | "superseded";

export type WalrusMemoryStatus = "pending" | "stored" | "failed";

export interface CareerMemory {
  id: string;
  profileId: string;
  category: MemoryCategory;
  content: string;
  source: MemorySource;
  confidence: MemoryConfidence;
  status: MemoryStatus;
  walrusStatus: WalrusMemoryStatus;
  walrusBlobId: string | null;
  walrusObjectId: string | null;
  supersedesId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const CreateMemorySchema = z.object({
  category: z.enum([
    "career_goal",
    "role_transition",
    "work_preference",
    "tech_focus",
    "constraint_avoid",
    "user_correction",
  ]),
  content: z
    .string()
    .min(3, "Memory content must be at least 3 characters")
    .max(500, "Memory content cannot exceed 500 characters"),
  source: z
    .enum(["explicit_user", "inferred_pattern", "user_correction"])
    .default("explicit_user"),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type CreateMemoryInput = z.input<typeof CreateMemorySchema> & {
  profileId: string;
  supersedesId?: string | null;
};

export const UpdateMemoryStatusSchema = z.object({
  status: z.enum(["active", "forgotten", "superseded"]),
});

export type UpdateMemoryStatusInput = z.infer<typeof UpdateMemoryStatusSchema>;
