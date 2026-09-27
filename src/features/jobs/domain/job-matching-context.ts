import { sanitizeJobDescription } from "../utils/sanitize-description";

/**
 * Dedicated compact representation for LLM Job Matching.
 * Shields the AI model from raw HTML, long descriptions, irrelevant benefits,
 * and unbounded token explosions while preserving all semantically relevant
 * criteria for technical evaluation.
 */
export interface JobMatchingContext {
  id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary?: string | null;
  requirements: string[];
  role_overview: string;
  key_qualifications: string[];
}

export interface CandidateMatchingContext {
  title: string;
  years_of_experience: number;
  career_level: string;
  summary: string;
  skills: {
    core: string[];
    supporting: string[];
  };
  recent_roles: Array<{
    role: string;
    company: string;
    duration: string;
  }>;
}

export interface RawJobInput {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location?: string | null;
  job_type?: string | null;
  salary_range?: string | null;
  experience_level?: string | null;
  company_name?: string | null;
  companies?: { name?: string | null } | null;
}

/**
 * Extracts a concise, bounded role overview from the sanitized description.
 * Truncates deterministically at a sentence boundary.
 */
export function extractRoleOverview(
  description: string,
  maxChars = 350,
): string {
  if (!description || typeof description !== "string") return "";

  // Ensure text is clean of any raw HTML
  const clean = description.includes("<")
    ? sanitizeJobDescription(description)
    : description;

  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !/^location:|^availability:|^working hours:|^reporting to:/i.test(l),
    );

  let overview = "";
  for (const line of lines) {
    if (
      /^(what we offer|benefits|perks|compensation|how we interview|how we work)\b/i.test(
        line,
      )
    ) {
      break;
    }
    overview += (overview ? " " : "") + line;
    if (overview.length >= maxChars) break;
  }

  // Fallback to first non-empty line if overview is still empty
  if (!overview && lines.length > 0) {
    overview = lines.slice(0, 2).join(" ");
  }

  // Sentence-boundary truncation
  if (overview.length > maxChars) {
    const periodIdx = overview.lastIndexOf(".", maxChars);
    if (periodIdx > 120) {
      overview = overview.substring(0, periodIdx + 1);
    } else {
      overview = overview.substring(0, maxChars).trim() + "...";
    }
  }

  return overview.trim();
}

/**
 * Extracts key technical requirements and qualification statements from description text.
 * Targets lines specifying years of experience, technical proficiencies, or competencies.
 * Bounded to maxItems and maxTotalChars to keep token usage strictly deterministic.
 */
export function extractKeyQualifications(
  description: string,
  maxItems = 5,
  maxTotalChars = 500,
): string[] {
  if (!description || typeof description !== "string") return [];

  const clean = description.includes("<")
    ? sanitizeJobDescription(description)
    : description;

  const lines = clean
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const qualIndicators =
    /\b(\d+\+?\s*years?|experience with|proficien|knowledge of|familiar with|expertise in|must have|strong understanding|fluency in|hands-on|competenc|solid understanding)\b/i;
  const excludePatterns =
    /\b(what we offer|compensation|interview|benefits|vacation|health insurance|401k|perks|pto)\b/i;

  const results: string[] = [];
  let totalChars = 0;

  for (const line of lines) {
    if (excludePatterns.test(line)) continue;
    // Strip bullet markers or decorative emojis, or numbered prefixes like '1. ' or '2) '
    const cleanLine = line
      .replace(/^[•\-\*👉💼⭐\s]+/, "")
      .replace(/^\d+[\.)]\s+/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanLine.length < 15 || cleanLine.length > 300) continue;

    if (qualIndicators.test(cleanLine)) {
      let item = cleanLine;
      if (item.length > 120) {
        const cut = item.lastIndexOf(".", 120);
        item =
          cut > 50
            ? item.substring(0, cut + 1)
            : item.substring(0, 117).trim() + "...";
      }

      if (!results.includes(item)) {
        results.push(item);
        totalChars += item.length;
        if (results.length >= maxItems || totalChars >= maxTotalChars) break;
      }
    }
  }

  return results;
}

/**
 * Maps a rich database job row into an AI-boundary JobMatchingContext.
 */
export function toJobMatchingContext(job: RawJobInput): JobMatchingContext {
  const company =
    job.company_name?.trim() || job.companies?.name?.trim() || "Company";

  return {
    id: String(job.id),
    title: String(job.title || "Job Opportunity").trim(),
    company,
    location: job.location?.trim() || "Remote",
    employment_type: job.job_type?.trim() || "full-time",
    experience_level: job.experience_level?.trim() || "Mid-Level",
    salary: job.salary_range?.trim() || null,
    requirements: Array.isArray(job.requirements)
      ? job.requirements.map((r) => String(r).trim()).filter(Boolean)
      : [],
    role_overview: extractRoleOverview(job.description),
    key_qualifications: extractKeyQualifications(job.description),
  };
}

/**
 * Truncates text cleanly at sentence boundary up to maxChars.
 */
function extractBoundedSummary(text: string, maxChars = 400): string {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const periodIdx = trimmed.lastIndexOf(".", maxChars);
  if (periodIdx > 150) {
    return trimmed.substring(0, periodIdx + 1);
  }
  return trimmed.substring(0, maxChars).trim() + "...";
}

/**
 * Maps rich candidate analysis profile into an AI-boundary CandidateMatchingContext.
 * Strips verbose achievement essays, personal education history, and internal coaching insights.
 */
export function toCandidateMatchingContext(
  raw: unknown,
): CandidateMatchingContext {
  const profile =
    raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
  const candidate = (profile.candidate || profile || {}) as Record<string, any>;
  const career = (profile.career || {}) as Record<string, any>;
  const skills = (candidate.skills || {}) as Record<string, any>;

  return {
    title: String(candidate.title || "Professional").trim(),
    years_of_experience: Number(candidate.years_of_experience) || 0,
    career_level: String(career.career_level || "Mid-Level").trim(),
    summary: extractBoundedSummary(String(candidate.summary || ""), 400),
    skills: {
      core: Array.isArray(skills.core)
        ? skills.core
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      supporting: Array.isArray(skills.supporting)
        ? skills.supporting
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    },
    recent_roles: Array.isArray(candidate.experience)
      ? candidate.experience.slice(0, 3).map((exp: any) => ({
          role: String(exp.role || "Role").trim(),
          company: String(exp.company || "Company").trim(),
          duration: String(exp.duration || "").trim(),
        }))
      : [],
  };
}
