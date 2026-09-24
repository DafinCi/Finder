import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  extractCandidateProfile,
  ExtractedProfileResult,
} from "@/lib/groq/profile-extractor";
import { analyzeJobMatches } from "@/lib/groq/job-matcher";
import { DEFAULT_GROQ_MODEL } from "@/lib/groq/client";
import { PROFILE_EXTRACTOR_PROMPT_VERSION } from "@/lib/groq/prompts/profile-extractor.prompt";
import { MatchedJobItem } from "@/types/chat";

const MODEL_NAME = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
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

async function getCachedCompletedAnalysis(
  resumeId: string,
): Promise<RunResumeAnalysisResult | null> {
  const { data: existingAnalysis } = await supabaseAdmin
    .from("resume_analysis")
    .select("id, candidate_data, extracted_skills")
    .eq("resume_id", resumeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingAnalysis?.candidate_data) return null;

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
    .eq("analysis_id", existingAnalysis.id)
    .order("match_score", { ascending: false });

  const cachedMatchedJobs: MatchedJobItem[] = (
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

  return {
    analysisId: existingAnalysis.id,
    analysis:
      existingAnalysis.candidate_data as ExtractedProfileResult["json_profile"],
    jobMatches: cachedMatchedJobs,
  };
}

/**
 * Domain Service: Executes the end-to-end resume analysis and matching workflow.
 * Encapsulates AI model execution, database transaction tracking, skill matching,
 * foreign key integrity guarantees, idempotency caching, concurrency locks, and graceful degradation.
 */
export async function runResumeAnalysisWorkflow({
  resumeId,
  rawText,
  sessionId,
}: RunResumeAnalysisParams): Promise<RunResumeAnalysisResult> {
  // 1. Idempotency Check: Reuse existing analysis if resume is already completed
  const { data: currentResume } = await supabaseAdmin
    .from("resumes")
    .select("status")
    .eq("id", resumeId)
    .single();

  if (currentResume?.status === "completed") {
    const cached = await getCachedCompletedAnalysis(resumeId);
    if (cached) {
      console.log(
        `[ANALYSIS:IDEMPOTENT] Reusing cached completed analysis ${cached.analysisId} for resume ${resumeId}`,
      );
      return cached;
    }
  }

  // Concurrency Guard: If resume is already processing, wait for concurrent worker to avoid duplicate LLM calls
  if (currentResume?.status === "processing") {
    console.log(
      `[ANALYSIS:CONCURRENCY] Resume ${resumeId} is already processing. Awaiting completion from active worker...`,
    );
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { data: pollResume } = await supabaseAdmin
        .from("resumes")
        .select("status")
        .eq("id", resumeId)
        .maybeSingle();

      if (pollResume?.status === "completed") {
        const cached = await getCachedCompletedAnalysis(resumeId);
        if (cached) {
          console.log(
            `[ANALYSIS:CONCURRENCY] Recovered completed analysis for resume ${resumeId}`,
          );
          return cached;
        }
      }
      if (pollResume?.status === "failed") {
        throw new Error(
          "Proses analisis resume sebelumnya gagal. Silakan coba kembali.",
        );
      }
    }

    const conflictErr = new Error(
      "Analisis resume sedang berjalan pada proses lain. Mohon tunggu beberapa detik.",
    );
    (conflictErr as unknown as { statusCode: number }).statusCode = 409;
    throw conflictErr;
  }

  // 2. Atomic Lock Acquisition: Transition status to 'processing' only if status is NOT 'processing'
  const { data: lockAcquired, error: lockError } = await supabaseAdmin
    .from("resumes")
    .update({ status: "processing" })
    .eq("id", resumeId)
    .neq("status", "processing")
    .select("id")
    .maybeSingle();

  if (lockError || !lockAcquired) {
    console.log(
      `[ANALYSIS:LOCK_CONTENTION] Lock acquisition contended for resume ${resumeId}. Waiting for concurrent execution...`,
    );
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const { data: pollResume } = await supabaseAdmin
        .from("resumes")
        .select("status")
        .eq("id", resumeId)
        .maybeSingle();

      if (pollResume?.status === "completed") {
        const cached = await getCachedCompletedAnalysis(resumeId);
        if (cached) return cached;
      }
    }
    const conflictErr = new Error(
      "Analisis resume sedang diproses secara paralel. Mohon tunggu sejenak.",
    );
    (conflictErr as unknown as { statusCode: number }).statusCode = 409;
    throw conflictErr;
  }

  try {
    // 3. Extract profile using AI model with fallback resilience
    const aiCandidateData = await extractCandidateProfile(rawText);

    // 4. Persist analysis record with accurate model lineage and prompt version
    const actualModelUsed = aiCandidateData._modelUsed || MODEL_NAME;
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("resume_analysis")
      .insert({
        resume_id: resumeId,
        model_version: actualModelUsed,
        prompt_version: PROFILE_EXTRACTOR_PROMPT_VERSION,
        candidate_data: aiCandidateData.json_profile,
        extracted_skills: aiCandidateData.extracted_skills,
      })
      .select("id")
      .single();

    if (analysisError) throw analysisError;
    const analysisId = analysisData.id;

    // 5. Sanitize skills and retrieve relevant job opportunities (strictly active roles)
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
        .eq("is_active", true) // Reliability P1: Only query currently active opportunities
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

    // 6. Perform Job Matching with Graceful Degradation fallback
    let matchedJobsWithDetails: MatchedJobItem[] = [];

    if (topJobs && topJobs.length > 0) {
      let matchResults;

      try {
        matchResults = await analyzeJobMatches(
          aiCandidateData.json_profile,
          topJobs,
        );
      } catch (matchingError) {
        console.warn(
          "[ANALYSIS:DEGRADED_MODE] AI job matching failed, applying deterministic fallback:",
          matchingError,
        );

        // Graceful Degradation: Compute deterministic match score based on skill overlap
        const candidateSkillSet = new Set(
          (aiCandidateData.extracted_skills || []).map((s) =>
            s.toLowerCase().trim(),
          ),
        );

        matchResults = topJobs.map((job) => {
          const jobReqs = (job.requirements || []).map((r) =>
            r.toLowerCase().trim(),
          );
          const matchedCount = jobReqs.filter((r) =>
            candidateSkillSet.has(r),
          ).length;
          const overlapRatio =
            jobReqs.length > 0 ? matchedCount / jobReqs.length : 0.5;
          const score = Math.round(55 + overlapRatio * 35); // 55 - 90
          const missing = (job.requirements || []).filter(
            (r) => !candidateSkillSet.has(r.toLowerCase().trim()),
          );

          return {
            job_id: job.id,
            score,
            reason: `Kecocokan dihitung berdasarkan keselarasan keahlian (${matchedCount} dari ${jobReqs.length} kualifikasi terpenuhi).`,
            missing_skills: missing.slice(0, 3),
          };
        });
      }

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

    // 7. Bootstrap conversational session if session_id is provided
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

    // 8. Mark resume as completed
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
    // 9. Rollback status to failed upon unrecoverable workflow interruption
    await supabaseAdmin
      .from("resumes")
      .update({ status: "failed" })
      .eq("id", resumeId);

    throw error;
  }
}
