import { z } from "zod";

export const JobSourceSchema = z.enum([
  "manual",
  "remotive",
  "remoteok",
  "jobicy",
  "arbeitnow",
]);

/**
 * Permissive URL validator that tolerates absolute HTTPS/HTTP links
 * or empty strings/nulls for provider resilience.
 */
const SafeUrlSchema = z
  .string()
  .trim()
  .url("URL format is invalid")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const CanonicalJobSchema = z.object({
  id: z.string().uuid().optional(),
  source: JobSourceSchema.default("manual"),
  sourceJobId: z.string().trim().min(1).nullable().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Job title is required")
    .max(300, "Job title is too long"),
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name is too long"),
  companyLogo: SafeUrlSchema,
  companyId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Job description is required"),
  requirements: z.array(z.string().trim()).default([]),
  location: z.string().trim().default("Remote"),
  isRemote: z.boolean().default(true),
  jobType: z.string().trim().nullable().optional().default("full-time"),
  experienceLevel: z.string().trim().nullable().optional().default("Mid-Level"),
  salaryMin: z.number().nonnegative().nullable().optional(),
  salaryMax: z.number().nonnegative().nullable().optional(),
  salaryCurrency: z.string().trim().max(10).nullable().optional(),
  salaryRange: z.string().trim().nullable().optional(),
  postedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  applyUrl: SafeUrlSchema,
  sourceUrl: SafeUrlSchema,
  isActive: z.boolean().default(true),
  lastSyncedAt: z.string().nullable().optional(),
});

export type CanonicalJobInput = z.input<typeof CanonicalJobSchema>;
export type CanonicalJobOutput = z.infer<typeof CanonicalJobSchema>;

/**
 * Validates and normalizes raw domain inputs into a validated CanonicalJob.
 * Throws structured Zod validation errors if essential invariants are violated.
 */
export function validateCanonicalJob(input: unknown): CanonicalJobOutput {
  return CanonicalJobSchema.parse(input);
}
