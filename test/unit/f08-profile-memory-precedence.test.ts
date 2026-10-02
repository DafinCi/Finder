import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchingOrchestratorService } from "@/features/matching/services/matching-orchestrator.service";
import { CareerProfile } from "@/features/profile/types/career-profile.types";
import { CareerMemory } from "@/features/memory/types/memory.types";

describe("Regression: F-08 - CareerProfile vs Memory Precedence", () => {
  let mockProfileService: any;
  let mockFeedbackRepo: any;
  let mockDbClient: any;
  let mockMemoryService: any;
  let service: MatchingOrchestratorService;

  const baseProfile: CareerProfile = {
    id: "prof-001",
    userId: "user-001",
    resumeId: null,
    status: "active",
    onboardingCompleted: true,
    currentOnboardingStep: 4,
    profileVersion: 2,
    profileOrigin: "web",
    background: { education: [], experience: [], projects: [] },
    capabilities: {
      extraction_status: "success",
      skills: [
        {
          skill: "react",
          category: "core",
          confirmation_state: "confirmed",
          provenance: { source: "user_confirmed", confidence: 1.0, updated_at: "2026-09-28" },
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
      locations: ["Berlin", "London"],
      work_modes: ["hybrid"], // Explicit current profile preference
      priorities: [],
      salary: { min_amount: 80000, currency: "USD" },
      negative_preferences: [],
    },
    constraints: {
      relocation_prohibited: false,
      work_mode_strict: false,
    },
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleJobs = [
    {
      id: "job-hybrid-1",
      title: "Frontend Developer",
      company_name: "Berlin Tech GmbH",
      company_logo: null,
      description: "Great hybrid role in Berlin office 2 days a week.",
      requirements: ["React"],
      location: "Berlin, Germany (Hybrid)",
      experience_level: "Mid-Level",
      is_active: true,
      salary_min: 85000,
      salary_max: 95000,
      salary_currency: "USD",
      salary_range: "$85,000 - $95,000",
      posted_at: new Date().toISOString(),
    },
    {
      id: "job-remote-2",
      title: "Frontend Developer",
      company_name: "Cloud Corp",
      company_logo: null,
      description: "100% remote frontend position.",
      requirements: ["React"],
      location: "Remote",
      experience_level: "Mid-Level",
      is_active: true,
      salary_min: 90000,
      salary_max: 100000,
      salary_currency: "USD",
      salary_range: "$90,000 - $100,000",
      posted_at: new Date().toISOString(),
    },
  ];

  const remoteOnlyMemory: CareerMemory = {
    id: "mem-remote-only",
    profileId: "prof-001",
    category: "work_preference",
    content: "Candidate strictly wants 100% remote roles only",
    source: "explicit_user",
    confidence: "high",
    status: "active",
    walrusStatus: "stored",
    walrusBlobId: "blob-remote-only",
    walrusObjectId: null,
    metadata: {},
    createdAt: "2026-09-01T00:00:00Z", // Older historical memory
    updatedAt: "2026-09-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockProfileService = {
      requireProfile: vi.fn(),
      getActiveProfile: vi.fn(),
      saveProfile: vi.fn(),
    };

    mockFeedbackRepo = {
      getExcludedJobIds: vi.fn().mockResolvedValue(new Set()),
    };

    mockDbClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: sampleJobs,
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

  it("Case A: Current confirmed profile preference wins over older memory", async () => {
    // Current profile specifies hybrid; memory specifies remote-only
    const profile = {
      ...baseProfile,
      preferences: {
        ...baseProfile.preferences,
        work_modes: ["hybrid"],
      },
      constraints: {
        ...baseProfile.constraints,
        work_mode_strict: false,
      },
    };
    mockProfileService.requireProfile.mockResolvedValue(profile);
    mockProfileService.getActiveProfile.mockResolvedValue(profile);

    mockMemoryService.getActiveMemories.mockResolvedValue([remoteOnlyMemory]);

    const results = await service.matchJobsForProfile("user-001", { limit: 10 });
    const matchedJobIds = results.map((r) => r.job_id);

    // Hybrid job must NOT be eliminated by historical remote-only memory!
    expect(matchedJobIds).toContain("job-hybrid-1");
  });

  it("Case B: Profile has unset work modes - memory fallback applies", async () => {
    // Current profile has empty work_modes
    const profile = {
      ...baseProfile,
      preferences: {
        ...baseProfile.preferences,
        work_modes: [], // Unset/empty
      },
      constraints: {
        ...baseProfile.constraints,
        work_mode_strict: false,
      },
    };
    mockProfileService.requireProfile.mockResolvedValue(profile);
    mockProfileService.getActiveProfile.mockResolvedValue(profile);

    mockMemoryService.getActiveMemories.mockResolvedValue([remoteOnlyMemory]);

    const results = await service.matchJobsForProfile("user-001", { limit: 10 });
    const matchedJobIds = results.map((r) => r.job_id);

    // Because profile was unstated, memory remote-only takes effect and eliminates hybrid job
    expect(matchedJobIds).toContain("job-remote-2");
    expect(matchedJobIds).not.toContain("job-hybrid-1");
  });

  it("Case C: Newer explicit profile update (onsite/hybrid) remains authoritative", async () => {
    const profile = {
      ...baseProfile,
      preferences: {
        ...baseProfile.preferences,
        work_modes: ["onsite", "hybrid"],
      },
    };
    mockProfileService.requireProfile.mockResolvedValue(profile);
    mockProfileService.getActiveProfile.mockResolvedValue(profile);

    mockMemoryService.getActiveMemories.mockResolvedValue([remoteOnlyMemory]);

    const results = await service.matchJobsForProfile("user-001", { limit: 10 });
    const matchedJobIds = results.map((r) => r.job_id);

    expect(matchedJobIds).toContain("job-hybrid-1");
  });

  it("Case D: Running matching must not persist memory overrides into career_profiles", async () => {
    mockProfileService.requireProfile.mockResolvedValue(baseProfile);
    mockProfileService.getActiveProfile.mockResolvedValue(baseProfile);
    mockMemoryService.getActiveMemories.mockResolvedValue([remoteOnlyMemory]);

    await service.matchJobsForProfile("user-001", { limit: 10 });

    // saveProfile must never be called during read-only recommendation generation
    expect(mockProfileService.saveProfile).not.toHaveBeenCalled();
  });
});
