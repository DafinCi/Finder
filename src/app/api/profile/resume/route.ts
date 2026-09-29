import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  careerProfileService,
  CvProposalPayload,
} from "@/features/profile/services/career-profile.service";
import { runResumeAnalysisWorkflow } from "@/features/ai-analysis/services/analysis-orchestrator.service";
import { CapabilityItem } from "@/features/profile/types/career-profile.types";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/resume
 * Retrieves active resume metadata for current profile.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 },
      );
    }

    const profile = await careerProfileService.getProfile(user.id);
    if (!profile || !profile.resumeId) {
      return NextResponse.json({ resume: null }, { status: 200 });
    }

    const { data: resumeRecord } = await supabaseAdmin
      .from("resumes")
      .select("id, file_name, uploaded_at, status, walrus_blob_id")
      .eq("id", profile.resumeId)
      .maybeSingle();

    return NextResponse.json({ resume: resumeRecord || null }, { status: 200 });
  } catch (err: unknown) {
    console.error("[API:ProfileResume:GET]", err);
    return NextResponse.json(
      { error: "Failed to load resume details." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/profile/resume
 * Applies an uploaded resume to the career profile.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { resumeId, expected_version } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: "resumeId is required." },
        { status: 400 },
      );
    }

    const { data: resumeRecord, error: resumeError } = await supabaseAdmin
      .from("resumes")
      .select("id, profile_id, raw_text, file_name")
      .eq("id", resumeId)
      .maybeSingle();

    if (resumeError || !resumeRecord || resumeRecord.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Resume document not found or access forbidden." },
        { status: 404 },
      );
    }

    let analysisResult: any;
    const { data: existingAnalysis } = await supabaseAdmin
      .from("resume_analysis")
      .select("candidate_data, extracted_skills")
      .eq("resume_id", resumeId)
      .maybeSingle();

    if (existingAnalysis) {
      analysisResult = {
        analysis: existingAnalysis.candidate_data,
      };
    } else {
      const rawText = resumeRecord.raw_text?.trim() || "";
      if (rawText.length >= 50) {
        analysisResult = await runResumeAnalysisWorkflow({
          userId: user.id,
          resumeId,
          rawText,
        });
      }
    }

    const candidate = analysisResult?.analysis?.candidate;
    const now = new Date().toISOString();

    const extractedSkills: CapabilityItem[] = [];
    if (candidate?.skills?.core) {
      for (const s of candidate.skills.core) {
        extractedSkills.push({
          skill: s,
          category: "core",
          confirmation_state: "draft",
          provenance: {
            source: "resume_extracted",
            confidence: 0.9,
            updated_at: now,
          },
        });
      }
    }
    if (candidate?.skills?.supporting) {
      for (const s of candidate.skills.supporting) {
        extractedSkills.push({
          skill: s,
          category: "supporting",
          confirmation_state: "draft",
          provenance: {
            source: "resume_extracted",
            confidence: 0.8,
            updated_at: now,
          },
        });
      }
    }

    const education = (candidate?.education || []).map((edu: any) => ({
      id: `edu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institution: edu.institution || "Unknown Institution",
      degree: edu.degree || "",
      field_of_study: "",
      graduation_year:
        edu.year && !isNaN(parseInt(edu.year, 10))
          ? parseInt(edu.year, 10)
          : null,
      provenance: {
        source: "resume_extracted" as const,
        confidence: 0.9,
        updated_at: now,
      },
    }));

    const experience = (candidate?.experience || []).map((exp: any) => ({
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      company_name: exp.company || "Company",
      role_title: exp.role || "Role",
      start_date: null,
      end_date: null,
      is_current: false,
      description_summary: exp.achievements?.join(". ") || "",
      technologies_used: [],
      provenance: {
        source: "resume_extracted" as const,
        confidence: 0.9,
        updated_at: now,
      },
    }));

    const cvProposal: CvProposalPayload = {
      resumeId,
      background: {
        education,
        experience,
        projects: [],
      },
      capabilities: {
        extraction_status: "success",
        skills: extractedSkills,
        suppressed_skills: [],
      },
    };

    const currentProfile = await careerProfileService.requireProfile(user.id);
    const versionToUse =
      typeof expected_version === "number"
        ? expected_version
        : currentProfile.profileVersion;

    const updatedProfile = await careerProfileService.applyCvProposal(
      user.id,
      cvProposal,
      versionToUse,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Resume applied and profile synchronized successfully.",
        profile: updatedProfile,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[API:ProfileResume:POST]", err);
    return NextResponse.json(
      { error: "Failed to apply resume to profile." },
      { status: 500 },
    );
  }
}
