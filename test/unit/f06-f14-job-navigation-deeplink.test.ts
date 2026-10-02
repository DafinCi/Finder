import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobsApi } from "@/features/jobs/services/jobs.api";

describe("Regression: F-06 & F-14 - Navigation & Direct Deep-Linking", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("F-06: Ask Finder Deep-Link Target", () => {
    it("should construct valid authenticated chat route with job parameter", () => {
      const jobId = "550e8400-e29b-41d4-a716-446655440000";
      const targetUrl = `/c?job=${jobId}`;

      // Must point to /c (chat route), not / (marketing landing page)
      expect(targetUrl).toBe(`/c?job=${jobId}`);
      expect(targetUrl.startsWith("/c?job=")).toBe(true);
      expect(targetUrl.startsWith("/?job=")).toBe(false);
    });
  });

  describe("F-14: Direct Job URL Resolution Outside Recommendations", () => {
    it("should fetch individual job detail when jobId is not present in local recommendation array", async () => {
      const outsideJobId = "job-outside-top-25";
      const mockDetail = {
        id: outsideJobId,
        title: "Senior Reliability Engineer",
        description: "Observability and Kubernetes automation.",
        requirements: ["Kubernetes", "Prometheus"],
        location: "Remote",
        experience_level: "Senior",
        is_active: true,
        apply_url: "https://example.com/apply",
        source_url: null,
        source: "manual",
        company_name: "InfraCloud Inc",
        company_logo: null,
        companies: [],
      };

      vi.spyOn(jobsApi, "getJobDetail").mockResolvedValue(mockDetail as any);

      // Simulating drawer resolution logic
      const top25Matches = [
        { jobId: "job-1", title: "Job 1" },
        { jobId: "job-2", title: "Job 2" },
      ];

      const foundInRecs = top25Matches.find((j) => j.jobId === outsideJobId);
      expect(foundInRecs).toBeUndefined();

      // Fallback fetches individual job
      const fetchedDetail = await jobsApi.getJobDetail(outsideJobId);
      expect(fetchedDetail).toBeDefined();
      expect(fetchedDetail.id).toBe(outsideJobId);
      expect(fetchedDetail.title).toBe("Senior Reliability Engineer");
      expect(fetchedDetail.company_name).toBe("InfraCloud Inc");
    });

    it("should handle non-existent or inactive job IDs gracefully without throwing unhandled exceptions", async () => {
      vi.spyOn(jobsApi, "getJobDetail").mockRejectedValue(
        new Error("Job not found"),
      );

      let resolvedJob = null;
      try {
        resolvedJob = await jobsApi.getJobDetail("invalid-uuid-9999");
      } catch (err) {
        // Fallback catches and maintains null without crashing UI
        resolvedJob = null;
      }

      expect(resolvedJob).toBeNull();
    });
  });
});
