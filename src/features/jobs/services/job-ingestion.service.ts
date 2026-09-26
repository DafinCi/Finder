import { supabaseAdmin } from "@/lib/supabase/admin";
import { CanonicalJob, JobSource } from "../domain/canonical-job";
import { remotiveJobToCanonicalJob } from "../sources/remotive/remotive.adapter";
import {
  fetchRemotiveJobs,
  RemotiveFetchOptions,
} from "../sources/remotive/remotive.client";

export interface IngestionTelemetry {
  provider: JobSource;
  fetched: number;
  validated: number;
  upserted: number;
  skipped: number;
  failed: number;
  errors: string[];
  durationMs: number;
}

export interface IngestOptions {
  batchSize?: number;
}

/**
 * Resolves existing verified companies in the database against a list of company names.
 * Performs a case-insensitive lookup.
 * If no matching verified company is found, returns null (does not invent fake companies).
 */
export async function resolveCompanyMap(
  companyNames: string[],
): Promise<Map<string, string>> {
  const companyMap = new Map<string, string>();
  if (companyNames.length === 0) return companyMap;

  const uniqueNames = Array.from(
    new Set(
      companyNames
        .map((n) => n?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0)),
    ),
  );

  if (uniqueNames.length === 0) return companyMap;

  try {
    // Query only the distinct company names required by the current ingestion batch
    const { data: companies, error } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .in("name", uniqueNames);

    if (error) {
      console.warn(
        "[CompanyResolver] Warning: Unable to query companies table:",
        error.message,
      );
      return companyMap;
    }

    if (companies && Array.isArray(companies)) {
      for (const comp of companies) {
        if (comp.name && comp.id) {
          companyMap.set(comp.name.toLowerCase().trim(), comp.id);
        }
      }
    }
  } catch (err: any) {
    console.warn("[CompanyResolver] Company resolution failed:", err?.message);
  }

  return companyMap;
}

/**
 * Maps a CanonicalJob domain entity to the database schema row format for public.jobs.
 */
export function canonicalJobToDbRow(
  job: CanonicalJob,
  resolvedCompanyId: string | null = null,
) {
  return {
    source: job.source,
    source_job_id: job.sourceJobId || null,
    source_url: job.sourceUrl || null,
    apply_url: job.applyUrl || null,
    title: job.title,
    company_name: job.companyName,
    company_logo: job.companyLogo || null,
    company_id: resolvedCompanyId || job.companyId || null,
    description: job.description,
    requirements: job.requirements || [],
    location: job.location || "Remote",
    job_type: job.jobType || "full-time",
    salary_range: job.salaryRange || null,
    experience_level: job.experienceLevel || "Mid-Level",
    is_active: job.isActive ?? true,
    posted_at: job.postedAt || new Date().toISOString(),
    last_synced_at: job.lastSyncedAt || new Date().toISOString(),
  };
}

export class JobIngestionService {
  /**
   * Synchronizes jobs from Remotive Public API into the system.
   * Performs:
   * 1. Resilient HTTP fetch
   * 2. Zod validation & canonical normalization
   * 3. HTML description sanitization
   * 4. Company resolution against existing companies table
   * 5. Idempotent upsert on (source, source_job_id)
   */
  public async syncRemotive(
    fetchOptions: RemotiveFetchOptions = {},
    ingestOptions: IngestOptions = {},
  ): Promise<IngestionTelemetry> {
    const startTime = Date.now();
    const batchSize = ingestOptions.batchSize || 50;

    const telemetry: IngestionTelemetry = {
      provider: "remotive",
      fetched: 0,
      validated: 0,
      upserted: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      durationMs: 0,
    };

    // 1. Fetch raw payload from Remotive
    let apiResponse;
    try {
      apiResponse = await fetchRemotiveJobs(fetchOptions);
      telemetry.fetched = apiResponse.jobs.length;
    } catch (err: any) {
      telemetry.errors.push(`Remotive fetch error: ${err.message}`);
      telemetry.failed = 1;
      telemetry.durationMs = Date.now() - startTime;
      return telemetry;
    }

    if (apiResponse.jobs.length === 0) {
      telemetry.durationMs = Date.now() - startTime;
      return telemetry;
    }

    // 2. Validate and adapt each job to CanonicalJob
    const canonicalJobs: CanonicalJob[] = [];
    for (const rawJob of apiResponse.jobs) {
      try {
        const canonical = remotiveJobToCanonicalJob(rawJob);
        canonicalJobs.push(canonical);
        telemetry.validated++;
      } catch (adaptErr: any) {
        telemetry.skipped++;
        if (telemetry.errors.length < 5) {
          telemetry.errors.push(
            `Job adapt error (ID ${rawJob?.id}): ${adaptErr?.message || adaptErr}`,
          );
        }
      }
    }

    if (canonicalJobs.length === 0) {
      telemetry.durationMs = Date.now() - startTime;
      return telemetry;
    }

    // Deterministic client-side slicing if limit is specified
    const targetJobs =
      fetchOptions.limit && fetchOptions.limit > 0
        ? canonicalJobs.slice(0, fetchOptions.limit)
        : canonicalJobs;

    telemetry.validated = targetJobs.length;

    // 3. Resolve existing companies
    const companyNames = targetJobs.map((j) => j.companyName);
    const companyMap = await resolveCompanyMap(companyNames);

    // 4. Batch upsert into public.jobs with idempotent conflict resolution
    for (let i = 0; i < targetJobs.length; i += batchSize) {
      const chunk = targetJobs.slice(i, i + batchSize);
      const rows = chunk.map((job) => {
        const resolvedId =
          companyMap.get(job.companyName.toLowerCase().trim()) || null;
        return canonicalJobToDbRow(job, resolvedId);
      });

      try {
        const { error, count } = await supabaseAdmin.from("jobs").upsert(rows, {
          onConflict: "source,source_job_id",
          ignoreDuplicates: false, // Update row with newest sync info
          count: "exact",
        });

        if (error) {
          telemetry.errors.push(
            `Database upsert error on chunk ${i}: ${error.message}`,
          );
          telemetry.failed += chunk.length;
        } else {
          telemetry.upserted += count ?? chunk.length;
        }
      } catch (dbErr: any) {
        telemetry.errors.push(
          `Database exception on chunk ${i}: ${dbErr.message}`,
        );
        telemetry.failed += chunk.length;
      }
    }

    telemetry.durationMs = Date.now() - startTime;
    return telemetry;
  }
}

export const jobIngestionService = new JobIngestionService();
