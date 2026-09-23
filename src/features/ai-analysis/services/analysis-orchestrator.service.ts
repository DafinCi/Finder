import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  extractCandidateProfile,
  ExtractedProfileResult,
} from "@/lib/groq/profile-extractor";
import { analyzeJobMatches } from "@/lib/groq/job-matcher";
import { DEFAULT_GROQ_MODEL } from "@/lib/groq/client";
import { MatchedJobItem } from "@/types/chat";

const MODEL_NAME = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
const PROMPT_VERSION = "v1.0";
const TOP_JOB_LIMIT = 10;

export interface RunResumeAnalysisParams {
  userId: string;
  resumeId: string;
  rawText: string;
  sessionId?: string;
}

export interface RunResumeAnalysisResult {
  analysisId: string;
  analysis: ExtractedProfileResult["json_profile"];
  jobMatches: MatchedJobItem[];
}

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

/**
 * Domain Service: Executes the end-to-end resume analysis and matching workflow.
 * Encapsulates AI model execution, database transaction tracking, skill matching,
 * foreign key integrity guarantees, and conversational session bootstrapping.
 */
export async function runResumeAnalysisWorkflow({
  resumeId,
  rawText,
  sessionId,
}: RunResumeAnalysisParams): Promise<RunResumeAnalysisResult> {
  // 1. Mark resume processing
  await supabaseAdmin
    .from("resumes")
    .update({ status: "processing" })
    .eq("id", resumeId);

  try {
    // 2. Extract profile using AI model with fallback resilience
    const aiCandidateData = await extractCandidateProfile(rawText);

    // 3. Persist analysis record
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

    // 4. Sanitize skills and retrieve relevant job opportunities
    const sanitizedSkills = (aiCandidateData.extracted_skills || [])
      .map((s) => s.replace(/["{},]/g, "").trim())
      .filter(Boolean);

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

    // Fallback to latest active jobs if no skill overlap found
    if (topJobs.length === 0) {
      const { data: fallbackJobs } = await supabaseAdmin
        .from("jobs")
        .select("id, title, description, requirements, company_id")
        .eq("is_active", true)
        .limit(TOP_JOB_LIMIT);
      topJobs = fallbackJobs || [];
    }

    // 5. Perform AI job matching with scoring rubric
    let matchedJobsWithDetails: MatchedJobItem[] = [];

    if (topJobs && topJobs.length > 0) {
      const matchResults = await analyzeJobMatches(
        aiCandidateData.json_profile,
        topJobs,
      );

      // Validate that returned job_ids actually exist in topJobs (foreign key integrity guard)
      const validJobIdSet = new Set(topJobs.map((j) => j.id));
      const validMatches = matchResults.filter((match) =>
        validJobIdSet.has(match.job_id),
      );

      const matchInsertData = validMatches.map((match) => ({
        analysis_id: analysisId,
        job_id: match.job_id,
        match_score: Math.min(100, Math.max(0, Math.round(match.score))),
        reason: match.reason?.trim() || "Kecocokan profil teridentifikasi.",
        missing_skills: Array.isArray(match.missing_skills)
          ? match.missing_skills
          : [],
      }));

      if (matchInsertData.length > 0) {
        const { error: matchInsertError } = await supabaseAdmin
          .from("job_matches")
          .insert(matchInsertData);
        if (matchInsertError) throw matchInsertError;
      }

      // Fetch joined job matches for client presentation
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

    // 6. Bootstrap conversational session if session_id is provided
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

      // Update session title if using a default placeholder
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

    // 7. Mark resume as completed
    await supabaseAdmin
      .from("resumes")
      .update({ status: "completed" })
      .eq("id", resumeId);

    return {
      analysisId,
      analysis: aiCandidateData.json_profile,
      jobMatches: matchedJobsWithDetails,
    };
  } catch (error) {
    // 8. Rollback status to failed upon workflow interruption
    await supabaseAdmin
      .from("resumes")
      .update({ status: "failed" })
      .eq("id", resumeId);

    throw error;
  }
}
