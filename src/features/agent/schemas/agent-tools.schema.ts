// ==============================================================================
// SCHEMAS: Agent Tools Zod Validation
// Module: @/features/agent/schemas/agent-tools.schema
// ==============================================================================

import { z } from "zod";
import { FeedbackReasonSchema } from "@/features/feedback/schemas/feedback.schema";

export const GetRecommendationsInputSchema = z.object({
  targetRoles: z
    .array(z.string().min(2).max(100))
    .optional()
    .describe("Specific job roles to focus on (e.g. ['Frontend Engineer'])"),
  workMode: z
    .array(z.enum(["remote", "hybrid", "onsite"]))
    .optional()
    .describe("Desired work modes (e.g. ['remote'])"),
  minSalary: z
    .number()
    .positive()
    .optional()
    .describe("Minimum acceptable salary amount"),
  excludeTechnologies: z
    .array(z.string().min(2))
    .optional()
    .describe("Technologies to avoid (e.g. ['Angular', 'PHP'])"),
  limit: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .default(3)
    .describe("Number of top recommendations to return (default 3, max 5)"),
});

export type GetRecommendationsInput = z.infer<
  typeof GetRecommendationsInputSchema
>;

export const InspectJobDetailsInputSchema = z.object({
  jobId: z
    .string()
    .uuid("Invalid job ID format. Must be a valid UUID.")
    .describe("Unique ID of the job opportunity to inspect"),
});

export type InspectJobDetailsInput = z.infer<
  typeof InspectJobDetailsInputSchema
>;

export const SaveJobInputSchema = z.object({
  jobId: z
    .string()
    .uuid("Invalid job ID format. Must be a valid UUID.")
    .describe("Unique ID of the job opportunity to bookmark/save"),
  notes: z
    .string()
    .max(500)
    .optional()
    .describe("Optional candidate notes regarding why this job was saved"),
});

export type SaveJobInput = z.infer<typeof SaveJobInputSchema>;

export const RejectJobInputSchema = z.object({
  jobId: z
    .string()
    .uuid("Invalid job ID format. Must be a valid UUID.")
    .describe("Unique ID of the job opportunity the candidate rejected"),
  reason: FeedbackReasonSchema.describe(
    "Normalized reason category for why the user rejected the job",
  ),
  notes: z
    .string()
    .max(500)
    .optional()
    .describe("Optional candidate notes about why the job was rejected"),
});

export type RejectJobInput = z.infer<typeof RejectJobInputSchema>;

export const RememberFactInputSchema = z.object({
  category: z
    .enum([
      "career_goal",
      "role_transition",
      "work_preference",
      "tech_focus",
      "constraint_avoid",
      "user_correction",
    ])
    .describe("Category of the durable career fact to remember"),
  content: z
    .string()
    .min(3, "Memory content must be at least 3 characters")
    .max(500, "Memory content cannot exceed 500 characters")
    .describe(
      "Durable career fact to remember about the candidate (e.g., 'Transitioning to AI Engineering')",
    ),
  confidence: z
    .enum(["high", "medium", "low"])
    .optional()
    .default("high")
    .describe("Confidence level of this memory"),
});

export type RememberFactInput = z.infer<typeof RememberFactInputSchema>;

export const ProposePreferenceUpdateInputSchema = z.object({
  workMode: z
    .array(z.enum(["remote", "hybrid", "onsite"]))
    .optional()
    .describe("Updated work mode preferences"),
  targetRoles: z
    .array(z.string().min(2))
    .optional()
    .describe("Updated target roles"),
  targetLevel: z
    .enum([
      "internship",
      "entry_level",
      "junior",
      "mid_level",
      "senior",
      "lead",
    ])
    .optional()
    .describe("Updated target career level"),
  summary: z
    .string()
    .min(5)
    .max(200)
    .describe(
      "Clear, user-facing summary of the proposed preference change (e.g., 'Ubah preferensi kerja menjadi Remote & Hybrid')",
    ),
});

export type ProposePreferenceUpdateInput = z.infer<
  typeof ProposePreferenceUpdateInputSchema
>;

export const ReadCandidateCvInputSchema = z.object({
  section: z
    .enum(["full", "summary", "experience", "education", "skills", "projects"])
    .optional()
    .default("full")
    .describe("Specific section of the CV to inspect (default 'full')"),
});

export type ReadCandidateCvInput = z.infer<typeof ReadCandidateCvInputSchema>;

