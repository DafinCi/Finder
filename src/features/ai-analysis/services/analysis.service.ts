import { supabase } from "@/lib/supabase/client";

export async function startAnalysis(resumeId: string, rawText: string) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resumeId, rawText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Terjadi kesalahan saat menganalisis resume.",
      );
    }

    return data;
  } catch (error) {
    console.error("Client Service Analysis Error:", error);
    throw error;
  }
}

export async function fetchAnalysisData(analysisId: string) {
  try {
    const { data: analysis, error: analysisError } = await supabase
      .from("resume_analysis")
      .select("id, candidate_data, extracted_skills, created_at")
      .eq("id", analysisId)
      .single();

    if (analysisError) throw analysisError;

    const { data: matches, error: matchesError } = await supabase
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
          requirements,
          company_id
        )
      `,
      )
      .eq("analysis_id", analysisId)
      .order("match_score", { ascending: false });

    if (matchesError) throw matchesError;

    return {
      profile: analysis.candidate_data,
      skills: analysis.extracted_skills,
      jobMatches: matches || [],
      created_at: analysis.created_at,
    };
  } catch (error) {
    console.error("Client Service Fetch Data Error:", error);
    throw new Error("Gagal mengambil data analisis dari database.");
  }
}

export async function fetchLatestAnalysis(resumeId: string) {
  try {
    const { data, error } = await supabase
      .from("resume_analysis")
      .select("id")
      .eq("resume_id", resumeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Client Service Fetch Latest Error:", error);
    throw error;
  }
}

export async function fetchUserLatestAnalysis() {
  try {
    const { data, error } = await supabase
      .from("resume_analysis")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Client Service Fetch User Latest Error:", error);
    throw error;
  }
}
