import { describe, it, expect } from "vitest";
import {
  computeRoleScore,
  computeCapabilityScore,
  computePreferenceScore,
  computeNegativePreferencePenalty,
  scoreJobOpportunity,
} from "@/features/matching/engine/stage2-scoring-engine";
import {
  CareerProfile,
  CareerIntent,
  CapabilityEvidence,
  Preferences,
} from "@/features/profile/types/career-profile.types";
import { JobMatchCandidate } from "@/features/matching/engine/stage1-constraint-filter";

describe("Unit: Stage 2 Scoring Engine", () => {
  const sampleIntent: CareerIntent = {
    target_roles: [
      { role: "Frontend Engineer", priority: "primary" },
      { role: "Fullstack Developer", priority: "secondary" },
    ],
    target_level: "mid_level",
    employment_types: ["full_time"],
  };

  const sampleCapabilities: CapabilityEvidence = {
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
      {
        skill: "tailwind css",
        category: "supporting",
        confirmation_state: "confirmed",
        provenance: {
          source: "user_confirmed",
          confidence: 1.0,
          updated_at: "2026-09-28",
        },
      },
      {
        skill: "git",
        category: "tool",
        confirmation_state: "confirmed",
        provenance: {
          source: "user_confirmed",
          confidence: 1.0,
          updated_at: "2026-09-28",
        },
      },
    ],
    suppressed_skills: [],
  };

  const samplePreferences: Preferences = {
    locations: ["Remote", "Jakarta"],
    work_modes: ["remote"],
    priorities: ["modern stack", "mentorship"],
    salary: { min_amount: 80000, currency: "USD" },
    negative_preferences: [
      { domain: "tech", token: "angular", penalty_weight: 1.0 },
    ],
  };

  const sampleJob: JobMatchCandidate = {
    id: "j1",
    title: "Senior Frontend Engineer",
    company_name: "Starlight Labs",
    description:
      "We offer a modern stack and solid mentorship for our engineers.",
    requirements: ["React", "TypeScript", "Tailwind CSS"],
    location: "Remote",
    work_mode: "remote",
    experience_level: "Senior",
    salary_range: "$90,000 - $110,000",
  };

  describe("computeRoleScore", () => {
    it("should score primary target role match higher than secondary", () => {
      const primaryScore = computeRoleScore(
        "Frontend Engineer",
        "Mid-Level",
        sampleIntent,
      );
      const secondaryScore = computeRoleScore(
        "Fullstack Developer",
        "Mid-Level",
        sampleIntent,
      );
      const nonMatchScore = computeRoleScore(
        "Data Scientist",
        "Mid-Level",
        sampleIntent,
      );

      expect(primaryScore).toBe(100);
      expect(secondaryScore).toBe(70);
      expect(nonMatchScore).toBeLessThanOrEqual(10);
    });

    it("should apply seniority distance adjustment factor", () => {
      // target_level is mid_level
      const sameLevel = computeRoleScore(
        "Frontend Engineer",
        "Mid-Level",
        sampleIntent,
      );
      const diff1Level = computeRoleScore(
        "Frontend Engineer",
        "Senior",
        sampleIntent,
      );
      const diff2Level = computeRoleScore(
        "Frontend Engineer",
        "Lead / Staff",
        sampleIntent,
      );

      expect(sameLevel).toBe(100);
      expect(diff1Level).toBe(85); // 100 * 0.85
      expect(diff2Level).toBe(65); // 100 * 0.65
    });
  });

  describe("computeCapabilityScore", () => {
    it("should compute exact capability points using skill aliases and category tiers", () => {
      // Requirements: React (core: 1.0), TypeScript (core: 1.0), Tailwind CSS (supp: 0.75)
      // Total earned: 2.75 / 3.0 = 91.67% -> 92
      const result = computeCapabilityScore(
        ["react.js", "ts", "tailwind"],
        sampleCapabilities,
      );

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.missingSkills.length).toBe(0);
    });

    it("should accurately track missing skills when requirements are not met", () => {
      const result = computeCapabilityScore(
        ["React", "TypeScript", "Kubernetes", "GraphQL"],
        sampleCapabilities,
      );

      expect(result.missingSkills).toContain("Kubernetes");
      expect(result.missingSkills).toContain("GraphQL");
      expect(result.score).toBeLessThan(70);
    });
  });

  describe("computePreferenceScore & Dynamic Redistribution", () => {
    it("should dynamically redistribute weights when only some preference dimensions are stated", () => {
      const locationOnlyPref: Preferences = {
        locations: ["Remote"],
        work_modes: ["remote"],
        priorities: [], // Unstated!
        salary: null, // Unstated!
        negative_preferences: [],
      };

      // Since only location is stated, location receives 100% of preference weight
      const score = computePreferenceScore(sampleJob, locationOnlyPref);
      expect(score).toBe(100);
    });

    it("should give neutral full score (100) when no preference dimensions are stated", () => {
      const emptyPref: Preferences = {
        locations: [],
        work_modes: [],
        priorities: [],
        salary: null,
        negative_preferences: [],
      };

      const score = computePreferenceScore(sampleJob, emptyPref);
      expect(score).toBe(100);
    });

    it("should treat unstated job salary as neutral (70) and never penalize the candidate", () => {
      const salaryOnlyPref: Preferences = {
        locations: [],
        work_modes: [],
        priorities: [],
        salary: { min_amount: 100000, currency: "USD" },
        negative_preferences: [],
      };

      const unstatedSalaryJob = { ...sampleJob, salary_range: null };
      const score = computePreferenceScore(unstatedSalaryJob, salaryOnlyPref);
      expect(score).toBe(70); // Neutral score
    });
  });

  describe("computeNegativePreferencePenalty", () => {
    it("should apply severe penalty when negative token appears in job title", () => {
      const angularJob = { ...sampleJob, title: "Senior Angular Developer" };
      const penalty = computeNegativePreferencePenalty(
        angularJob,
        samplePreferences,
      );

      // Title severity: 1.0 * 10 = 10 pts
      expect(penalty).toBe(10);
    });

    it("should bound negative penalty at LAMBDA_NEGATIVE_PENALTY (20 points maximum)", () => {
      const multiNegativePref: Preferences = {
        ...samplePreferences,
        negative_preferences: [
          { domain: "tech", token: "angular" },
          { domain: "tech", token: "vue" },
          { domain: "tech", token: "wordpress" },
          { domain: "tech", token: "jquery" },
        ],
      };

      const hatedJob = {
        ...sampleJob,
        title: "Angular Vue WordPress jQuery Engineer",
      };

      const penalty = computeNegativePreferencePenalty(
        hatedJob,
        multiNegativePref,
      );
      expect(penalty).toBe(20); // Capped at 20.0
    });
  });

  describe("scoreJobOpportunity (Complete Deterministic Formula)", () => {
    it("should compute authoritative integer score between 0 and 100 with explainable breakdown", () => {
      const fullProfile: CareerProfile = {
        id: "a0000000-0000-4000-8000-000000000001",
        userId: "b0000000-0000-4000-8000-000000000001",
        resumeId: null,
        status: "active",
        onboardingCompleted: true,
        currentOnboardingStep: 4,
        profileVersion: 1,
        profileOrigin: "web",
        background: { education: [], experience: [], projects: [] },
        capabilities: sampleCapabilities,
        careerIntent: sampleIntent,
        preferences: samplePreferences,
        constraints: { relocation_prohibited: false, work_mode_strict: false },
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = scoreJobOpportunity(sampleJob, fullProfile);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown.final_score).toBe(result.score);
      expect(result.breakdown.role_score).toBeDefined();
      expect(result.breakdown.capability_score).toBeDefined();
      expect(result.breakdown.preference_score).toBeDefined();
      expect(result.breakdown.negative_penalty).toBe(0);
    });
  });
});
