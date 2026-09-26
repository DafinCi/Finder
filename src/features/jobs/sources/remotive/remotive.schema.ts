import { z } from "zod";

/**
 * Zod schema for a single job listing returned by Remotive Public API.
 * Tolerates optional or missing fields gracefully to prevent provider breaking changes
 * from crashing the ingestion pipeline.
 */
export const RemotiveJobSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  url: z.string().trim().url(),
  title: z.string().trim().min(1, "Job title is required"),
  company_name: z.string().trim().min(1, "Company name is required"),
  company_logo: z.string().trim().nullable().optional().default(null),
  company_logo_url: z.string().trim().nullable().optional().default(null),
  category: z.string().trim().nullable().optional().default(null),
  tags: z.array(z.string().trim()).default([]),
  job_type: z.string().trim().nullable().optional().default(null),
  publication_date: z.string().trim().nullable().optional().default(null),
  candidate_required_location: z
    .string()
    .trim()
    .nullable()
    .optional()
    .default("Remote"),
  salary: z.string().trim().nullable().optional().default(""),
  description: z.string().default(""),
});

export type RemotiveRawJob = z.infer<typeof RemotiveJobSchema>;

/**
 * Zod schema for the root Remotive API response.
 */
export const RemotiveApiResponseSchema = z.object({
  "0-legal-notice": z.string().optional(),
  "00-warning": z.string().optional(),
  "job-count": z.number().optional(),
  "total-job-count": z.number().optional(),
  jobs: z.array(RemotiveJobSchema).default([]),
});

export type RemotiveApiResponse = z.infer<typeof RemotiveApiResponseSchema>;
