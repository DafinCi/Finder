// Stage 1: Hard Constraints SQL and Candidate Pool Filter
// Module: @/features/matching/engine/stage1-constraint-filter

import {
  CareerProfile,
  WorkMode,
  SalaryPeriod,
} from "@/features/profile/types/career-profile.types";
import { MATCHING_WEIGHTS } from "../constants/matching-weights";
import {
  parseSalaryRange,
  convertSalary,
  normalizeSalaryToAnnual,
  resolveSalaryPeriod,
} from "../utils/salary-parser";
import { evaluateLocationCompatibility } from "../utils/location-matcher";

export interface JobMatchCandidate {
  id: string;
  title: string;
  company_name: string | null;
  company_logo?: string | null;
  description: string;
  requirements: string[];
  location: string;
  work_mode?: "remote" | "hybrid" | "onsite" | "unknown" | null;
  is_remote?: boolean;
  job_type?: string | null;
  salary_range?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: SalaryPeriod | null;
  experience_level?: string | null;
  is_active?: boolean;
  apply_url?: string | null;
  source_url?: string | null;
  source?: string | null;
  posted_at?: string | null;
}

export interface ConstraintCheckResult {
  compliant: boolean;
  rejectionReason?: string;
  workModeUnconfirmed?: boolean;
}

/**
 * Normalizes job work mode from explicit column, boolean flag, or location text.
 */
export function resolveJobWorkMode(
  job: Pick<JobMatchCandidate, "work_mode" | "is_remote" | "location">,
): "remote" | "hybrid" | "onsite" | "unknown" {
  if (job.work_mode && job.work_mode !== "unknown") {
    return job.work_mode;
  }

  if (job.is_remote === true) {
    return "remote";
  }

  const loc = (job.location || "").toLowerCase().trim();
  if (
    loc === "remote" ||
    loc.includes("anywhere") ||
    loc.includes("worldwide")
  ) {
    return "remote";
  }

  if (loc.includes("hybrid")) {
    return "hybrid";
  }

  if (job.work_mode === "unknown" || !job.work_mode) {
    return "unknown";
  }

  return "onsite";
}

/**
 * Evaluates whether a candidate job complies with all hard constraints in Stage 1.
 */
export function isJobConstraintCompliant(
  job: JobMatchCandidate,
  profile: CareerProfile,
  excludedJobIds: Set<string> = new Set(),
): ConstraintCheckResult {
  // 1. Inactive postings are strictly disqualified
  if (job.is_active === false) {
    return { compliant: false, rejectionReason: "job_inactive" };
  }

  // 2. Previously rejected jobs are strictly disqualified
  if (excludedJobIds.has(job.id)) {
    return { compliant: false, rejectionReason: "user_rejected" };
  }

  const resolvedWorkMode = resolveJobWorkMode(job);
  let workModeUnconfirmed = false;

  // 3. Work Mode Strictness Constraint
  if (profile.constraints.work_mode_strict) {
    const preferredWorkModes: WorkMode[] = profile.preferences.work_modes || [];

    if (resolvedWorkMode === "unknown") {
      // RATIFIED GUARDRAIL: Unclassified 'unknown' work mode is NEVER hard-excluded in Stage 1!
      // It passes to Stage 2 with a neutral weight and is flagged as unconfirmed.
      workModeUnconfirmed = true;
    } else if (
      preferredWorkModes.length > 0 &&
      !preferredWorkModes.includes(resolvedWorkMode as WorkMode)
    ) {
      return { compliant: false, rejectionReason: "work_mode_strict_mismatch" };
    }
  }

  // 4. Relocation & Geolocation Constraint
  if (profile.constraints.relocation_prohibited) {
    const preferredLocations = profile.preferences.locations || [];
    if (preferredLocations.length > 0) {
      const locationCheck = evaluateLocationCompatibility(
        job.location || "",
        resolvedWorkMode === "remote",
        preferredLocations,
      );
      if (!locationCheck.isCompatible) {
        return { compliant: false, rejectionReason: "relocation_prohibited" };
      }
    }
  }

  // 5. Salary Floor Constraint (if stated)
  if (profile.preferences.salary?.min_amount) {
    const candidateMin = profile.preferences.salary.min_amount;
    const candidateCurrency = profile.preferences.salary.currency || "USD";
    const candidatePeriod = resolveSalaryPeriod(
      profile.preferences.salary.period,
      candidateCurrency,
    );
    const candidateAnnualMin = normalizeSalaryToAnnual(
      candidateMin,
      candidatePeriod,
    );
    let jobMax: number | null = job.salary_max ?? null;
    let jobCurrency = job.salary_currency || "USD";
    let jobPeriod = job.salary_period ?? null;

    if (jobMax === null && job.salary_range) {
      const parsed = parseSalaryRange(job.salary_range);
      jobMax = parsed.max;
      if (parsed.currency) {
        jobCurrency = parsed.currency;
      }
      jobPeriod = parsed.period;
    }

    // Convert job salary to candidate currency before comparison to prevent currency mismatch errors
    if (jobMax !== null) {
      const normalizedJobMax = convertSalary(
        jobMax,
        jobCurrency,
        candidateCurrency,
      );
      const normalizedJobAnnualMax = normalizeSalaryToAnnual(
        normalizedJobMax,
        resolveSalaryPeriod(jobPeriod, jobCurrency),
      );
      if (normalizedJobAnnualMax < candidateAnnualMin) {
        return { compliant: false, rejectionReason: "below_minimum_salary" };
      }
    }
  }

  return { compliant: true, workModeUnconfirmed };
}

/**
 * In-memory filter for candidate jobs against profile constraints.
 */
export function filterConstraintCompliantJobs(
  jobs: JobMatchCandidate[],
  profile: CareerProfile,
  excludedJobIds: Set<string> = new Set(),
  limit: number = MATCHING_WEIGHTS.STAGE1_CANDIDATE_POOL_LIMIT,
): JobMatchCandidate[] {
  const compliant: JobMatchCandidate[] = [];

  for (const job of jobs) {
    const check = isJobConstraintCompliant(job, profile, excludedJobIds);
    if (check.compliant) {
      compliant.push(job);
      if (compliant.length >= limit) break;
    }
  }

  return compliant;
}
