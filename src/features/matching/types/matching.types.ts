// ==============================================================================
// DOMAIN TYPES: Deterministic Matching Engine
// Module: @/features/matching/types/matching.types
// ==============================================================================

export interface MatchScoreBreakdown {
  final_score: number; // Authoritative deterministic integer in [0, 100]
  role_score: number; // Normalized [0, 100]
  capability_score: number; // Normalized [0, 100]
  preference_score: number; // Normalized [0, 100]
  negative_penalty: number; // Subtracted penalty points [0, 20]
}

export interface QualitativeAnalysis {
  fit_rationale: string; // 2-3 sentences explaining deterministic alignment
  missing_skills: string[]; // Required by job, but not found in profile capability evidence
  negative_preference_nuance?: string; // Contextual explanation if job contains negative preference tokens
  requirement_interpretation?: string; // Nuanced context for employer requirements
}

export interface RecommendedJobOpportunity {
  job_id: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  location: string;
  work_mode: "remote" | "hybrid" | "onsite" | "unknown";
  salary_range: string | null;
  match_score: number; // "X / 100 Match Score"
  score_breakdown: MatchScoreBreakdown;
  qualitative: QualitativeAnalysis;
  apply_url: string | null;
  posted_at: string;
}
