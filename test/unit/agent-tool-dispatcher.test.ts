import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AgentToolDispatcher,
  CompactJobSummary,
} from "@/features/agent/services/agent-tool-dispatcher.service";

describe("Phase 2: Agent Tool Layer & Dispatcher", () => {
  let dispatcher: AgentToolDispatcher;
  let mockMatchingService: any;
  let mockFeedbackRepo: any;
  let mockMemoryService: any;
  let mockSupabase: any;

  const TEST_PROFILE_ID = "profile-uuid-001";
  const TEST_JOB_ID = "c1000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    mockMatchingService = {
      matchJobsForProfile: vi.fn().mockResolvedValue([
        {
          job_id: TEST_JOB_ID,
          title: "Senior Frontend Engineer",
          company_name: "Acme Corp",
          company_logo: null,
          location: "Remote",
          work_mode: "remote",
          salary_range: "$4,000 - $6,000",
          match_score: 92,
          score_breakdown: {
            final_score: 92,
            role_score: 90,
            capability_score: 95,
            preference_score: 90,
            negative_penalty: 0,
          },
          qualitative: {
            fit_rationale: "Matches React and Next.js experience",
            missing_skills: ["GraphQL"],
          },
          apply_url: "https://example.com/apply",
          posted_at: "2026-09-30T00:00:00Z",
        },
      ]),
    };

    mockFeedbackRepo = {
      saveJob: vi.fn().mockResolvedValue({
        id: "saved-1",
        profileId: TEST_PROFILE_ID,
        jobId: TEST_JOB_ID,
      }),
      recordFeedback: vi.fn().mockResolvedValue({
        id: "event-1",
        profileId: TEST_PROFILE_ID,
        jobId: TEST_JOB_ID,
      }),
    };

    mockMemoryService = {
      rememberFact: vi.fn().mockResolvedValue({
        id: "mem-1",
        profileId: TEST_PROFILE_ID,
        category: "career_goal",
        content: "Transitioning to AI Engineering",
        status: "active",
        walrusStatus: "pending",
      }),
    };

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "jobs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: TEST_JOB_ID,
                    title: "Senior Frontend Engineer",
                    company_name: "Acme Corp",
                    description: "Full lengthy description text with responsibilities and benefits...",
                    requirements: ["5+ years React", "TypeScript"],
                    location: "Remote",
                    work_mode: "remote",
                    job_type: "full_time",
                    salary_range: "$4,000 - $6,000",
                    apply_url: "https://example.com/apply",
                    posted_at: "2026-09-30T00:00:00Z",
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      }),
    };

    dispatcher = new AgentToolDispatcher(
      mockMatchingService,
      mockFeedbackRepo,
      mockMemoryService,
      mockSupabase,
    );
  });

  describe("1. Security & Authentication Boundary", () => {
    it("should reject tool execution if profileId is missing or empty", async () => {
      const result = await dispatcher.executeTool(
        "",
        "get_career_recommendations",
        {},
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockMatchingService.matchJobsForProfile).not.toHaveBeenCalled();
    });

    it("should gracefully handle unrecognized tool names without crashing", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "unauthorized_tool_delete_database",
        {},
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unrecognized tool");
    });
  });

  describe("2. get_career_recommendations (Compact Token Projection)", () => {
    it("should execute recommendation engine and return compact job summary without raw descriptions", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "get_career_recommendations",
        {
          targetRoles: ["Frontend Engineer"],
          workMode: ["remote"],
          excludeTechnologies: ["Angular"],
        },
      );

      expect(result.success).toBe(true);
      expect(mockMatchingService.matchJobsForProfile).toHaveBeenCalledWith(
        TEST_PROFILE_ID,
        {
          limit: 3,
          overrideFilters: {
            targetRoles: ["Frontend Engineer"],
            workMode: ["remote"],
            minSalary: undefined,
            excludeTechnologies: ["Angular"],
          },
        },
      );

      const data = result.data as { totalFound: number; recommendations: CompactJobSummary[] };
      expect(data.totalFound).toBe(1);
      const job = data.recommendations[0];
      expect(job.title).toBe("Senior Frontend Engineer");
      expect(job.matchScore).toBe(92);
      expect(job.fitRationale).toBe("Matches React and Next.js experience");
      expect(job.missingSkills).toEqual(["GraphQL"]);
      // Crucial: No description field in compact projection
      expect((job as any).description).toBeUndefined();
    });

    it("should parse stringified JSON rawArgs automatically", async () => {
      const jsonArgs = JSON.stringify({ workMode: ["remote"], limit: 2 });
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "get_career_recommendations",
        jsonArgs,
      );

      expect(result.success).toBe(true);
      expect(mockMatchingService.matchJobsForProfile).toHaveBeenCalledWith(
        TEST_PROFILE_ID,
        expect.objectContaining({ limit: 2 }),
      );
    });
  });

  describe("3. inspect_job_details (On-Demand Drill-Down)", () => {
    it("should fetch complete job details for a specific UUID", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "inspect_job_details",
        { jobId: TEST_JOB_ID },
      );

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.id).toBe(TEST_JOB_ID);
      expect(data.description).toContain("Full lengthy description text");
      expect(data.requirements).toHaveLength(2);
    });

    it("should fail validation if jobId is not a valid UUID", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "inspect_job_details",
        { jobId: "invalid-not-a-uuid" },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid job ID format");
    });
  });

  describe("4. save_job & reject_job (Feedback Actions)", () => {
    it("should call feedbackRepo.saveJob on save_job tool call", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "save_job",
        { jobId: TEST_JOB_ID, notes: "Looks like a great React role" },
      );

      expect(result.success).toBe(true);
      expect(mockFeedbackRepo.saveJob).toHaveBeenCalledWith(
        TEST_PROFILE_ID,
        TEST_JOB_ID,
        "Looks like a great React role",
      );
    });

    it("should call feedbackRepo.recordFeedback with validated enum on reject_job", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "reject_job",
        { jobId: TEST_JOB_ID, reason: "too_senior", notes: "Requires 10 years experience" },
      );

      expect(result.success).toBe(true);
      expect(mockFeedbackRepo.recordFeedback).toHaveBeenCalledWith(
        TEST_PROFILE_ID,
        TEST_JOB_ID,
        "reject",
        "too_senior",
        { notes: "Requires 10 years experience" },
      );
    });

    it("should reject invalid feedback reason with clear validation error", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "reject_job",
        { jobId: TEST_JOB_ID, reason: "not_valid_enum_reason" },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("5. remember_fact & propose_preference_update", () => {
    it("should call memoryService.rememberFact and return memoryUpdated event payload", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "remember_fact",
        {
          category: "career_goal",
          content: "Transitioning to AI Engineering",
          confidence: "high",
        },
      );

      expect(result.success).toBe(true);
      expect(mockMemoryService.rememberFact).toHaveBeenCalledWith(
        TEST_PROFILE_ID,
        {
          category: "career_goal",
          content: "Transitioning to AI Engineering",
          confidence: "high",
          source: "explicit_user",
        },
      );
      expect(result.memoryUpdated).toBeDefined();
      expect(result.memoryUpdated?.content).toBe("Transitioning to AI Engineering");
    });

    it("should construct an Action Proposal Card without mutating database directly", async () => {
      const result = await dispatcher.executeTool(
        TEST_PROFILE_ID,
        "propose_preference_update",
        {
          workMode: ["remote", "hybrid"],
          summary: "Perbarui preferensi kerja menjadi Remote & Hybrid",
        },
      );

      expect(result.success).toBe(true);
      expect(result.actionProposal).toBeDefined();
      expect(result.actionProposal?.summary).toBe("Perbarui preferensi kerja menjadi Remote & Hybrid");
      expect(result.actionProposal?.proposedChanges.workMode).toEqual(["remote", "hybrid"]);
    });
  });
});
