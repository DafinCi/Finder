import {
  CanonicalEmploymentType,
  CanonicalJob,
} from "../../domain/canonical-job";
import { validateCanonicalJob } from "../../schemas/canonical-job.schema";
import { sanitizeJobDescription } from "../../utils/sanitize-description";
import { RemotiveRawJob } from "./remotive.schema";

/**
 * Normalizes Remotive's job_type strings to the CanonicalEmploymentType union.
 */
export function normalizeRemotiveJobType(
  rawJobType?: string | null,
): CanonicalEmploymentType {
  if (!rawJobType) return "full-time";

  const normalized = rawJobType
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "full_time":
      return "full-time";
    case "part_time":
      return "part-time";
    case "contract":
    case "contractor":
      return "contract";
    case "freelance":
      return "freelance";
    case "internship":
    case "intern":
      return "internship";
    default:
      return "other";
  }
}

/**
 * Safely extracts numerical salary boundaries if clearly expressed in the text.
 * Returns null if the salary string is empty or ambiguous.
 */
export function parseSalaryRange(rawSalary?: string | null): {
  min: number | null;
  max: number | null;
  currency: string | null;
} {
  if (!rawSalary || typeof rawSalary !== "string" || !rawSalary.trim()) {
    return { min: null, max: null, currency: null };
  }

  const trimmed = rawSalary.trim();
  let currency = "USD";
  if (trimmed.includes("€") || trimmed.toLowerCase().includes("eur")) {
    currency = "EUR";
  } else if (trimmed.includes("£") || trimmed.toLowerCase().includes("gbp")) {
    currency = "GBP";
  } else if (trimmed.includes("IDR") || trimmed.includes("Rp")) {
    currency = "IDR";
  }

  // Pattern for "$80,000 - $120,000" or "80k - 120k" or "80000 - 120000"
  const rangeMatch = trimmed.match(
    /(?:[$€£]|USD|EUR|GBP)?\s*([\d,.]+)\s*(k|K)?\s*(?:-|–|to)\s*(?:[$€£]|USD|EUR|GBP)?\s*([\d,.]+)\s*(k|K)?/i,
  );

  if (rangeMatch) {
    const rawMin = parseFloat(rangeMatch[1].replace(/,/g, ""));
    const isMinK = Boolean(rangeMatch[2]);
    const rawMax = parseFloat(rangeMatch[3].replace(/,/g, ""));
    const isMaxK = Boolean(rangeMatch[4]);

    if (!isNaN(rawMin) && !isNaN(rawMax)) {
      const min = Math.round(isMinK ? rawMin * 1000 : rawMin);
      const max = Math.round(isMaxK ? rawMax * 1000 : rawMax);
      if (min >= 0 && max >= min) {
        return { min, max, currency };
      }
    }
  }

  return { min: null, max: null, currency: null };
}

/**
 * Safely normalizes publication date into an ISO string.
 */
function parseIsoDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Transforms a raw Remotive job API object into a validated CanonicalJob domain model.
 */
export function remotiveJobToCanonicalJob(raw: RemotiveRawJob): CanonicalJob {
  const sanitizedDescription = sanitizeJobDescription(raw.description || "");
  const fallbackDescription =
    sanitizedDescription ||
    `${raw.title} at ${raw.company_name}. For full details and application instructions, please visit the original listing.`;

  const {
    min: salaryMin,
    max: salaryMax,
    currency: salaryCurrency,
  } = parseSalaryRange(raw.salary);

  const logoCandidate = raw.company_logo || raw.company_logo_url || null;
  const validLogo =
    logoCandidate && logoCandidate.startsWith("http") ? logoCandidate : null;

  const validUrl = raw.url && raw.url.startsWith("http") ? raw.url : null;

  const candidate: CanonicalJob = {
    source: "remotive",
    sourceJobId: String(raw.id),
    title: raw.title.trim(),
    companyName: raw.company_name.trim(),
    companyLogo: validLogo,
    companyId: null, // Resolved in ingestion service against existing companies
    description: fallbackDescription,
    requirements: Array.isArray(raw.tags)
      ? raw.tags.map((t) => t.trim()).filter(Boolean)
      : [],
    location: raw.candidate_required_location?.trim() || "Remote",
    isRemote: true,
    jobType: normalizeRemotiveJobType(raw.job_type),
    experienceLevel: "Mid-Level",
    salaryMin,
    salaryMax,
    salaryCurrency: salaryCurrency || (raw.salary ? "USD" : null),
    salaryRange: raw.salary && raw.salary.trim() ? raw.salary.trim() : null,
    postedAt: parseIsoDate(raw.publication_date),
    applyUrl: validUrl,
    sourceUrl: validUrl,
    isActive: true,
    lastSyncedAt: new Date().toISOString(),
  };

  return validateCanonicalJob(candidate) as CanonicalJob;
}
