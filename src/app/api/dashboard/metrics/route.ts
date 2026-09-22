import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized! Sesi telah habis, silakan login kembali." },
        { status: 401 },
      );
    }

    const { data: latestResume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, status, uploaded_at")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resumeError) {
      console.error("Error fetching latest resume:", resumeError);
      throw resumeError;
    }

    if (!latestResume) {
      return NextResponse.json(
        {
          hasResume: false,
          resumeStatus: null,
          metrics: null,
        },
        { status: 200 },
      );
    }

    if (latestResume.status !== "completed") {
      return NextResponse.json(
        {
          hasResume: true,
          resumeStatus: latestResume.status,
          metrics: null,
        },
        { status: 200 },
      );
    }

    const { data: latestAnalysis, error: analysisError } = await supabase
      .from("resume_analysis")
      .select(
        `
        id,
        candidate_data,
        extracted_skills,
        created_at,
        job_matches (
          match_score,
          missing_skills
        )
      `,
      )
      .eq("resume_id", latestResume.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) {
      console.error("Error fetching latest analysis:", analysisError);
      throw analysisError;
    }

    if (!latestAnalysis) {
      return NextResponse.json(
        { hasResume: true, resumeStatus: "processing", metrics: null },
        { status: 200 },
      );
    }

    const skillsCount = latestAnalysis.extracted_skills?.length || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobMatches = (latestAnalysis.job_matches || []) as any[];
    const totalMatches = jobMatches.length;

    const allMissingSkills = jobMatches.flatMap((m) => m.missing_skills || []);
    const uniqueMissingSkills = [...new Set(allMissingSkills)];
    const missingSkillsCount = uniqueMissingSkills.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidateProfile = (latestAnalysis.candidate_data || {}) as any;

    const topRole =
      candidateProfile.career?.recommended_roles?.[0] ||
      candidateProfile.candidate?.title ||
      candidateProfile.title ||
      candidateProfile.role ||
      "Professional";

    const scores = jobMatches.map((m) => m.match_score || 0);
    const careerScore = scores.length > 0 ? Math.max(...scores) : 70;

    return NextResponse.json(
      {
        hasResume: true,
        resumeStatus: "completed",
        metrics: {
          careerScore,
          totalMatches,
          skillsCount,
          missingSkillsCount,
          topRole,
          lastAnalyzed: latestAnalysis.created_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API GET Dashboard Metrics Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses data metrik dashboard" },
      { status: 500 },
    );
  }
}
