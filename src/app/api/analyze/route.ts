import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { extractCandidateProfile } from "@/lib/groq/profile-extractor";
import { analyzeJobMatches } from "@/lib/groq/job-matcher";
import { DEFAULT_GROQ_MODEL } from "@/lib/groq/client";

const MODEL_NAME = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
const PROMPT_VERSION = "v1.0";
const TOP_JOB_LIMIT = 10;

export async function POST(req: NextRequest) {
  let resumeId: string | null = null;

  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized! Silakan login kembali." },
        { status: 401 },
      );
    }

    const body = await req.json();
    resumeId = body.resumeId;
    const { rawText } = body;

    if (!resumeId || !rawText) {
      return NextResponse.json(
        { error: "resumeId dan rawText wajib dikirim" },
        { status: 400 },
      );
    }

    await supabaseAdmin
      .from("resumes")
      .update({ status: "processing" })
      .eq("id", resumeId);

    const aiCandidateData = await extractCandidateProfile(rawText);

    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("resume_analysis")
      .insert({
        resume_id: resumeId,
        model_version: MODEL_NAME,
        prompt_version: PROMPT_VERSION,
        candidate_data: aiCandidateData.json_profile,
        extracted_skills: aiCandidateData.extracted_skills,
      })
      .select("id")
      .single();

    if (analysisError) throw analysisError;
    const analysisId = analysisData.id;

    // Pre-filtering jobs
    const { data: topJobs, error: jobsError } = await supabaseAdmin
      .from("jobs")
      .select("id, title, description, requirements, company_id")
      .filter(
        "requirements",
        "ov",
        `{${aiCandidateData.extracted_skills.join(",")}}`,
      )
      .limit(TOP_JOB_LIMIT);

    if (jobsError) throw jobsError;

    if (topJobs && topJobs.length > 0) {
      const matchResults = await analyzeJobMatches(
        aiCandidateData.json_profile,
        topJobs,
      );

      const matchInsertData = matchResults.map((match) => ({
        analysis_id: analysisId,
        job_id: match.job_id,
        match_score: match.score,
        reason: match.reason,
        missing_skills: match.missing_skills,
      }));

      const { error: matchInsertError } = await supabaseAdmin
        .from("job_matches")
        .insert(matchInsertData);
      if (matchInsertError) throw matchInsertError;
    }

    await supabaseAdmin
      .from("resumes")
      .update({ status: "completed" })
      .eq("id", resumeId);

    return NextResponse.json({
      success: true,
      message: "Analisis selesai",
      analysisId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("API Analyze Error:", err);
    if (resumeId) {
      await supabaseAdmin
        .from("resumes")
        .update({ status: "failed" })
        .eq("id", resumeId);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
