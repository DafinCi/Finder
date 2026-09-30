// Stage 2: Deterministic Scoring and Ranking Engine
// Module: @/features/matching/engine/stage2-scoring-engine

import {
  CareerProfile,
  CareerIntent,
  CapabilityEvidence,
  Preferences,
  TargetLevel,
} from "@/features/profile/types/career-profile.types";
import { MatchScoreBreakdown } from "../types/matching.types";
import { MATCHING_WEIGHTS } from "../constants/matching-weights";
import { matchesSkill } from "../utils/skill-normalizer";
import { parseSalaryRange, convertSalary } from "../utils/salary-parser";
import { evaluateLocationCompatibility } from "../utils/location-matcher";
import {
  JobMatchCandidate,
  resolveJobWorkMode,
} from "./stage1-constraint-filter";

export interface DeterministicScoreResult {
  score: number; // Final deterministic compatibility score [0, 100]
  breakdown: MatchScoreBreakdown;
  missingSkills: string[];
}

const SENIORITY_LADDER: TargetLevel[] = [
  "internship",
  "entry_level",
  "junior",
  "mid_level",
  "senior",
  "lead",
];

/**
 * Maps arbitrary experience level text to canonical target level index.
 */
function resolveSeniorityIndex(levelText?: string | null): number | null {
  if (!levelText) return null;
  const l = levelText.toLowerCase().trim();

  if (l.includes("intern")) return 0;
  if (l.includes("entry") || l.includes("graduate") || l.includes("fresh"))
    return 1;
  if (l.includes("junior") || l.includes("jr")) return 2;
  if (l.includes("mid") || l.includes("intermediate")) return 3;
  if (l.includes("senior") || l.includes("sr")) return 4;
  if (
    l.includes("lead") ||
    l.includes("principal") ||
    l.includes("staff") ||
    l.includes("manager")
  )
    return 5;

  return null;
}

/**
 * Computes Role Match Score S_role in [0, 100].
 */
export function computeRoleScore(
  jobTitle: string,
  jobExperienceLevel: string | null | undefined,
  careerIntent: CareerIntent,
): number {
  const cleanTitle = (jobTitle || "").toLowerCase().trim();
  const targetRoles = careerIntent.target_roles || [];

  if (targetRoles.length === 0) {
    return 50; // Neutral baseline if no target role declared
  }

  let baseScore = 100 * MATCHING_WEIGHTS.MULTIPLIER_NON_MATCH; // 10

  for (const tr of targetRoles) {
    const cleanRole = tr.role.toLowerCase().trim();
    if (!cleanRole) continue;

    // Exact title match or substring inclusion
    if (
      cleanTitle === cleanRole ||
      cleanTitle.includes(cleanRole) ||
      cleanRole.includes(cleanTitle)
    ) {
      if (tr.priority === "primary") {
        baseScore = Math.max(
          baseScore,
          100 * MATCHING_WEIGHTS.MULTIPLIER_PRIMARY_ROLE,
        );
      } else {
        baseScore = Math.max(
          baseScore,
          100 * MATCHING_WEIGHTS.MULTIPLIER_SECONDARY_ROLE,
        );
      }
    } else {
      // Token overlap check
      const roleTokens = cleanRole
        .split(/[\s\-_/]+/)
        .filter((t) => t.length > 2);
      const titleTokens = cleanTitle
        .split(/[\s\-_/]+/)
        .filter((t) => t.length > 2);
      const matches = roleTokens.filter((t) => titleTokens.includes(t));

      if (matches.length > 0) {
        baseScore = Math.max(
          baseScore,
          100 * MATCHING_WEIGHTS.MULTIPLIER_KEYWORD_MATCH,
        );
      }
    }
  }

  // Seniority multiplier
  let seniorityMultiplier = 1.0;
  if (careerIntent.target_level && jobExperienceLevel) {
    const targetIdx = SENIORITY_LADDER.indexOf(careerIntent.target_level);
    const jobIdx = resolveSeniorityIndex(jobExperienceLevel);

    if (targetIdx !== -1 && jobIdx !== null) {
      const distance = Math.abs(targetIdx - jobIdx);
      if (distance === 0) seniorityMultiplier = 1.0;
      else if (distance === 1) seniorityMultiplier = 0.85;
      else seniorityMultiplier = 0.65;
    }
  }

  return Math.round(
    Math.min(100, Math.max(0, baseScore * seniorityMultiplier)),
  );
}

/**
 * Computes Capability Match Score S_cap in [0, 100] and extracts missing skills.
 */
export function computeCapabilityScore(
  requirements: string[],
  capabilities: CapabilityEvidence,
): { score: number; missingSkills: string[] } {
  if (!requirements || requirements.length === 0) {
    return { score: 50, missingSkills: [] };
  }

  const activeSkills = (capabilities.skills || []).filter(
    (s) => s.confirmation_state !== "draft" || s.provenance.confidence >= 0.7,
  );

  let earnedPoints = 0;
  const missingSkills: string[] = [];

  for (const req of requirements) {
    const matchedSkill = activeSkills.find((cand) =>
      matchesSkill(cand.skill, req),
    );

    if (matchedSkill) {
      if (matchedSkill.category === "core") {
        earnedPoints += MATCHING_WEIGHTS.POINT_CORE;
      } else if (matchedSkill.category === "supporting") {
        earnedPoints += MATCHING_WEIGHTS.POINT_SUPPORTING;
      } else {
        earnedPoints += MATCHING_WEIGHTS.POINT_TOOL;
      }
    } else {
      missingSkills.push(req);
    }
  }

  const maxPoints = requirements.length * MATCHING_WEIGHTS.POINT_CORE;
  const rawScore = (earnedPoints / maxPoints) * 100;

  return {
    score: Math.round(Math.min(100, Math.max(0, rawScore))),
    missingSkills,
  };
}

/**
 * Computes Preference Match Score S_pref in [0, 100] with Dynamic Sub-Weight Redistribution.
 * INVARIANT: If a dimension is unstated, its weight is redistributed among stated dimensions.
 * Unstated dimensions NEVER become implicit penalties.
 */
export function computePreferenceScore(
  job: JobMatchCandidate,
  preferences: Preferences,
): number {
  interface Dimension {
    stated: boolean;
    rawWeight: number;
    score: number;
  }

  // 1. Location dimension
  const hasLocations =
    preferences.locations && preferences.locations.length > 0;
  let locScore = 70; // default neutral
  if (hasLocations) {
    const jobWorkMode = resolveJobWorkMode(job);
    if (jobWorkMode === "unknown") {
      locScore = 70; // neutral for unclassified work mode
    } else {
      const compatibility = evaluateLocationCompatibility(
        job.location || "",
        jobWorkMode === "remote",
        preferences.locations,
      );
      locScore = compatibility.score;
    }
  }

  // 2. Priorities dimension
  const hasPriorities =
    preferences.priorities && preferences.priorities.length > 0;
  let prioScore = 70; // default neutral
  if (hasPriorities) {
    const desc = (job.description || "").toLowerCase();
    const matchedCount = preferences.priorities.filter((p) =>
      desc.includes(p.toLowerCase().trim()),
    ).length;

    prioScore = Math.round(
      30 + 70 * (matchedCount / preferences.priorities.length),
    );
  }

  // 3. Salary dimension
  const hasSalary = Boolean(preferences.salary?.min_amount);
  let salScore = 70; // neutral default (never penalize unstated salary)
  if (hasSalary) {
    const candidateMin = preferences.salary!.min_amount!;
    const candidateCurrency = preferences.salary!.currency || "USD";
    let jobMax: number | null = job.salary_max ?? null;
    let jobCurrency = job.salary_currency || "USD";

    if (jobMax === null && job.salary_range) {
      const parsed = parseSalaryRange(job.salary_range);
      jobMax = parsed.max;
      if (parsed.currency) {
        jobCurrency = parsed.currency;
      }
    }

    if (jobMax !== null) {
      const normalizedJobMax = convertSalary(
        jobMax,
        jobCurrency,
        candidateCurrency,
      );
      salScore = normalizedJobMax >= candidateMin ? 100 : 0;
    } else {
      salScore = 70; // Neutral if job did not state salary
    }
  }

  const dimensions: Dimension[] = [
    {
      stated: hasLocations,
      rawWeight: MATCHING_WEIGHTS.W_PREF_LOCATION,
      score: locScore,
    },
    {
      stated: hasPriorities,
      rawWeight: MATCHING_WEIGHTS.W_PREF_PRIORITY,
      score: prioScore,
    },
    {
      stated: hasSalary,
      rawWeight: MATCHING_WEIGHTS.W_PREF_SALARY,
      score: salScore,
    },
  ];

  const statedDimensions = dimensions.filter((d) => d.stated);

  // If no preferences stated at all, candidate gets neutral full score
  if (statedDimensions.length === 0) {
    return 100;
  }

  const weightSum = statedDimensions.reduce((sum, d) => sum + d.rawWeight, 0);
  const weightedTotal = statedDimensions.reduce(
    (sum, d) => sum + (d.rawWeight / weightSum) * d.score,
    0,
  );

  return Math.round(Math.min(100, Math.max(0, weightedTotal)));
}

/**
 * Computes Negative Preference Penalty P_neg in [0, 20].
 */
export function computeNegativePreferencePenalty(
  job: JobMatchCandidate,
  preferences: Preferences,
): number {
  const negativePreferences = preferences.negative_preferences || [];
  if (negativePreferences.length === 0) {
    return 0;
  }

  const cleanTitle = (job.title || "").toLowerCase();
  const cleanDesc = (job.description || "").toLowerCase();
  const cleanReqs = (job.requirements || []).map((r) => r.toLowerCase());

  let totalPenalty = 0;

  for (const neg of negativePreferences) {
    const token = neg.token.toLowerCase().trim();
    if (!token) continue;

    const penaltyWeight = neg.penalty_weight ?? 1.0;
    let severity = 0;

    if (cleanTitle.includes(token)) {
      severity = MATCHING_WEIGHTS.SEVERITY_PRIMARY_REQUIRED; // 1.0
    } else if (cleanReqs.some((r) => r.includes(token))) {
      severity = MATCHING_WEIGHTS.SEVERITY_SECONDARY_REQUIRED; // 0.5
    } else if (cleanDesc.includes(token)) {
      severity = MATCHING_WEIGHTS.SEVERITY_OPTIONAL_MENTION; // 0.2
    }

    if (severity > 0) {
      totalPenalty += severity * penaltyWeight * 10;
    }
  }

  return Math.min(MATCHING_WEIGHTS.LAMBDA_NEGATIVE_PENALTY, totalPenalty);
}

/**
 * Main Stage 2 Deterministic Scorer:
 * Computes exact compatibility score in [0, 100] and full component breakdown.
 */
export function scoreJobOpportunity(
  job: JobMatchCandidate,
  profile: CareerProfile,
): DeterministicScoreResult {
  const roleScore = computeRoleScore(
    job.title,
    job.experience_level,
    profile.careerIntent,
  );

  const capabilityResult = computeCapabilityScore(
    job.requirements,
    profile.capabilities,
  );

  const preferenceScore = computePreferenceScore(job, profile.preferences);

  const negativePenalty = computeNegativePreferencePenalty(
    job,
    profile.preferences,
  );

  const rawFinal =
    MATCHING_WEIGHTS.W_ROLE * roleScore +
    MATCHING_WEIGHTS.W_CAPABILITY * capabilityResult.score +
    MATCHING_WEIGHTS.W_PREFERENCE * preferenceScore -
    negativePenalty;

  const finalScore = Math.round(Math.min(100, Math.max(0, rawFinal)));

  return {
    score: finalScore,
    breakdown: {
      final_score: finalScore,
      role_score: roleScore,
      capability_score: capabilityResult.score,
      preference_score: preferenceScore,
      negative_penalty: Math.round(negativePenalty),
    },
    missingSkills: capabilityResult.missingSkills,
  };
}
