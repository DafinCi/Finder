import { describe, it, expect } from "vitest";
import {
  scoreCandidateSkillsAgainstJob,
  toDeterministicMatchScore,
  buildDeterministicReason,
  DeterministicJobScore,
} from "@/features/ai-analysis/services/analysis-orchestrator.service";
import { RawJobInput } from "@/features/jobs/domain/job-matching-context";

const job: RawJobInput = {
  id: "job-1",
  title: "Frontend Engineer",
  description: "",
  requirements: ["react", "typescript", "tailwind", "graphql"],
};

describe("Deterministic match score for CV analysis path", () => {
  it("should weight core skills above supporting and general skills", () => {
    const scoring = scoreCandidateSkillsAgainstJob(
      job,
      new Set(["react", "typescript"]),
      new Set(["tailwind"]),
      new Set(["graphql"]),
    );

    // core=2 each, supporting=1.2, general=1.0 across 4 requirements
    expect(scoring.preRankingScore).toBeCloseTo((2 * 2 + 1.2 + 1) / 4);
    expect(scoring.matchedCount).toBe(4);
    expect(scoring.missingSkills).toEqual([]);
  });

  it("should list unmatched requirements as missing skills", () => {
    const scoring = scoreCandidateSkillsAgainstJob(
      job,
      new Set(["react"]),
      new Set(),
      new Set(),
    );

    expect(scoring.missingSkills).toEqual(["typescript", "tailwind", "graphql"]);
  });

  it("should normalize the pre-ranking score into an authoritative 0-100 range", () => {
    expect(toDeterministicMatchScore(0)).toBe(0);
    expect(toDeterministicMatchScore(2.0)).toBe(100);
    expect(toDeterministicMatchScore(1.0)).toBe(50);
  });

  it("should produce a deterministic rationale from score components", () => {
    const scoring: DeterministicJobScore = {
      preRankingScore: 1.5,
      matchedCount: 3,
      totalReqs: 4,
      missingSkills: ["graphql"],
    };

    expect(buildDeterministicReason(scoring)).toContain("3 of 4");
  });
});
