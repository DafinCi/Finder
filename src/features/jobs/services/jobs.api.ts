import { supabase } from "@/lib/supabase/client";

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
  experienceLevel: string;
  companyId?: string;
  companyName?: string;
  companyLogo?: string | null;
  companyWebsite?: string | null;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  source?: string;
}

export const jobsApi = {
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
