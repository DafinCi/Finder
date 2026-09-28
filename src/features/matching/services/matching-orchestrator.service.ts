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
}

export class MatchingOrchestratorService {
  constructor(
    private readonly profileService: CareerProfileService = careerProfileService,
    private readonly feedbackRepo: FeedbackRepository = feedbackRepository,
    private readonly client: any = supabaseAdmin,
  ) {}

  /**
   * Orchestrates complete matching pipeline for a user:
   * 1. Fetches canonical CareerProfile.
   * 2. Fetches excluded rejected jobs from feedback events.
   * 3. Stage 1: Filters constraint-compliant candidate jobs.
   * 4. Stage 2: Deterministically scores and ranks candidates.
   * 5. Returns top opportunities with breakdown and missing skills.
   */
  async matchJobsForProfile(
    profileId: string,
    options?: MatchQueryOptions,
  ): Promise<RecommendedJobOpportunity[]> {
    const profile = await this.profileService.requireProfile(profileId);
    const excludedJobIds = await this.feedbackRepo.getExcludedJobIds(profileId);

    const limit = options?.limit || MATCHING_WEIGHTS.STAGE3_AI_ANALYSIS_LIMIT; // default 5

    // Query active postings from database
    const { data: rawJobs, error } = await this.client
      .from("jobs")
      .select(
        "id, title, company_name, company_logo, description, requirements, location, work_mode, job_type, salary_range, experience_level, is_active, apply_url, posted_at",
      )
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(MATCHING_WEIGHTS.STAGE1_CANDIDATE_POOL_LIMIT);

    if (error) {
      throw error;
    }

    const candidateJobs: JobMatchCandidate[] = (rawJobs || []).map(
      (j: Record<string, unknown>) => ({
        id: j.id as string,
        title: (j.title as string) || "",
        company_name: (j.company_name as string) || null,
        company_logo: (j.company_logo as string) || null,
        description: (j.description as string) || "",
        requirements: Array.isArray(j.requirements) ? (j.requirements as string[]) : [],
        location: (j.location as string) || "",
        work_mode: (j.work_mode as "remote" | "hybrid" | "onsite" | "unknown") || "unknown",
        job_type: (j.job_type as string) || null,
        salary_range: (j.salary_range as string) || null,
        experience_level: (j.experience_level as string) || null,
        is_active: j.is_active as boolean,
        apply_url: (j.apply_url as string) || null,
        posted_at: (j.posted_at as string) || null,
      }),
    );

    // Stage 1: Filter hard constraints
    const stage1Pool = filterConstraintCompliantJobs(
      candidateJobs,
      profile,
      excludedJobIds,
      MATCHING_WEIGHTS.STAGE1_CANDIDATE_POOL_LIMIT,
    );

    // Stage 2: Deterministic scoring and ranking
    const scoredList = stage1Pool.map((job) => {
      const scoring = scoreJobOpportunity(job, profile);
      return {
        job,
        scoring,
      };
    });

    // Sort descending by final_score
    scoredList.sort((a, b) => b.scoring.score - a.scoring.score);

    // Take top results
    const topOpportunities = scoredList.slice(0, limit);

    return topOpportunities.map(({ job, scoring }) => {
      const fitRationale = this.generateDeterministicRationale(scoring.breakdown);

      return {
        job_id: job.id,
        title: job.title,
        company_name: job.company_name || "Unknown Company",
        company_logo: job.company_logo || null,
        location: job.location,
        work_mode: resolveJobWorkMode(job),
        salary_range: job.salary_range || null,
        match_score: scoring.score,
        score_breakdown: scoring.breakdown,
        qualitative: {
          fit_rationale: fitRationale,
          missing_skills: scoring.missingSkills,
        },
        apply_url: job.apply_url || null,
        posted_at: job.posted_at || new Date().toISOString(),
      };
    });
  }

  /**
   * Generates a concise, explainable rationale based strictly on deterministic components.
   */
  private generateDeterministicRationale(breakdown: RecommendedJobOpportunity["score_breakdown"]): string {
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
      parts.push(`Note: Includes ${breakdown.negative_penalty} penalty points from identified preference conflicts.`);
    }

    return parts.join(" ");
  }
}

export const matchingOrchestratorService = new MatchingOrchestratorService();
