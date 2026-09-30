// ==============================================================================
// SERVICE: Agent Tool Dispatcher (Security, Orchestration & Compact Projection)
// Module: @/features/agent/services/agent-tool-dispatcher.service
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  MatchingOrchestratorService,
  matchingOrchestratorService,
} from "@/features/matching/services/matching-orchestrator.service";
import {
  FeedbackRepository,
  feedbackRepository,
} from "@/features/feedback/repositories/feedback.repository";
import {
  CareerMemoryService,
  careerMemoryService,
} from "@/features/memory/services/career-memory.service";
import {
  GetRecommendationsInputSchema,
  InspectJobDetailsInputSchema,
  SaveJobInputSchema,
  RejectJobInputSchema,
  RememberFactInputSchema,
  ProposePreferenceUpdateInputSchema,
  ReadCandidateCvInputSchema,
  GetRecommendationsInput,
  InspectJobDetailsInput,
  SaveJobInput,
  RejectJobInput,
  RememberFactInput,
  ProposePreferenceUpdateInput,
  ReadCandidateCvInput,
} from "../schemas/agent-tools.schema";
import { RecommendedJobOpportunity } from "@/features/matching/types/matching.types";

export interface CompactJobSummary {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  jobType: string | null;
  salaryRange: string | null;
  matchScore: number;
  fitRationale: string;
  keyMatchingSkills: string[];
  missingSkills: string[];
  applyUrl: string | null;
}

export interface ActionProposalData {
  type: "preference_update";
  proposedChanges: {
    workMode?: ("remote" | "hybrid" | "onsite")[];
    targetRoles?: string[];
    targetLevel?: string;
  };
  summary: string;
  status?: "proposed" | "applied" | "rejected";
}

export interface AgentToolResult {
  success: boolean;
  toolName: string;
  data?: unknown;
  error?: string;
  actionProposal?: ActionProposalData;
  memoryUpdated?: {
    id: string;
    category: string;
    content: string;
    walrusStatus: string;
  };
}

export class AgentToolDispatcher {
  constructor(
    private readonly matchingService: MatchingOrchestratorService = matchingOrchestratorService,
    private readonly feedbackRepo: FeedbackRepository = feedbackRepository,
    private readonly memoryService: CareerMemoryService = careerMemoryService,
    private readonly client: any = supabaseAdmin,
  ) {}

  /**
   * Central dispatcher that routes LLM tool calls to strictly-typed domain services.
   * Enforces server authentication context (profileId), argument validation, and compact outputs.
   */
  async executeTool(
    profileId: string,
    toolName: string,
    rawArgs: unknown,
  ): Promise<AgentToolResult> {
    if (!profileId || typeof profileId !== "string") {
      return {
        success: false,
        toolName,
        error: "Unauthorized. Missing valid profile identity.",
      };
    }

    try {
      switch (toolName) {
        case "get_career_recommendations": {
          const validated = GetRecommendationsInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs || {},
          );
          return await this.dispatchRecommendations(profileId, validated);
        }

        case "inspect_job_details": {
          const validated = InspectJobDetailsInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs,
          );
          return await this.dispatchInspectJob(validated);
        }

        case "save_job": {
          const validated = SaveJobInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs,
          );
          return await this.dispatchSaveJob(profileId, validated);
        }

        case "reject_job": {
          const validated = RejectJobInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs,
          );
          return await this.dispatchRejectJob(profileId, validated);
        }

        case "remember_fact": {
          const validated = RememberFactInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs,
          );
          return await this.dispatchRememberFact(profileId, validated);
        }

        case "propose_preference_update": {
          const validated = ProposePreferenceUpdateInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs,
          );
          return this.dispatchProposePreference(validated);
        }

        case "read_candidate_cv": {
          const validated = ReadCandidateCvInputSchema.parse(
            typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs || {},
          );
          return await this.dispatchReadCandidateCv(profileId, validated);
        }

        default:
          return {
            success: false,
            toolName,
            error: `Unrecognized tool: '${toolName}'. Supported tools: get_career_recommendations, inspect_job_details, save_job, reject_job, remember_fact, propose_preference_update, read_candidate_cv.`,
          };
      }
    } catch (err) {
      console.warn(`[AgentToolDispatcher] Error executing ${toolName}:`, err);
      return {
        success: false,
        toolName,
        error: (err as Error).message || "Tool execution failed.",
      };
    }
  }

  /**
   * Fetches deterministically scored jobs and projects them into Compact Job Summaries (~120 tokens/job)
   * to conserve Groq TPM context window (Blind Spot 2 Mitigation).
   */
  private async dispatchRecommendations(
    profileId: string,
    args: GetRecommendationsInput,
  ): Promise<AgentToolResult> {
    const opportunities = await this.matchingService.matchJobsForProfile(
      profileId,
      {
        limit: args.limit || 3,
        overrideFilters: {
          targetRoles: args.targetRoles,
          workMode: args.workMode,
          minSalary: args.minSalary,
          excludeTechnologies: args.excludeTechnologies,
        },
      },
    );

    const compactResults: CompactJobSummary[] = opportunities.map(
      (opp: RecommendedJobOpportunity) => ({
        id: opp.job_id,
        title: opp.title,
        company: opp.company_name,
        location: opp.location,
        workMode: opp.work_mode,
        jobType: null,
        salaryRange: opp.salary_range,
        matchScore: opp.match_score,
        fitRationale: opp.qualitative.fit_rationale,
        keyMatchingSkills: [],
        missingSkills: opp.qualitative.missing_skills,
        applyUrl: opp.apply_url,
      }),
    );

    return {
      success: true,
      toolName: "get_career_recommendations",
      data: {
        totalFound: compactResults.length,
        recommendations: compactResults,
      },
    };
  }

  /**
   * Fetches full job details on-demand when user asks specific questions about 1 job.
   */
  private async dispatchInspectJob(
    args: InspectJobDetailsInput,
  ): Promise<AgentToolResult> {
    const { data: job, error } = await this.client
      .from("jobs")
      .select("*")
      .eq("id", args.jobId)
      .maybeSingle();

    if (error || !job) {
      return {
        success: false,
        toolName: "inspect_job_details",
        error: `Job with ID '${args.jobId}' was not found or is no longer active.`,
      };
    }

    return {
      success: true,
      toolName: "inspect_job_details",
      data: {
        id: job.id,
        title: job.title,
        companyName: job.company_name,
        companyLogo: job.company_logo,
        location: job.location,
        workMode: job.work_mode,
        jobType: job.job_type,
        salaryRange: job.salary_range,
        experienceLevel: job.experience_level,
        description: job.description,
        requirements: job.requirements || [],
        applyUrl: job.apply_url,
        postedAt: job.posted_at,
      },
    };
  }

  /**
   * Saves a job to candidate bookmarks and logs feedback event.
   */
  private async dispatchSaveJob(
    profileId: string,
    args: SaveJobInput,
  ): Promise<AgentToolResult> {
    const saved = await this.feedbackRepo.saveJob(
      profileId,
      args.jobId,
      args.notes,
    );

    return {
      success: true,
      toolName: "save_job",
      data: {
        savedJobId: saved.id,
        jobId: saved.jobId,
        message: "Job has been saved to your saved opportunities.",
      },
    };
  }

  /**
   * Records negative feedback and excludes job from future matches.
   */
  private async dispatchRejectJob(
    profileId: string,
    args: RejectJobInput,
  ): Promise<AgentToolResult> {
    await this.feedbackRepo.recordFeedback(
      profileId,
      args.jobId,
      "reject",
      args.reason,
      args.notes ? { notes: args.notes } : {},
    );

    return {
      success: true,
      toolName: "reject_job",
      data: {
        jobId: args.jobId,
        reason: args.reason,
        message:
          "Job dismissed and automatically excluded from future recommendations.",
      },
    };
  }

  /**
   * Persists a durable fact into sovereign memory with deduplication and async Walrus backup.
   */
  private async dispatchRememberFact(
    profileId: string,
    args: RememberFactInput,
  ): Promise<AgentToolResult> {
    const memory = await this.memoryService.rememberFact(profileId, {
      category: args.category,
      content: args.content,
      confidence: args.confidence || "high",
      source: "explicit_user",
    });

    return {
      success: true,
      toolName: "remember_fact",
      data: {
        memoryId: memory.id,
        category: memory.category,
        content: memory.content,
        walrusStatus: memory.walrusStatus,
        message: "Fact saved to sovereign career memory and syncing to Walrus.",
      },
      memoryUpdated: {
        id: memory.id,
        category: memory.category,
        content: memory.content,
        walrusStatus: memory.walrusStatus,
      },
    };
  }

  /**
   * Generates an Action Proposal payload without mutating database directly.
   * User confirms via interactive card in chat (Human-in-the-Loop).
   */
  private dispatchProposePreference(
    args: ProposePreferenceUpdateInput,
  ): AgentToolResult {
    const proposedChanges = {
      workMode: args.workMode,
      targetRoles: args.targetRoles,
      targetLevel: args.targetLevel,
    };

    return {
      success: true,
      toolName: "propose_preference_update",
      data: {
        proposedChanges,
        summary: args.summary,
        requiresUserConfirmation: true,
      },
      actionProposal: {
        type: "preference_update",
        proposedChanges,
        summary: args.summary,
      },
    };
  }

  /**
   * Reads and projects candidate CV/profile data with safe truncation.
   * Protects Groq TPM window while providing deep CV inspection.
   */
  private async dispatchReadCandidateCv(
    profileId: string,
    args: ReadCandidateCvInput,
  ): Promise<AgentToolResult> {
    const [profileRes, resumeRes] = await Promise.all([
      this.client
        .from("career_profiles")
        .select("background, capabilities, career_intent, preferences, resume_id")
        .eq("profile_id", profileId)
        .maybeSingle(),
      this.client
        .from("resumes")
        .select("id, file_name, raw_text, uploaded_at")
        .eq("profile_id", profileId)
        .neq("status", "failed")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const profileData = profileRes.data;
    const resumeData = resumeRes.data;

    if (!profileData && !resumeData) {
      return {
        success: false,
        toolName: "read_candidate_cv",
        error: "Kandidat belum mengunggah dokumen CV atau melengkapi profil karir di sistem.",
      };
    }

    const section = args.section || "full";
    const result: Record<string, unknown> = {
      fileName: resumeData?.file_name || "canonical_profile",
      section,
    };

    if (section === "full" || section === "summary") {
      result.careerIntent = profileData?.career_intent || null;
      result.preferences = profileData?.preferences || null;
    }

    if (section === "full" || section === "experience") {
      result.experience = profileData?.background?.experience || [];
    }

    if (section === "full" || section === "skills") {
      result.skills =
        profileData?.capabilities?.skills?.map((s: any) => ({
          skill: s.skill,
          category: s.category,
          proficiency: s.proficiency_claim || "competent",
        })) || [];
    }

    if (section === "full" || section === "education") {
      result.education = profileData?.background?.education || [];
      result.projects = profileData?.background?.projects || [];
    }

    // Include safely truncated raw text excerpt if available (max 3,500 chars to safeguard Groq TPM)
    if (resumeData?.raw_text && (section === "full" || section === "summary")) {
      result.rawTextExcerpt = resumeData.raw_text.slice(0, 3500);
    }

    return {
      success: true,
      toolName: "read_candidate_cv",
      data: result,
    };
  }
}

export const agentToolDispatcher = new AgentToolDispatcher();

