// ==============================================================================
// SERVICE: Matching Orchestrator Service (Stage 1 + Stage 2 Multi-Stage Pipeline)
// Module: @/features/matching/services/matching-orchestrator.service
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  CareerProfileService,
  careerProfileService,
} from "@/features/profile/services/career-profile.service";
import {
  FeedbackRepository,
  feedbackRepository,
} from "@/features/feedback/repositories/feedback.repository";
import {
  CareerMemoryService,
  careerMemoryService,
} from "@/features/memory/services/career-memory.service";
import { CareerMemory } from "@/features/memory/types/memory.types";
import {
  JobMatchCandidate,
  filterConstraintCompliantJobs,
  resolveJobWorkMode,
} from "../engine/stage1-constraint-filter";
import { scoreJobOpportunity } from "../engine/stage2-scoring-engine";
import { RecommendedJobOpportunity } from "../types/matching.types";
import { MATCHING_WEIGHTS } from "../constants/matching-weights";

export interface MatchQueryOptions {
  limit?: number;
  offset?: number;
  overrideFilters?: {
    targetRoles?: string[];
    workMode?: ("remote" | "hybrid" | "onsite")[];
    minSalary?: number;
    excludeTechnologies?: string[];
  };
}

/**
 * Extracts negative keywords and blacklist terms from constraint_avoid memories.
 */
export function extractExclusionKeywordsFromMemories(
  memories: CareerMemory[],
): string[] {
  const keywords: Set<string> = new Set();
  const avoidMemories = memories.filter(
    (m) => m.category === "constraint_avoid" && m.status === "active",
  );

  for (const m of avoidMemories) {
    const text = m.content.toLowerCase();

    // Check common high-priority exclusion patterns
    const commonExclusionTerms = [
      "gambling",
      "casino",
      "betting",
      "poker",
      "php",
      "wordpress",
      "drupal",
      "magento",
      "jquery",
      "crypto casino",
      "hft",
      "legacy",
    ];

    for (const term of commonExclusionTerms) {
      if (text.includes(term)) {
        keywords.add(term);
      }
    }

    // Capture explicit "avoid X", "reject X", "no X" patterns
    const regex = /(?:avoid|reject|no|exclude|without)\s+([a-zA-Z0-9+#]+)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const captured = match[1]?.trim().toLowerCase();
      if (
        captured &&
        captured.length > 2 &&
        !["the", "and", "for", "with", "any", "roles"].includes(captured)
      ) {
        keywords.add(captured);
      }
    }
  }

  return Array.from(keywords);
}

/**
 * Extracts minimum salary requirement from memory text if present.
 */
export function extractMinSalaryFromMemories(
  memories: CareerMemory[],
): number | null {
  const relevant = memories.filter(
    (m) =>
      (m.category === "constraint_avoid" || m.category === "work_preference") &&
      m.status === "active",
  );

  for (const m of relevant) {
    const text = m.content.toLowerCase();
    // Look for "$180k", "180k", "180,000", "min 180k"
    const kMatch = /\$?(\d{2,3})\s*k/i.exec(text);
    if (kMatch && kMatch[1]) {
      return parseInt(kMatch[1], 10) * 1000;
    }
    const fullMatch = /\$?(\d{2,3}),?(\d{3})/i.exec(text);
    if (fullMatch && fullMatch[1] && fullMatch[2]) {
      return parseInt(fullMatch[1] + fullMatch[2], 10);
    }
  }

  return null;
}

/**
 * Checks if candidate memories enforce remote-only constraint.
 */
export function isRemoteOnlyFromMemories(memories: CareerMemory[]): boolean {
  const relevant = memories.filter(
    (m) =>
      (m.category === "work_preference" || m.category === "constraint_avoid") &&
      m.status === "active",
  );

  return relevant.some((m) => {
    const text = m.content.toLowerCase();
    return (
      text.includes("remote only") ||
      text.includes("100% remote") ||
      text.includes("strictly remote") ||
      text.includes("no onsite") ||
      text.includes("refuses onsite")
    );
  });
}

export class MatchingOrchestratorService {
  constructor(
    private readonly profileService: CareerProfileService = careerProfileService,
    private readonly feedbackRepo: FeedbackRepository = feedbackRepository,
    private readonly client: any = supabaseAdmin,
    private readonly memoryService: CareerMemoryService = careerMemoryService,
  ) {}

  /**
   * Orchestrates complete matching pipeline for a user:
   * 1. Fetches canonical CareerProfile.
   * 2. Fetches excluded rejected jobs from feedback events.
   * 3. Fetches active Walrus Career Memories (constraints, exclusions, salary).
   * 4. Stage 1: Filters constraint-compliant candidate jobs.
   * 5. Stage 2: Deterministically scores and ranks candidates.
   * 6. Returns top opportunities with breakdown and missing skills.
   */
  async matchJobsForProfile(
    profileId: string,
    options?: MatchQueryOptions,
  ): Promise<RecommendedJobOpportunity[]> {
    const profile = await this.profileService.requireProfile(profileId);
    const excludedJobIds = await this.feedbackRepo.getExcludedJobIds(profileId);

    // Fetch active decentralized memories for profile
    let activeMemories: CareerMemory[] = [];
    try {
      activeMemories = await this.memoryService.getActiveMemories(profileId, 20);
    } catch (err) {
      console.warn(
        `[MatchingOrchestrator] Unable to load active memories for ${profileId}:`,
        (err as Error).message,
      );
    }

    const limit = options?.limit || MATCHING_WEIGHTS.STAGE3_AI_ANALYSIS_LIMIT; // default 5

    // Query active postings from database
    const { data: rawJobs, error } = await this.client
      .from("jobs")
      .select(
        "id, title, company_name, company_logo, description, requirements, location, work_mode, job_type, salary_range, experience_level, is_active, apply_url, source_url, source, posted_at",
      )
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(MATCHING_WEIGHTS.STAGE1_CANDIDATE_POOL_LIMIT);

    if (error) {
      throw error;
    }

    let candidateJobs: JobMatchCandidate[] = (rawJobs || []).map(
      (j: Record<string, unknown>) => ({
        id: j.id as string,
        title: (j.title as string) || "",
        company_name: (j.company_name as string) || null,
        company_logo: (j.company_logo as string) || null,
        description: (j.description as string) || "",
        requirements: Array.isArray(j.requirements)
          ? (j.requirements as string[])
          : [],
        location: (j.location as string) || "",
        work_mode:
          (j.work_mode as "remote" | "hybrid" | "onsite" | "unknown") ||
          "unknown",
        job_type: (j.job_type as string) || null,
        salary_range: (j.salary_range as string) || null,
        salary_currency: (j.salary_currency as string) || null,
        experience_level: (j.experience_level as string) || null,
        is_active: j.is_active as boolean,
        apply_url: (j.apply_url as string) || null,
        source_url: (j.source_url as string) || null,
        source: (j.source as string) || null,
        posted_at: (j.posted_at as string) || null,
      }),
    );

    let effectiveProfile = profile;

    // Apply Walrus Memory constraints if not explicitly overridden by query
    const memoryWorkModes = isRemoteOnlyFromMemories(activeMemories)
      ? (["remote"] as ("remote" | "hybrid" | "onsite")[])
      : undefined;

    const memoryMinSalary = extractMinSalaryFromMemories(activeMemories);

    if (memoryWorkModes || memoryMinSalary) {
      effectiveProfile = {
        ...effectiveProfile,
        preferences: {
          ...effectiveProfile.preferences,
          work_modes: memoryWorkModes || effectiveProfile.preferences.work_modes,
          salary:
            memoryMinSalary &&
            (!effectiveProfile.preferences.salary?.min_amount ||
              memoryMinSalary > effectiveProfile.preferences.salary.min_amount)
              ? {
                  min_amount: memoryMinSalary,
                  currency: effectiveProfile.preferences.salary?.currency || "USD",
                }
              : effectiveProfile.preferences.salary,
        },
        constraints: {
          ...effectiveProfile.constraints,
          work_mode_strict: memoryWorkModes
            ? true
            : effectiveProfile.constraints.work_mode_strict,
        },
      };
    }

    // Apply explicit ad-hoc parameter overrides if provided
    if (options?.overrideFilters) {
      const overrides = options.overrideFilters;
      effectiveProfile = {
        ...effectiveProfile,
        preferences: {
          ...effectiveProfile.preferences,
          work_modes:
            overrides.workMode && overrides.workMode.length > 0
              ? overrides.workMode
              : effectiveProfile.preferences.work_modes,
          salary: overrides.minSalary
            ? {
                min_amount: overrides.minSalary,
                currency: effectiveProfile.preferences.salary?.currency || "USD",
              }
            : effectiveProfile.preferences.salary,
        },
        careerIntent: {
          ...effectiveProfile.careerIntent,
          target_roles:
            overrides.targetRoles && overrides.targetRoles.length > 0
              ? overrides.targetRoles.map((r, idx) => ({
                  role: r,
                  priority: idx === 0 ? "primary" : "secondary",
                }))
              : effectiveProfile.careerIntent.target_roles,
        },
      };
    }

    // Combine explicit technology exclusions with Walrus memory blacklist exclusions
    const memoryExclusions = extractExclusionKeywordsFromMemories(activeMemories);
    const combinedExclusions = new Set<string>([
      ...(options?.overrideFilters?.excludeTechnologies || []).map((t) =>
        t.toLowerCase().trim(),
      ),
      ...memoryExclusions,
    ]);

    if (combinedExclusions.size > 0) {
      const excludeList = Array.from(combinedExclusions);
      candidateJobs = candidateJobs.filter((job) => {
        const text = (
          job.title +
          " " +
          job.description +
          " " +
          job.requirements.join(" ")
        ).toLowerCase();
        return !excludeList.some((tech) => text.includes(tech));
      });
    }

    // Stage 1: Filter hard constraints
    const stage1Pool = filterConstraintCompliantJobs(
      candidateJobs,
      effectiveProfile,
      excludedJobIds,
      MATCHING_WEIGHTS.STAGE1_CANDIDATE_POOL_LIMIT,
    );

    // Stage 2: Deterministic scoring and ranking
    const scoredList = stage1Pool.map((job) => {
      const scoring = scoreJobOpportunity(job, effectiveProfile);
      return {
        job,
        scoring,
      };
    });

    // Sort descending by final_score
    scoredList.sort((a, b) => b.scoring.score - a.scoring.score);

    // Take top results
    const topOpportunities = scoredList.slice(0, limit);

    const hasActiveMemoryConstraints =
      activeMemories.length > 0 &&
      (Boolean(memoryWorkModes) ||
        Boolean(memoryMinSalary) ||
        memoryExclusions.length > 0);

    return topOpportunities.map(({ job, scoring }) => {
      const fitRationale = this.generateDeterministicRationale(
        scoring.breakdown,
        hasActiveMemoryConstraints,
      );

      return {
        job_id: job.id,
        title: job.title,
        company_name: job.company_name || "Unknown Company",
        company_logo: job.company_logo || null,
        location: job.location,
        work_mode: resolveJobWorkMode(job),
        salary_range: job.salary_range || null,
        description: job.description || "",
        requirements: job.requirements || [],
        experience_level: job.experience_level || null,
        match_score: scoring.score,
        score_breakdown: scoring.breakdown,
        qualitative: {
          fit_rationale: fitRationale,
          missing_skills: scoring.missingSkills,
        },
        apply_url: job.apply_url || null,
        source_url: job.source_url || null,
        source: job.source || undefined,
        posted_at: job.posted_at || new Date().toISOString(),
      };
    });
  }

  /**
   * Generates a concise, explainable rationale based strictly on deterministic components.
   */
  private generateDeterministicRationale(
    breakdown: RecommendedJobOpportunity["score_breakdown"],
    memoryApplied: boolean = false,
  ): string {
    const parts: string[] = [];

    if (breakdown.role_score >= 80) {
      parts.push("Strong alignment with your primary career target role.");
    } else if (breakdown.role_score >= 50) {
      parts.push("Relevant role overlap with your indicated career direction.");
    }

    if (breakdown.capability_score >= 75) {
      parts.push("Matches the majority of required technical competencies.");
    } else if (breakdown.capability_score >= 50) {
      parts.push("Good foundation in core required skills.");
    } else {
      parts.push("Opportunity offers growth into several new skill areas.");
    }

    if (breakdown.negative_penalty > 0) {
      parts.push(
        `Note: Includes ${breakdown.negative_penalty} penalty points from identified preference conflicts.`,
      );
    }

    if (memoryApplied) {
      parts.push("Tailored with persistent Walrus career memory constraints.");
    }

    return parts.join(" ");
  }
}

export const matchingOrchestratorService = new MatchingOrchestratorService();
