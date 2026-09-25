import { describe, it, expect } from "vitest";
import {
  RemotiveJobSchema,
  RemotiveApiResponseSchema,
} from "@/features/jobs/sources/remotive/remotive.schema";

describe("Unit: Remotive Schema Validation", () => {
  const validJob = {
    id: 12345,
    url: "https://remotive.com/remote-jobs/dev/senior-fullstack-12345",
    title: "Senior Fullstack Engineer",
    company_name: "Acme Tech",
    company_logo: "https://remotive.com/job/12345/logo",
    category: "Software Development",
    tags: ["typescript", "react", "node"],
    job_type: "full_time",
    publication_date: "2026-09-24T10:00:00",
    candidate_required_location: "Worldwide",
    salary: "$120,000 - $150,000",
    description: "<p>We are seeking a senior engineer...</p>",
  };

  it("should successfully validate and coerce a complete Remotive job", () => {
    const parsed = RemotiveJobSchema.parse(validJob);
    expect(parsed.id).toBe(12345);
    expect(parsed.title).toBe("Senior Fullstack Engineer");
    expect(parsed.company_name).toBe("Acme Tech");
    expect(parsed.tags).toEqual(["typescript", "react", "node"]);
  });

  it("should coerce string IDs to numbers", () => {
    const jobWithStringId = { ...validJob, id: "98765" };
    const parsed = RemotiveJobSchema.parse(jobWithStringId);
    expect(parsed.id).toBe(98765);
  });

  it("should apply sensible defaults for optional or missing fields", () => {
    const minimalJob = {
      id: 555,
      url: "https://remotive.com/remote-jobs/555",
      title: "Designer",
      company_name: "Studio X",
    };

    const parsed = RemotiveJobSchema.parse(minimalJob);
    expect(parsed.id).toBe(555);
    expect(parsed.company_logo).toBeNull();
    expect(parsed.tags).toEqual([]);
    expect(parsed.candidate_required_location).toBe("Remote");
    expect(parsed.salary).toBe("");
    expect(parsed.description).toBe("");
  });

  it("should validate the complete Remotive API response envelope", () => {
    const fullResponse = {
      "0-legal-notice": "Legal terms...",
      "job-count": 2,
      jobs: [validJob, { ...validJob, id: 67890, title: "Backend Dev" }],
    };

    const parsed = RemotiveApiResponseSchema.parse(fullResponse);
    expect(parsed.jobs.length).toBe(2);
    expect(parsed["job-count"]).toBe(2);
    expect(parsed["0-legal-notice"]).toContain("Legal terms");
  });

  it("should tolerate empty or missing jobs gracefully", () => {
    const emptyResponse = {
      "job-count": 0,
    };

    const parsed = RemotiveApiResponseSchema.parse(emptyResponse);
    expect(parsed.jobs).toEqual([]);
  });

  it("should reject invalid URL format", () => {
    const invalidUrlJob = {
      ...validJob,
      url: "not-a-valid-url",
    };

    expect(() => RemotiveJobSchema.parse(invalidUrlJob)).toThrow();
  });
});
