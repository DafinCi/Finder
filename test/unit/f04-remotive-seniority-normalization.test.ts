import { describe, it, expect } from "vitest";
import { remotiveJobToCanonicalJob } from "@/features/jobs/sources/remotive/remotive.adapter";
import { RemotiveRawJob } from "@/features/jobs/sources/remotive/remotive.schema";
import { computeRoleScore } from "@/features/matching/engine/stage2-scoring-engine";
import { CareerIntent } from "@/features/profile/types/career-profile.types";

describe("Regression: F-04 - Remotive Seniority Normalization", () => {
  const sampleRemotiveJob: RemotiveRawJob = {
    id: 998877,
    url: "https://remotive.com/remote-jobs/dev/lead-architect-998877",
    title: "Lead Cloud Architect",
    company_name: "Global Scale Corp",
    company_logo: "https://remotive.com/logo.png",
    company_logo_url: null,
    category: "DevOps / Sysadmin",
    tags: ["aws", "kubernetes", "terraform"],
    job_type: "full_time",
    publication_date: "2026-09-30T12:00:00",
    candidate_required_location: "Worldwide",
    salary: "$180,000 - $220,000",
    description: "<p>We are seeking an experienced architect to lead our cloud platform...</p>",
  };

  it("should set experienceLevel to null instead of fabricating Mid-Level", () => {
    const canonical = remotiveJobToCanonicalJob(sampleRemotiveJob);

    expect(canonical.experienceLevel).toBeNull();
    expect(canonical.experienceLevel).not.toBe("Mid-Level");
  });

  it("should preserve canonical job validity when experienceLevel is null", () => {
    const canonical = remotiveJobToCanonicalJob(sampleRemotiveJob);

    expect(canonical.title).toBe("Lead Cloud Architect");
    expect(canonical.companyName).toBe("Global Scale Corp");
    expect(canonical.isRemote).toBe(true);
    expect(canonical.source).toBe("remotive");
  });

  it("should not penalize Senior or Lead candidates in downstream scoring when job seniority is unknown (null)", () => {
    const leadIntent: CareerIntent = {
      target_roles: [{ role: "Lead Cloud Architect", priority: "primary" }],
      target_level: "lead",
      employment_types: ["full_time"],
    };

    // When job.experienceLevel is null (unknown), seniorityMultiplier is 1.0 (neutral full multiplier)
    const scoreUnknownSeniority = computeRoleScore(
      "Lead Cloud Architect",
      null, // Corrected canonical behavior
      leadIntent,
    );

    // If it had been incorrectly hardcoded to "Mid-Level", lead candidate (lvl 5) vs mid (lvl 3) gap = 2
    // which drops seniority multiplier to 0.65
    const scoreFabricatedMid = computeRoleScore(
      "Lead Cloud Architect",
      "Mid-Level", // Buggy legacy behavior
      leadIntent,
    );

    expect(scoreUnknownSeniority).toBe(100);
    expect(scoreFabricatedMid).toBeLessThan(100);
    expect(scoreUnknownSeniority).toBeGreaterThan(scoreFabricatedMid);
  });
});
