// ==============================================================================
// CONFIGURATION: Matching Weights & Heuristic Scoring Parameters
// Module: @/features/matching/constants/matching-weights
// ==============================================================================

export const MATCHING_WEIGHTS = {
  // Global component weights summing to 1.0
  W_ROLE: 0.35,
  W_CAPABILITY: 0.4,
  W_PREFERENCE: 0.25,

  // Preference sub-weights summing to 1.0 (dynamically normalized if dimensions are unstated)
  W_PREF_LOCATION: 0.4,
  W_PREF_PRIORITY: 0.4,
  W_PREF_SALARY: 0.2,

  // Capability points mapped from evidence tiers
  POINT_CORE: 1.0,
  POINT_SUPPORTING: 0.75,
  POINT_TOOL: 0.5,

  // Role alignment multipliers
  MULTIPLIER_PRIMARY_ROLE: 1.0,
  MULTIPLIER_SECONDARY_ROLE: 0.7,
  MULTIPLIER_KEYWORD_MATCH: 0.4,
  MULTIPLIER_NON_MATCH: 0.1,

  // Negative preference penalty parameters
  // Capping P_neg at 1.0 is an INTENTIONAL heuristic to bound maximum soft penalty to 20 points
  LAMBDA_NEGATIVE_PENALTY: 20.0,
  SEVERITY_PRIMARY_REQUIRED: 1.0,
  SEVERITY_SECONDARY_REQUIRED: 0.5,
  SEVERITY_OPTIONAL_MENTION: 0.2,

  // Stage 1 candidate pool limits
  STAGE1_CANDIDATE_POOL_LIMIT: 100,
  STAGE3_AI_ANALYSIS_LIMIT: 5,
} as const;
