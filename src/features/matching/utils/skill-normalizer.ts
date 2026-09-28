// ==============================================================================
// UTILITY: Centralized Canonical Skill Normalizer
// Module: @/features/matching/utils/skill-normalizer
// ==============================================================================

/**
 * Authoritative alias dictionary resolving common lexical variations to canonical tokens.
 * INVARIANT: Maps exact lexical aliases ONLY. Strictly avoids semantic expansion
 * (e.g. "java" != "javascript", "react" != "react native", "node.js" != "express").
 */
const CANONICAL_SKILL_ALIASES: Record<string, string> = {
  // TypeScript / JavaScript
  ts: "typescript",
  typescript: "typescript",
  js: "javascript",
  javascript: "javascript",
  ecmascript: "javascript",

  // Node.js
  node: "node.js",
  nodejs: "node.js",
  "node.js": "node.js",

  // React ecosystem
  react: "react",
  reactjs: "react",
  "react.js": "react",
  next: "next.js",
  nextjs: "next.js",
  "next.js": "next.js",

  // Vue ecosystem
  vue: "vue",
  vuejs: "vue",
  "vue.js": "vue",
  nuxt: "nuxt.js",
  nuxtjs: "nuxt.js",
  "nuxt.js": "nuxt.js",

  // Angular
  angular: "angular",
  angularjs: "angular",
  "angular.js": "angular",

  // Go
  go: "go",
  golang: "go",

  // Python
  py: "python",
  python: "python",
  python3: "python",
  "python 3": "python",

  // Databases
  postgres: "postgresql",
  postgresql: "postgresql",
  pgsql: "postgresql",
  mongo: "mongodb",
  mongodb: "mongodb",

  // Cloud & DevOps
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  "amazon web services": "aws",
  "google cloud": "gcp",
  "google cloud platform": "gcp",
};

/**
 * Normalizes a raw skill string into its canonical token.
 * 1. Trims and converts to lowercase.
 * 2. Normalizes punctuation while preserving meaningful programming chars (C++, C#, .NET).
 * 3. Resolves aliases through the canonical dictionary.
 */
export function normalizeSkill(rawSkill: string): string {
  if (!rawSkill || typeof rawSkill !== "string") return "";

  const trimmed = rawSkill.trim().toLowerCase();
  if (!trimmed) return "";

  // Check alias dictionary directly
  if (CANONICAL_SKILL_ALIASES[trimmed]) {
    return CANONICAL_SKILL_ALIASES[trimmed];
  }

  // Strip non-semantic wrapping quotes or brackets
  const cleaned = trimmed.replace(/^["'(\[]+|["')\]]+$/g, "").trim();

  if (CANONICAL_SKILL_ALIASES[cleaned]) {
    return CANONICAL_SKILL_ALIASES[cleaned];
  }

  return cleaned;
}

/**
 * Evaluates whether candidate capability matches a job requirement.
 * Returns true if both normalize to the exact same canonical token.
 */
export function matchesSkill(
  candidateSkill: string,
  jobRequirement: string,
): boolean {
  const normA = normalizeSkill(candidateSkill);
  const normB = normalizeSkill(jobRequirement);

  if (!normA || !normB) return false;
  return normA === normB;
}
