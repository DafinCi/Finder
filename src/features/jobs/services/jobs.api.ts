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
        jobs (
          id,
          title,
          description,
          requirements,
          location,
          experience_level,
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
      .order("match_score", { ascending: false });

    if (error) {
      console.error("Error fetching job matches:", error);
      throw new Error("Gagal mengambil rekomendasi lowongan kerja.");
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
      companyName: match.jobs?.companies?.name,
      companyLogo: match.jobs?.companies?.logo_url,
      companyWebsite: match.jobs?.companies?.website || null,
      applyUrl: match.jobs?.companies?.website || null,
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
        companies (
          id,
          name,
          logo_url,
          description
        )
      `,
      )
      .eq("id", jobId)
      .single();

    if (error) {
      console.error("Error fetching job detail:", error);
      throw new Error("Gagal mengambil detail pekerjaan.");
    }

    return data;
  },
};
