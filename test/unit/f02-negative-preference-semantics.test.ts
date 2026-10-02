import { describe, it, expect } from "vitest";
import {
  computeNegativePreferencePenalty,
} from "@/features/matching/engine/stage2-scoring-engine";
import { JobMatchCandidate } from "@/features/matching/engine/stage1-constraint-filter";
import { Preferences } from "@/features/profile/types/career-profile.types";
import { PRESET_NEGATIVE_PREFERENCES } from "@/features/onboarding/types/onboarding.types";
import {
  NEGATIVE_PREFERENCE_VOCABULARIES,
  getNegativePreferenceMatchTerms,
} from "@/features/matching/constants/preference-vocabularies";

describe("Regression: F-02 - Negative Preference Semantics", () => {
  const baseJob: JobMatchCandidate = {
    id: "job-201",
    title: "Fullstack Engineer",
    company_name: "Acme Corp",
    description: "Build clean web applications using React and Node.js.",
    requirements: ["TypeScript", "React"],
    location: "Remote",
    experience_level: "Mid-Level",
    is_active: true,
  };

  const createPreferences = (
    tokens: { token: string; penalty_weight?: number }[],
  ): Preferences => ({
    locations: ["Remote"],
    work_modes: ["remote"],
    priorities: [],
    salary: null,
    negative_preferences: tokens.map((t) => ({
      domain: "tech",
      token: t.token,
      penalty_weight: t.penalty_weight ?? 1.0,
    })),
  });

  it("should define semantic vocabulary aliases for all production preset negative preferences", () => {
    for (const preset of PRESET_NEGATIVE_PREFERENCES) {
      const terms = getNegativePreferenceMatchTerms(preset.token);
      expect(terms.length).toBeGreaterThan(1);
      expect(NEGATIVE_PREFERENCE_VOCABULARIES[preset.token]).toBeDefined();
    }
  });

  it("should penalize legacy_codebases when description mentions legacy systems or codebases", () => {
    const legacyJob: JobMatchCandidate = {
      ...baseJob,
      description:
        "Primary focus is refactoring legacy systems and maintaining monolithic legacy codebases.",
    };

    const pref = createPreferences([{ token: "legacy_codebases" }]);
    const penalty = computeNegativePreferencePenalty(legacyJob, pref);

    // Mention in description has severity 0.2 * 1.0 * 10 = 2.0
    expect(penalty).toBe(2.0);
  });

  it("should penalize legacy_codebases with higher severity when present in requirements", () => {
    const legacyReqJob: JobMatchCandidate = {
      ...baseJob,
      requirements: ["Experience maintaining legacy codebases", "Java 6"],
    };

    const pref = createPreferences([{ token: "legacy_codebases" }]);
    const penalty = computeNegativePreferencePenalty(legacyReqJob, pref);

    // Mention in requirements has severity 0.5 * 1.0 * 10 = 5.0
    expect(penalty).toBe(5.0);
  });

  it("should penalize legacy_codebases with highest severity when present in title", () => {
    const legacyTitleJob: JobMatchCandidate = {
      ...baseJob,
      title: "Legacy Codebase Migration Specialist",
    };

    const pref = createPreferences([{ token: "legacy_codebases" }]);
    const penalty = computeNegativePreferencePenalty(legacyTitleJob, pref);

    // Mention in title has severity 1.0 * 1.0 * 10 = 10.0
    expect(penalty).toBe(10.0);
  });

  it("should penalize unpaid_overtime when job mentions 996 schedule or crunch hours", () => {
    const crunchJob: JobMatchCandidate = {
      ...baseJob,
      description:
        "Fast-paced environment following a 996 schedule during product release cycles.",
    };

    const pref = createPreferences([{ token: "unpaid_overtime" }]);
    const penalty = computeNegativePreferencePenalty(crunchJob, pref);

    expect(penalty).toBeGreaterThan(0);
  });

  it("should penalize crypto_speculation on token speculation or memecoin projects", () => {
    const cryptoJob: JobMatchCandidate = {
      ...baseJob,
      description:
        "Building decentralized exchanges for high-risk token speculation and memecoin liquidity.",
    };

    const pref = createPreferences([{ token: "crypto_speculation" }]);
    const penalty = computeNegativePreferencePenalty(cryptoJob, pref);

    expect(penalty).toBeGreaterThan(0);
  });

  it("should penalize frequent_travel when travel requirements are mentioned", () => {
    const travelJob: JobMatchCandidate = {
      ...baseJob,
      description: "Client-facing technical consulting with frequent travel required across Europe.",
    };

    const pref = createPreferences([{ token: "frequent_travel" }]);
    const penalty = computeNegativePreferencePenalty(travelJob, pref);

    expect(penalty).toBeGreaterThan(0);
  });

  it("should penalize gambling on casino or sportsbook projects", () => {
    const gamblingJob: JobMatchCandidate = {
      ...baseJob,
      description: "Developing scalable real-time sports betting and online casino platforms.",
    };

    const pref = createPreferences([{ token: "gambling" }]);
    const penalty = computeNegativePreferencePenalty(gamblingJob, pref);

    expect(penalty).toBeGreaterThan(0);
  });

  it("should produce zero penalty for completely unrelated job descriptions", () => {
    const cleanJob: JobMatchCandidate = {
      ...baseJob,
      title: "Frontend Architect",
      description: "Architecting modern web design systems with Next.js and Tailwind.",
      requirements: ["React", "TypeScript", "Accessibility"],
    };

    const pref = createPreferences([
      { token: "legacy_codebases" },
      { token: "unpaid_overtime" },
      { token: "gambling" },
      { token: "crypto_speculation" },
      { token: "frequent_travel" },
    ]);

    const penalty = computeNegativePreferencePenalty(cleanJob, pref);
    expect(penalty).toBe(0);
  });

  it("should accumulate multiple penalties up to the LAMBDA_NEGATIVE_PENALTY cap of 20", () => {
    const toxicJob: JobMatchCandidate = {
      ...baseJob,
      title: "Legacy Systems Casino Overtime Lead",
      requirements: ["Legacy software maintenance", "Mandatory overtime", "Online gaming casino"],
      description: "Frequent travel required for high-risk crypto projects.",
    };

    const pref = createPreferences([
      { token: "legacy_codebases" },
      { token: "unpaid_overtime" },
      { token: "gambling" },
      { token: "crypto_speculation" },
      { token: "frequent_travel" },
    ]);

    const penalty = computeNegativePreferencePenalty(toxicJob, pref);
    expect(penalty).toBe(20.0); // Exact cap
  });

  it("should perform case-insensitive negative matching", () => {
    const uppercaseJob: JobMatchCandidate = {
      ...baseJob,
      description: "PROJECT INVOLVES REFACTORING A MONOLITHIC LEGACY CODEBASE.",
    };

    const pref = createPreferences([{ token: "legacy_codebases" }]);
    const penalty = computeNegativePreferencePenalty(uppercaseJob, pref);

    expect(penalty).toBe(2.0);
  });
});
