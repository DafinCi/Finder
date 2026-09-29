import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { jobsApi, FormattedJobMatch } from "@/features/jobs/services/jobs.api";
import { RecommendedJobOpportunity } from "@/features/matching/types/matching.types";

describe("Unit: Jobs V2 Recommendations & Feedback API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockRecommendation: RecommendedJobOpportunity = {
    job_id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Senior Full-Stack Engineer",
    company_name: "Acme Corp",
    company_logo: "https://example.com/logo.png",
    location: "Remote - Worldwide",
    work_mode: "remote",
    salary_range: "$120,000 - $150,000 / year",
    description: "Build cutting-edge decentralized systems.",
    requirements: ["TypeScript", "React", "Next.js", "PostgreSQL"],
    experience_level: "Senior",
    match_score: 86,
    score_breakdown: {
      final_score: 86,
      role_score: 90,
      capability_score: 85,
      preference_score: 88,
      negative_penalty: 0,
    },
    qualitative: {
      fit_rationale: "Strong alignment with your primary career target role.",
      missing_skills: ["Rust"],
    },
    apply_url: "https://example.com/apply",
    source_url: "https://remotive.com/job/123",
    source: "remotive",
    posted_at: "2026-09-28T10:00:00Z",
  };

  describe("getV2Recommendations", () => {
    it("should fetch recommendations, resolve saved jobs, and map correctly", async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/recommendations")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ recommendations: [mockRecommendation] }),
          });
        }
        if (url.includes("/api/feedback")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              savedJobIds: ["550e8400-e29b-41d4-a716-446655440001"],
            }),
          });
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });
      global.fetch = mockFetch;

      const result = await jobsApi.getV2Recommendations(10);

      expect(result.requiresOnboarding).toBe(false);
      expect(result.recommendations).toHaveLength(1);

      const job: FormattedJobMatch = result.recommendations[0];
      expect(job.jobId).toBe("550e8400-e29b-41d4-a716-446655440001");
      expect(job.title).toBe("Senior Full-Stack Engineer");
      expect(job.companyName).toBe("Acme Corp");
      expect(job.matchScore).toBe(86);
      expect(job.workMode).toBe("remote");
      expect(job.salaryRange).toBe("$120,000 - $150,000 / year");
      expect(job.isSaved).toBe(true);
      expect(job.scoreBreakdown?.role_score).toBe(90);
      expect(job.scoreBreakdown?.capability_score).toBe(85);
      expect(job.scoreBreakdown?.preference_score).toBe(88);
      expect(job.scoreBreakdown?.negative_penalty).toBe(0);
      expect(job.reason).toBe(
        "Strong alignment with your primary career target role.",
      );
      expect(job.missingSkills).toEqual(["Rust"]);
      expect(job.source).toBe("remotive");
      expect(job.sourceUrl).toBe("https://remotive.com/job/123");
    });

    it("should handle 404 requiresOnboarding gracefully without throwing", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Profil karir belum ditemukan.",
          requiresOnboarding: true,
        }),
      });

      const result = await jobsApi.getV2Recommendations();

      expect(result.requiresOnboarding).toBe(true);
      expect(result.recommendations).toEqual([]);
    });

    it("should throw descriptive error on 500 server error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      await expect(jobsApi.getV2Recommendations()).rejects.toThrow(
        "Internal server error",
      );
    });
  });

  describe("Feedback Actions: saveJob, unsaveJob, rejectJob", () => {
    it("should call POST /api/feedback with save event", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const success = await jobsApi.saveJob(
        "550e8400-e29b-41d4-a716-446655440001",
        "Notes",
      );

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            jobId: "550e8400-e29b-41d4-a716-446655440001",
            eventType: "save",
            metadata: { notes: "Notes" },
          }),
        }),
      );
    });

    it("should call POST /api/feedback with unsave event", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const success = await jobsApi.unsaveJob(
        "550e8400-e29b-41d4-a716-446655440001",
      );

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            jobId: "550e8400-e29b-41d4-a716-446655440001",
            eventType: "unsave",
          }),
        }),
      );
    });

    it("should call POST /api/feedback with reject event and specific reason", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const success = await jobsApi.rejectJob(
        "550e8400-e29b-41d4-a716-446655440001",
        "tech_mismatch",
      );

      expect(success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            jobId: "550e8400-e29b-41d4-a716-446655440001",
            eventType: "reject",
            reason: "tech_mismatch",
          }),
        }),
      );
    });
  });

  describe("Telemetry: recordApplyClick & recordTelemetry", () => {
    it("should record external_apply_clicked event", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      const res = await jobsApi.recordApplyClick(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      expect(res).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/feedback",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            jobId: "550e8400-e29b-41d4-a716-446655440001",
            eventType: "external_apply_clicked",
          }),
        }),
      );
    });

    it("should record drawer_view interaction telemetry with duration", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      const res = await jobsApi.recordTelemetry(
        "550e8400-e29b-41d4-a716-446655440001",
        "drawer_view",
        6500,
      );

      expect(res).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/telemetry",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"interactionType":"drawer_view"'),
        }),
      );
    });
  });
});
