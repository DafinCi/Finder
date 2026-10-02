import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MatchingOrchestratorService,
  extractExclusionKeywordsFromMemories,
  extractMinSalaryFromMemories,
  isRemoteOnlyFromMemories,
} from "@/features/matching/services/matching-orchestrator.service";
import { CareerProfile } from "@/features/profile/types/career-profile.types";
import { CareerMemory } from "@/features/memory/types/memory.types";

describe("Unit: MatchingOrchestratorService", () => {
  let mockProfileService: any;
  let mockFeedbackRepo: any;
  let mockDbClient: any;
  let mockMemoryService: any;
  let service: MatchingOrchestratorService;

  const sampleProfile: CareerProfile = {
    id: "a0000000-0000-4000-8000-000000000001",
    userId: "b0000000-0000-4000-8000-000000000001",
    resumeId: null,
    status: "active",
    onboardingCompleted: true,
    currentOnboardingStep: 4,
    profileVersion: 1,
    profileOrigin: "web",
    background: { education: [], experience: [], projects: [] },
    capabilities: {
      extraction_status: "success",
      skills: [
        {
          skill: "react",
          category: "core",
          confirmation_state: "confirmed",
          provenance: {
            source: "user_confirmed",
            confidence: 1.0,
            updated_at: "2026-09-28",
          },
        },
        {
          skill: "typescript",
          category: "core",
          confirmation_state: "confirmed",
          provenance: {
            source: "user_confirmed",
            confidence: 1.0,
            updated_at: "2026-09-28",
          },
        },
      ],
      suppressed_skills: [],
    },
    careerIntent: {
      target_roles: [{ role: "Frontend Developer", priority: "primary" }],
      target_level: "mid_level",
      employment_types: ["full_time"],
    },
    preferences: {
      locations: ["Remote"],
      work_modes: ["remote"],
      priorities: ["mentorship"],
      salary: { min_amount: 60000, currency: "USD" },
      negative_preferences: [],
    },
    constraints: {
      relocation_prohibited: false,
      work_mode_strict: true,
    },
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rawJobs = [
    {
      id: "j-top-1",
      title: "Senior Frontend Developer",
      company_name: "Alpha Corp",
      company_logo: "https://example.com/alpha.png",
      description: "Mentorship and high performance React team.",
      requirements: ["React", "TypeScript"],
      location: "Remote",
      work_mode: "remote",
      job_type: "full-time",
      salary_range: "$80,000 - $100,000",
      experience_level: "Senior",
      is_active: true,
      posted_at: "2026-09-28T12:00:00Z",
    },
    {
      id: "j-rejected-2",
      title: "Frontend Developer",
      company_name: "Beta Corp",
      description: "React opportunity.",
      requirements: ["React"],
      location: "Remote",
      work_mode: "remote",
      is_active: true,
      posted_at: "2026-09-28T11:00:00Z",
    },
    {
      id: "j-onsite-3",
      title: "Frontend Developer",
      company_name: "Gamma Corp",
      description: "Office only.",
      requirements: ["React"],
      location: "Tokyo",
      work_mode: "onsite", // Fails work_mode_strict!
      is_active: true,
      posted_at: "2026-09-28T10:00:00Z",
    },
    {
      id: "j-gambling-4",
      title: "Frontend Developer",
      company_name: "Casino Tech",
      description: "Build high stakes crypto casino and gambling games.",
      requirements: ["React", "TypeScript"],
      location: "Remote",
      work_mode: "remote",
      salary_range: "$120,000",
      is_active: true,
      posted_at: "2026-09-28T09:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockProfileService = {
      requireProfile: vi.fn().mockResolvedValue(sampleProfile),
    };

    mockFeedbackRepo = {
      getExcludedJobIds: vi.fn().mockResolvedValue(new Set(["j-rejected-2"])),
    };

    mockDbClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: rawJobs,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    mockMemoryService = {
      getActiveMemories: vi.fn().mockResolvedValue([]),
    };

    service = new MatchingOrchestratorService(
      mockProfileService,
      mockFeedbackRepo,
      mockDbClient,
      mockMemoryService,
    );
  });

  it("should filter out rejected and non-compliant jobs and return ranked opportunities", async () => {
    const results = await service.matchJobsForProfile("u1", { limit: 5 });

    // j-rejected-2 is rejected -> filtered in Stage 1
    // j-onsite-3 is onsite while candidate has work_mode_strict=true -> filtered in Stage 1
    // j-top-1 and j-gambling-4 survive (no memory exclusions yet)
    expect(results.length).toBe(2);
    expect(results[0].job_id).toBe("j-top-1");
    expect(results[0].title).toBe("Senior Frontend Developer");
    expect(results[0].match_score).toBeGreaterThan(60);
    expect(results[0].score_breakdown).toBeDefined();
    expect(results[0].qualitative.fit_rationale).toBeDefined();
  });

  describe("Walrus Career Memory Constraint Enforcement", () => {
    it("should extract exclusion keywords from constraint_avoid memories", () => {
      const memories: CareerMemory[] = [
        {
          id: "m-1",
          profileId: "p1",
          category: "constraint_avoid",
          content: "Rejects Web3 gambling, casino, and betting projects",
          source: "explicit_user",
          confidence: "high",
          status: "active",
          walrusStatus: "stored",
          walrusBlobId: "b-1",
          walrusObjectId: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const exclusions = extractExclusionKeywordsFromMemories(memories);
      expect(exclusions).toContain("gambling");
      expect(exclusions).toContain("casino");
      expect(exclusions).toContain("betting");
    });

    it("should extract minimum salary requirements from memories", () => {
      const memories: CareerMemory[] = [
        {
          id: "m-2",
          profileId: "p1",
          category: "constraint_avoid",
          content: "Target salary must be at least $150k USD",
          source: "explicit_user",
          confidence: "high",
          status: "active",
          walrusStatus: "stored",
          walrusBlobId: "b-2",
          walrusObjectId: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const minSalary = extractMinSalaryFromMemories(memories);
      expect(minSalary).toBe(150000);
    });

    it("should detect remote only constraint from memories", () => {
      const memories: CareerMemory[] = [
        {
          id: "m-3",
          profileId: "p1",
          category: "work_preference",
          content: "Candidate strictly accepts 100% remote roles only",
          source: "explicit_user",
          confidence: "high",
          status: "active",
          walrusStatus: "stored",
          walrusBlobId: "b-3",
          walrusObjectId: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(isRemoteOnlyFromMemories(memories)).toBe(true);
    });

    it("should automatically filter out gambling job when Walrus memory contains anti-gambling constraint", async () => {
      mockMemoryService.getActiveMemories.mockResolvedValue([
        {
          id: "mem-anti-gambling",
          profileId: "u1",
          category: "constraint_avoid",
          content: "Rejects any work involving casino, gambling, or betting platforms",
          source: "explicit_user",
          confidence: "high",
          status: "active",
          walrusStatus: "stored",
          walrusBlobId: "blob-123",
          walrusObjectId: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      const results = await service.matchJobsForProfile("u1", { limit: 5 });

      // j-gambling-4 must be completely excluded by the Walrus memory constraint!
      const jobIds = results.map((r) => r.job_id);
      expect(jobIds).not.toContain("j-gambling-4");
      expect(jobIds).toContain("j-top-1");
      expect(results[0].qualitative.fit_rationale).toContain("Walrus career memory constraints");
    });
  });
});
