import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getRecommendations } from "@/app/api/recommendations/route";
import { NextRequest } from "next/server";
import { ProfileNotFoundError } from "@/features/profile/errors/profile-errors";

const { mockAuthUser, mockMatchingService } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
  mockMatchingService: {
    matchJobsForProfile: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/features/matching/services/matching-orchestrator.service", () => ({
  matchingOrchestratorService: mockMatchingService,
}));

describe("Integration (Mock-Based): /api/recommendations", () => {
  const sampleUser = {
    id: "b0000000-0000-4000-8000-000000000001",
    email: "candidate@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when request is unauthenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const req = new NextRequest("http://localhost:3000/api/recommendations", {
      method: "GET",
    });
    const res = await getRecommendations(req);

    expect(res.status).toBe(401);
  });

  it("should return 404 with requiresOnboarding flag when profile does not exist", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: sampleUser },
      error: null,
    });
    mockMatchingService.matchJobsForProfile.mockRejectedValueOnce(
      new ProfileNotFoundError(sampleUser.id),
    );

    const req = new NextRequest("http://localhost:3000/api/recommendations", {
      method: "GET",
    });
    const res = await getRecommendations(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.requiresOnboarding).toBe(true);
  });

  it("should return 200 with deterministic recommendations when authenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: sampleUser },
      error: null,
    });
    mockMatchingService.matchJobsForProfile.mockResolvedValueOnce([
      {
        job_id: "j1",
        title: "Senior Frontend Engineer",
        company_name: "Starlight Corp",
        match_score: 92,
        score_breakdown: {
          final_score: 92,
          role_score: 100,
          capability_score: 90,
          preference_score: 85,
          negative_penalty: 0,
        },
        qualitative: {
          fit_rationale:
            "Strong alignment with your primary career target role.",
          missing_skills: [],
        },
      },
    ]);

    const req = new NextRequest(
      "http://localhost:3000/api/recommendations?limit=3",
      {
        method: "GET",
      },
    );
    const res = await getRecommendations(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recommendations.length).toBe(1);
    expect(data.recommendations[0].match_score).toBe(92);
    expect(mockMatchingService.matchJobsForProfile).toHaveBeenCalledWith(
      sampleUser.id,
      {
        limit: 3,
      },
    );
  });
});
