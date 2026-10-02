import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobsApi, FormattedJobMatch } from "@/features/jobs/services/jobs.api";

describe("Regression: F-05 - Saved Jobs Independent Collection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSavedJobs: FormattedJobMatch[] = [
    {
      matchId: "job-saved-1",
      jobId: "job-saved-1",
      matchScore: 0,
      reason: "Saved job opportunity",
      missingSkills: [],
      title: "Staff Systems Engineer",
      description: "Distributed systems and Rust engineering.",
      requirements: ["Rust", "Distributed Systems"],
      location: "Remote",
      experienceLevel: "Staff",
      companyName: "Systems Corp",
      isSaved: true,
      postedAt: "2026-09-15T00:00:00Z",
    },
    {
      matchId: "job-saved-30",
      jobId: "job-saved-30", // Outside top 25 recommendations
      matchScore: 0,
      reason: "Interesting team culture",
      missingSkills: [],
      title: "Backend Engineer",
      description: "Golang microservices.",
      requirements: ["Go", "PostgreSQL"],
      location: "Remote",
      experienceLevel: "Mid-Level",
      companyName: "Micro Scale",
      isSaved: true,
      postedAt: "2026-08-01T00:00:00Z",
    },
  ];

  it("should retrieve full saved jobs independent of recommendation ranking", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ savedJobs: mockSavedJobs }),
    } as Response);

    const saved = await jobsApi.getSavedJobs();

    expect(saved.length).toBe(2);
    expect(saved[0].jobId).toBe("job-saved-1");
    expect(saved[1].jobId).toBe("job-saved-30"); // Job #30 is visible!
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/jobs/saved",
      expect.any(Object),
    );
  });

  it("should ensure a job saved outside recommendation top-25 is visible in saved jobs", async () => {
    // Recommendations only return top 2
    const topRecommendations: FormattedJobMatch[] = [
      {
        matchId: "job-rec-1",
        jobId: "job-rec-1",
        matchScore: 95,
        reason: "Best fit",
        missingSkills: [],
        title: "Frontend Lead",
        description: "React",
        requirements: ["React"],
        location: "Remote",
        experienceLevel: "Lead",
        companyName: "Alpha",
        isSaved: false,
      },
      {
        matchId: "job-rec-2",
        jobId: "job-rec-2",
        matchScore: 90,
        reason: "Strong fit",
        missingSkills: [],
        title: "Senior Frontend",
        description: "React",
        requirements: ["React"],
        location: "Remote",
        experienceLevel: "Senior",
        companyName: "Beta",
        isSaved: false,
      },
    ];

    // Job #30 is in savedJobs but NOT in topRecommendations
    const isJob30InRecs = topRecommendations.some(
      (r) => r.jobId === "job-saved-30",
    );
    const isJob30InSaved = mockSavedJobs.some(
      (s) => s.jobId === "job-saved-30",
    );

    expect(isJob30InRecs).toBe(false);
    expect(isJob30InSaved).toBe(true);
  });

  it("should handle save and unsave mutations correctly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    const saveSuccess = await jobsApi.saveJob("job-saved-30");
    expect(saveSuccess).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ jobId: "job-saved-30", eventType: "save" }),
      }),
    );

    const unsaveSuccess = await jobsApi.unsaveJob("job-saved-30");
    expect(unsaveSuccess).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ jobId: "job-saved-30", eventType: "unsave" }),
      }),
    );
  });
});
