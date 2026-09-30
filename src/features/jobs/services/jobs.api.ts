import { supabase } from "@/lib/supabase/client";
import {
  MatchScoreBreakdown,
  QualitativeAnalysis,
  RecommendedJobOpportunity,
} from "@/features/matching/types/matching.types";
import {
  FeedbackReason,
  InteractionType,
} from "@/features/feedback/schemas/feedback.schema";

export interface FormattedJobMatch {
  matchId: string;
  matchScore: number;
  reason: string;
  missingSkills: string[];
  jobId: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  workMode?: "remote" | "hybrid" | "onsite" | "unknown";
  experienceLevel: string;
  salaryRange?: string | null;
  companyId?: string;
  companyName?: string;
  companyLogo?: string | null;
  companyWebsite?: string | null;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  source?: string;
  isSaved?: boolean;
  scoreBreakdown?: MatchScoreBreakdown;
  qualitative?: QualitativeAnalysis;
}

export const jobsApi = {
  /**
   * Fetches V2 deterministic recommendations from /api/recommendations
   */
  getV2Recommendations: async (
    limit = 10,
  ): Promise<{
    recommendations: FormattedJobMatch[];
    requiresOnboarding?: boolean;
  }> => {
    const res = await fetch(`/api/recommendations?limit=${limit}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 404) {
      const data = await res.json().catch(() => ({}));
      if (data?.requiresOnboarding) {
        return { recommendations: [], requiresOnboarding: true };
      }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to load job recommendations.");
    }

    const { recommendations = [] } = (await res.json()) as {
      recommendations: RecommendedJobOpportunity[];
    };

    // Parallel fetch saved job IDs to mark saved state
    let savedJobIds: string[] = [];
    try {
      savedJobIds = await jobsApi.getSavedJobIds();
    } catch {
      // Non-blocking if feedback endpoint fails
    }

    const formatted: FormattedJobMatch[] = recommendations.map((rec) => ({
      matchId: rec.job_id,
      jobId: rec.job_id,
      matchScore: rec.match_score,
      reason:
        rec.qualitative?.fit_rationale || "Strong alignment with your profile",
      missingSkills: rec.qualitative?.missing_skills || [],
      title: rec.title,
      description: rec.description || "",
      requirements: rec.requirements || [],
      location: rec.location,
      workMode: rec.work_mode,
      experienceLevel: rec.experience_level || "Not specified",
      salaryRange: rec.salary_range,
      companyName: rec.company_name,
      companyLogo: rec.company_logo,
      applyUrl: rec.apply_url,
      sourceUrl: rec.source_url,
      source: rec.source || "manual",
      isSaved: savedJobIds.includes(rec.job_id),
      scoreBreakdown: rec.score_breakdown,
      qualitative: rec.qualitative,
    }));

    return { recommendations: formatted, requiresOnboarding: false };
  },

  /**
   * Retrieves list of saved job IDs for current candidate
   */
  getSavedJobIds: async (): Promise<string[]> => {
    const res = await fetch("/api/feedback", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.savedJobIds) ? data.savedJobIds : [];
  },

  /**
   * Saves / bookmarks a job
   */
  saveJob: async (jobId: string, notes?: string): Promise<boolean> => {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        eventType: "save",
        metadata: notes ? { notes } : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to save job.");
    }
    return true;
  },

  /**
   * Unsaves / removes bookmark for a job
   */
  unsaveJob: async (jobId: string): Promise<boolean> => {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        eventType: "unsave",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to unsave job.");
    }
    return true;
  },

  /**
   * Rejects / marks job as not interested
   */
  rejectJob: async (
    jobId: string,
    reason?: FeedbackReason,
  ): Promise<boolean> => {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        eventType: "reject",
        reason: reason || "not_interested",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to record job preference.");
    }
    return true;
  },

  /**
   * Records external apply button click
   */
  recordApplyClick: async (jobId: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          eventType: "external_apply_clicked",
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Records quarantined user telemetry event
   */
  recordTelemetry: async (
    jobId: string,
    interactionType: InteractionType,
    durationMs?: number,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          interactionType,
          durationMs,
          timestamp: new Date().toISOString(),
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Legacy V1 fallback (deprecated)
   */
  getJobMatches: async (analysisId: string): Promise<FormattedJobMatch[]> => {
    const { data, error } = await supabase
      .from("job_matches")
      .select(
        `
        id,
        match_score,
        reason,
        missing_skills,
        jobs!inner (
          id,
          title,
          description,
          requirements,
          location,
          experience_level,
          is_active,
          apply_url,
          source_url,
          source,
          company_name,
          company_logo,
          companies (
            id,
            name,
            logo_url,
            website
          )
        )
      `,
      )
      .eq("analysis_id", analysisId)
      .eq("jobs.is_active", true)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("Error fetching job matches:", error);
      throw new Error("Couldn't load job recommendations.");
    }

    return (data || []).map((match: any) => ({
      matchId: match.id,
      matchScore: match.match_score,
      reason: match.reason,
      missingSkills: Array.isArray(match.missing_skills)
        ? match.missing_skills
        : typeof match.missing_skills === "string"
          ? JSON.parse(match.missing_skills)
          : [],
      jobId: match.jobs?.id,
      title: match.jobs?.title,
      description: match.jobs?.description,
      requirements: match.jobs?.requirements || [],
      location: match.jobs?.location,
      experienceLevel: match.jobs?.experience_level,
      companyId: match.jobs?.companies?.id,
      companyName:
        match.jobs?.companies?.name || match.jobs?.company_name || "Company",
      companyLogo:
        match.jobs?.companies?.logo_url || match.jobs?.company_logo || null,
      companyWebsite: match.jobs?.companies?.website || null,
      applyUrl: match.jobs?.apply_url || match.jobs?.companies?.website || null,
      sourceUrl: match.jobs?.source_url || null,
      source: match.jobs?.source || "manual",
    }));
  },

  getJobDetail: async (jobId: string) => {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id,
        title,
        description,
        requirements,
        location,
        experience_level,
        is_active,
        apply_url,
        source_url,
        source,
        company_name,
        company_logo,
        companies (
          id,
          name,
          logo_url,
          description
        )
      `,
      )
      .eq("id", jobId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching job detail:", error);
      throw new Error("Couldn't load job details.");
    }

    const rawCompany: any = Array.isArray(data.companies)
      ? data.companies[0]
      : data.companies;

    return {
      ...data,
      company_name: rawCompany?.name || data.company_name || "Company",
      company_logo: rawCompany?.logo_url || data.company_logo || null,
    };
  },
};
