/**
 * Canonical Job Domain Model
 * Represents the clean, normalized, provider-agnostic domain entity for jobs.
 * This entity sits at the center of the architecture, shielding business logic,
 * AI matching, and database persistence from external provider variations.
 */

export type JobSource =
  | "manual"
  | "remotive"
  | "remoteok"
  | "jobicy"
  | "arbeitnow";

export type CanonicalEmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "freelance"
  | "other";

export interface CanonicalJob {
  /** Internal UUID if already persisted */
  id?: string;

  /** Sourcing provider */
  source: JobSource;

  /** Unique identifier assigned by the provider (null for manual/internal postings) */
  sourceJobId?: string | null;

  /** Job title */
  title: string;

  /** Normalized employer name */
  companyName: string;

  /** Company logo URL if available */
  companyLogo?: string | null;

  /** Internal company ID reference if resolved in companies table */
  companyId?: string | null;

  /** Sanitized, readable job description (untrusted content stripped of scripts/XSS) */
  description: string;

  /** Extracted or declared skill requirements */
  requirements: string[];

  /** Primary geographic or remote availability descriptor */
  location: string;

  /** Remote eligibility flag */
  isRemote: boolean;

  /** Standardized employment arrangement */
  jobType?: CanonicalEmploymentType | string | null;

  /** Target seniority level (e.g. Junior, Mid-Level, Senior, Lead) */
  experienceLevel?: string | null;

  /** Structured compensation data where available */
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;

  /** Human-readable raw salary text string */
  salaryRange?: string | null;

  /** Original posting timestamp from provider (ISO 8601 string) */
  postedAt?: string | null;

  /** Expiration timestamp if specified by provider (ISO 8601 string) */
  expiresAt?: string | null;

  /** Direct application target URL (where candidate applies) */
  applyUrl?: string | null;

  /** Canonical listing URL on original source website (for legal attribution & link-back) */
  sourceUrl?: string | null;

  /** Availability flag in current portal */
  isActive: boolean;

  /** Last timestamp our system successfully synchronized/observed this record */
  lastSyncedAt?: string | null;
}

/**
 * Checks whether a job originated from an external provider.
 */
export function isExternalJob(job: Pick<CanonicalJob, "source">): boolean {
  return job.source !== "manual";
}

/**
 * Derives a deterministic deduplication key for external provider records.
 * Returns null if the job lacks external provider identity.
 */
export function getProviderIdentityKey(
  job: Pick<CanonicalJob, "source" | "sourceJobId">,
): string | null {
  if (!job.sourceJobId || job.source === "manual") return null;
  return `${job.source}:${job.sourceJobId}`;
}
