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
    const { rawText, sessionId } = body;

    if (!resumeId || !rawText) {
      return NextResponse.json(
        { error: "resumeId dan rawText wajib dikirim" },
        { status: 400 },
      );
    }

    // Verify resume ownership to prevent IDOR attacks
    const { data: resumeRecord, error: resumeFetchError } = await supabaseAdmin
      .from("resumes")
      .select("id, profile_id")
      .eq("id", resumeId)
      .single();

    if (resumeFetchError || !resumeRecord) {
      return NextResponse.json(
        { error: "Dokumen resume tidak ditemukan" },
        { status: 404 },
      );
    }

    if (resumeRecord.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden! Anda tidak memiliki izin untuk resume ini." },
        { status: 403 },
      );
    }

    // Verify session ownership if sessionId is provided
    if (sessionId) {
      const { data: sessionRecord, error: sessionFetchError } =
        await supabaseAdmin
          .from("chat_sessions")
          .select("id, user_id")
          .eq("id", sessionId)
          .single();

      if (
        sessionFetchError ||
        !sessionRecord ||
        sessionRecord.user_id !== user.id
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden! Sesi percakapan tidak valid atau bukan milik Anda.",
          },
          { status: 403 },
        );
      }
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

    // Sanitize skills to avoid PostgreSQL array parsing syntax errors
    const sanitizedSkills = (aiCandidateData.extracted_skills || [])
      .map((s) => s.replace(/["{},]/g, "").trim())
      .filter(Boolean);

    // Pre-filtering jobs
    let topJobs: Array<{
      id: string;
      title: string;
      description: string;
      requirements: string[];
      company_id: string;
    }> = [];

    if (sanitizedSkills.length > 0) {
      const { data: matchedSkillsJobs, error: jobsError } = await supabaseAdmin
        .from("jobs")
        .select("id, title, description, requirements, company_id")
        .filter("requirements", "ov", `{${sanitizedSkills.join(",")}}`)
        .limit(TOP_JOB_LIMIT);

      if (jobsError) throw jobsError;
      topJobs = matchedSkillsJobs || [];
    }

    // Fallback to latest active jobs if no overlap found
    if (topJobs.length === 0) {
      const { data: fallbackJobs } = await supabaseAdmin
        .from("jobs")
        .select("id, title, description, requirements, company_id")
        .eq("is_active", true)
        .limit(TOP_JOB_LIMIT);
      topJobs = fallbackJobs || [];
    }

    let matchedJobsWithDetails: import("@/types/chat").MatchedJobItem[] = [];

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

      const { data: fullMatches } = await supabaseAdmin
        .from("job_matches")
        .select(
          `
          id,
          job_id,
          match_score,
          reason,
          missing_skills,
          jobs:job_id (
            id,
            title,
            location,
            job_type,
            salary_range,
            companies:company_id (
              name,
              logo_url
            )
          )
        `,
        )
        .eq("analysis_id", analysisId)
        .order("match_score", { ascending: false });

      interface MatchQueryRow {
        id: string;
        job_id: string;
        match_score: number;
        reason: string | null;
        missing_skills: string[];
        jobs: {
          id: string;
          title: string;
          location: string;
          job_type: string;
          salary_range: string | null;
          companies: {
            name: string;
            logo_url: string | null;
          } | null;
        } | null;
      }

      matchedJobsWithDetails = (
        (fullMatches as unknown as MatchQueryRow[]) || []
      ).map((m) => ({
        id: m.id,
        job_id: m.job_id,
        match_score: m.match_score,
        reason: m.reason,
        missing_skills: m.missing_skills,
        title: m.jobs?.title || "Position",
        company: m.jobs?.companies?.name || "Company",
        logo_url: m.jobs?.companies?.logo_url,
        location: m.jobs?.location || "Remote",
        job_type: m.jobs?.job_type || "Full-time",
        salary_range: m.jobs?.salary_range,
      }));
    }

    if (sessionId) {
      const candidateName = aiCandidateData.json_profile.candidate.name;
      const candidateTitle = aiCandidateData.json_profile.candidate.title;

      const assistantMessageContent = `Halo ${
        candidateName !== "Anonim" ? candidateName : ""
      }! Saya telah menganalisis CV Anda sebagai **${candidateTitle}**.

Berikut adalah ringkasan profil keahlian Anda dan kurasi **lowongan pekerjaan yang paling cocok** berdasarkan tech stack dan pengalaman Anda. Silakan klik lowongan yang menarik atau tanyakan apa saja kepada saya untuk persiapan karir Anda!`;

      await supabaseAdmin.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantMessageContent,
        metadata: {
          analysis: aiCandidateData.json_profile,
          extracted_skills: aiCandidateData.extracted_skills,
          job_matches: matchedJobsWithDetails,
        },
      });

      // Only update title if current title is default or an analysis placeholder
      const { data: currentSession } = await supabaseAdmin
        .from("chat_sessions")
        .select("title")
        .eq("id", sessionId)
        .single();

      const shouldUpdateTitle =
        !currentSession?.title ||
        currentSession.title === "Obrolan Karir Baru" ||
        currentSession.title.startsWith("Analisis:") ||
        currentSession.title.startsWith("CV Analysis:");

      const sessionUpdatePayload: {
        resume_id: string;
        updated_at: string;
        title?: string;
      } = {
        resume_id: resumeId,
        updated_at: new Date().toISOString(),
      };

      if (shouldUpdateTitle) {
        sessionUpdatePayload.title = `Analisis: ${candidateTitle}`;
      }

      await supabaseAdmin
        .from("chat_sessions")
        .update(sessionUpdatePayload)
        .eq("id", sessionId);
    }

    await supabaseAdmin
      .from("resumes")
      .update({ status: "completed" })
      .eq("id", resumeId);

    return NextResponse.json({
      success: true,
      message: "Analisis selesai",
      analysisId,
      analysis: aiCandidateData.json_profile,
      jobMatches: matchedJobsWithDetails,
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
