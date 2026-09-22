import { supabase } from "@/lib/supabase/client";

export const resumeService = {
  uploadPdf: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-resume", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Gagal mengunggah resume.");
    }

    return res.json();
  },

  startAnalysis: async (resumeId: string, rawText: string) => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, rawText }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Gagal menganalisis resume.");
    }

    return res.json();
  },

  fetchAnalysisData: async (analysisId: string) => {
    const { data, error } = await supabase
      .from("resume_analysis")
      .select(
        `
        candidate_data,
        extracted_skills,
        job_matches (
          match_score,
          reason,
          missing_skills,
          jobs ( id, title, company_id )
        )
      `,
      )
      .eq("id", analysisId)
      .single();

    if (error) throw new Error("Gagal mengambil data hasil analisis.");
    return data;
  },

  fetchLatestAnalysis: async () => {
    const { data, error } = await supabase
      .from("resume_analysis")
      .select(
        `
        id,
        created_at,
        candidate_data,
        extracted_skills,
        job_matches (
          match_score,
          reason,
          missing_skills,
          jobs ( id, title, company_id )
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error("Gagal memeriksa riwayat resume.");
    return data;
  },
};
