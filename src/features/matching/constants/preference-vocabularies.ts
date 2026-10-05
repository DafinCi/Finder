// ==============================================================================
// CONFIGURATION: Semantic Vocabularies for Preferences & Constraints
// Module: @/features/matching/constants/preference-vocabularies
// ==============================================================================

export interface PriorityDefinition {
  id: string;
  label: string;
  terms: string[];
}

export interface NegativePreferenceDefinition {
  token: string;
  terms: string[];
}

/**
 * Centralized semantic mapping for preset candidate priorities.
 * Maps enum-like preset IDs to natural language phrases commonly used in job descriptions.
 */
export const PRIORITY_VOCABULARIES: Record<string, PriorityDefinition> = {
  mentorship: {
    id: "mentorship",
    label: "Mentorship & Guidance",
    terms: [
      "mentorship",
      "mentor",
      "mentoring",
      "coaching",
      "code review",
      "guidance",
      "learn from senior",
      "senior guidance",
    ],
  },
  modern_tech: {
    id: "modern_tech",
    label: "Modern Tech Stack",
    terms: [
      "modern tech",
      "modern technology",
      "modern stack",
      "modern tooling",
      "cutting-edge",
      "cutting edge",
      "latest technologies",
      "latest technology",
      "react",
      "next.js",
      "typescript",
      "cloud-native",
      "cloud native",
    ],
  },
  learning_growth: {
    id: "learning_growth",
    label: "High Learning & Growth",
    terms: [
      "learning and growth",
      "learning & growth",
      "learning curve",
      "career growth",
      "professional development",
      "education budget",
      "conference budget",
      "continuous learning",
      "upskilling",
      "growth opportunity",
      "growth opportunities",
    ],
  },
  work_life_balance: {
    id: "work_life_balance",
    label: "Work-Life Balance",
    terms: [
      "work-life balance",
      "work life balance",
      "flexible hours",
      "flexible working",
      "healthy working hours",
      "no crunch",
      "sustainable pace",
      "40 hours",
      "40-hour",
    ],
  },
  competitive_salary: {
    id: "competitive_salary",
    label: "Competitive Salary",
    terms: [
      "competitive salary",
      "competitive compensation",
      "competitive pay",
      "market rate",
      "market-leading",
      "equity",
      "stock options",
      "transparent pay",
      "attractive compensation",
      "generous compensation",
    ],
  },
  high_autonomy: {
    id: "high_autonomy",
    label: "High Autonomy",
    terms: [
      "high autonomy",
      "autonomy",
      "autonomous",
      "ownership",
      "architectural decisions",
      "self-starter",
      "freedom to make",
      "independent contributor",
      "own features",
      "end-to-end ownership",
    ],
  },
};

/**
 * Returns the matching search terms for a given priority.
 * If the priority ID matches a known preset, returns its semantic terms.
 * Otherwise returns the normalized raw string and space-separated variant.
 */
export function getPriorityMatchTerms(priorityId: string): string[] {
  const norm = priorityId.toLowerCase().trim();
  const def = PRIORITY_VOCABULARIES[norm];
  if (def) {
    return def.terms;
  }
  const clean = norm.replace(/_/g, " ");
  return clean !== norm ? [norm, clean] : [norm];
}

/**
 * Centralized semantic mapping for preset negative preferences.
 * Maps underscore tokens to natural language phrases found in job descriptions.
 */
export const NEGATIVE_PREFERENCE_VOCABULARIES: Record<
  string,
  NegativePreferenceDefinition
> = {
  legacy_codebases: {
    token: "legacy_codebases",
    terms: [
      "legacy codebase",
      "legacy codebases",
      "legacy code",
      "legacy systems",
      "legacy system",
      "legacy software",
      "legacy infrastructure",
      "legacy monolith",
      "monolithic legacy",
      "maintaining legacy",
      "migration from legacy",
    ],
  },
  unpaid_overtime: {
    token: "unpaid_overtime",
    terms: [
      "unpaid overtime",
      "unpaid crunch",
      "996 schedule",
      "996",
      "mandatory overtime",
      "weekend work",
      "regular overtime",
      "crunch hours",
    ],
  },
  gambling: {
    token: "gambling",
    terms: [
      "gambling",
      "casino",
      "betting",
      "sportsbook",
      "poker",
      "online gaming casino",
    ],
  },
  crypto_speculation: {
    token: "crypto_speculation",
    terms: [
      "crypto speculation",
      "token speculation",
      "memecoin",
      "pump and dump",
      "yield farming",
      "speculative token",
      "high-risk crypto",
    ],
  },
  frequent_travel: {
    token: "frequent_travel",
    terms: [
      "frequent travel",
      "regular travel",
      "travel required",
      "heavy travel",
      "travel >25%",
      "travel > 25%",
      "travel 25%",
      "travel 50%",
      "extensive travel",
    ],
  },
};

/**
 * Returns the matching search terms for a given negative preference token.
 * If the token matches a known preset, returns its semantic terms.
 * Otherwise returns the normalized raw token and space-separated variant.
 */
export function getNegativePreferenceMatchTerms(token: string): string[] {
  const norm = token.toLowerCase().trim();
  const def = NEGATIVE_PREFERENCE_VOCABULARIES[norm];
  if (def) {
    return def.terms;
  }
  const clean = norm.replace(/_/g, " ");
  return clean !== norm ? [norm, clean] : [norm];
}
