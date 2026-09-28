import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchingOrchestratorService } from "@/features/matching/services/matching-orchestrator.service";
import { CareerProfile } from "@/features/profile/types/career-profile.types";

describe("Unit: MatchingOrchestratorService", () => {
  let mockProfileService: any;
  let mockFeedbackRepo: any;
  let mockDbClient: any;
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
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockProfileService = {
      requireProfile: vi.fn().mockResolvedValue(sampleProfile),
    };

    mockFeedbackRepo = {
      // Exclude j-rejected-2
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

    service = new MatchingOrchestratorService(
      mockProfileService,
      mockFeedbackRepo,
      mockDbClient,
    );
  });

  it("should filter out rejected and non-compliant jobs and return ranked opportunities", async () => {
    const results = await service.matchJobsForProfile("u1", { limit: 5 });

    // j-rejected-2 is rejected -> filtered in Stage 1
    // j-onsite-3 is onsite while candidate has work_mode_strict=true -> filtered in Stage 1
    // Only j-top-1 should survive
    expect(results.length).toBe(1);
    expect(results[0].job_id).toBe("j-top-1");
    expect(results[0].title).toBe("Senior Frontend Developer");
    expect(results[0].match_score).toBeGreaterThan(60);
    expect(results[0].score_breakdown).toBeDefined();
    expect(results[0].qualitative.fit_rationale).toBeDefined();
  });
});
