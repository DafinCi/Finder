import { describe, it, expect } from "vitest";
import {
  computePreferenceScore,
} from "@/features/matching/engine/stage2-scoring-engine";
import { JobMatchCandidate } from "@/features/matching/engine/stage1-constraint-filter";
import { Preferences } from "@/features/profile/types/career-profile.types";
import {
  PRIORITY_VOCABULARIES,
  getPriorityMatchTerms,
} from "@/features/matching/constants/preference-vocabularies";
import { PRESET_PRIORITIES } from "@/features/onboarding/types/onboarding.types";

describe("Regression: F-01 - Priority Semantic Mapping", () => {
  const baseJob: JobMatchCandidate = {
    id: "job-101",
    title: "Software Engineer",
    company_name: "Acme Corp",
    description: "Standard engineering role",
    requirements: ["TypeScript"],
    location: "Remote",
    salary_min: 100000,
    salary_max: 150000,
    salary_currency: "USD",
    salary_range: "$100k - $150k",
    experience_level: "Mid-Level",
    is_active: true,
  };

  const createPreferences = (priorities: string[]): Preferences => ({
    locations: ["Remote"],
    work_modes: ["remote"],
    priorities,
    salary: { min_amount: 100000, currency: "USD" },
    negative_preferences: [],
  });

  it("should define semantic aliases for all production preset priorities", () => {
    for (const preset of PRESET_PRIORITIES) {
      const terms = getPriorityMatchTerms(preset.id);
      expect(terms.length).toBeGreaterThan(1);
      expect(PRIORITY_VOCABULARIES[preset.id]).toBeDefined();
    }
  });

  it("should match modern_tech against natural language job text without underscore token", () => {
    const jobWithModernStack: JobMatchCandidate = {
      ...baseJob,
      title: "Frontend Developer",
      description:
        "Join our team to build scalable products using a modern tech stack and cutting-edge cloud infrastructure.",
    };

    const pref = createPreferences(["modern_tech"]);
    const score = computePreferenceScore(jobWithModernStack, pref);

    // 100% matched priorities dimension yields high score
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("should match work_life_balance against natural language wording", () => {
    const jobWithWLB: JobMatchCandidate = {
      ...baseJob,
      description:
        "We believe in sustainable pace and healthy work-life balance with flexible working hours.",
    };

    const pref = createPreferences(["work_life_balance"]);
    const score = computePreferenceScore(jobWithWLB, pref);

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("should match learning_growth against natural language wording", () => {
    const jobWithGrowth: JobMatchCandidate = {
      ...baseJob,
      description:
        "Generous education budget and substantial career growth opportunities for every engineer.",
    };

    const pref = createPreferences(["learning_growth"]);
    const score = computePreferenceScore(jobWithGrowth, pref);

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("should match competitive_salary without depending on literal underscore token", () => {
    const jobWithPay: JobMatchCandidate = {
      ...baseJob,
      description:
        "Offering competitive compensation, equity options, and market-leading benefits.",
    };

    const pref = createPreferences(["competitive_salary"]);
    const score = computePreferenceScore(jobWithPay, pref);

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("should match high_autonomy against natural language wording", () => {
    const jobWithAutonomy: JobMatchCandidate = {
      ...baseJob,
      description:
        "Enjoy high autonomy, end-to-end ownership, and freedom to make architectural decisions.",
    };

    const pref = createPreferences(["high_autonomy"]);
    const score = computePreferenceScore(jobWithAutonomy, pref);

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("should match mentorship against coaching and guidance phrasing", () => {
    const jobWithMentorship: JobMatchCandidate = {
      ...baseJob,
      description:
        "Work alongside staff engineers providing dedicated coaching, mentorship, and thoughtful code review.",
    };

    const pref = createPreferences(["mentorship"]);
    const score = computePreferenceScore(jobWithMentorship, pref);

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("should not produce false positives on unrelated job descriptions", () => {
    const unrelatedJob: JobMatchCandidate = {
      ...baseJob,
      title: "Warehouse Technician",
      description: "Operate forklift and inventory logistics in sorting facility.",
      requirements: ["Forklift License"],
    };

    const pref = createPreferences([
      "modern_tech",
      "work_life_balance",
      "learning_growth",
    ]);
    const score = computePreferenceScore(unrelatedJob, pref);

    // With 0 out of 3 priorities matched, priority score is floor 30
    // Overall preference score should be significantly lower
    expect(score).toBeLessThan(75);
  });

  it("should preserve default neutral behavior when priorities are empty", () => {
    const emptyPref = createPreferences([]);
    const score = computePreferenceScore(baseJob, emptyPref);

    // Unstated priority dimension redistributes weights across stated location & salary
    expect(score).toBe(100);
  });

  it("should perform case-insensitive matching for priority aliases", () => {
    const uppercaseJob: JobMatchCandidate = {
      ...baseJob,
      description: "EXPERIENCE WITH MODERN TECH AND CUTTING-EDGE CLOUD TOOLS REQUIRED.",
    };

    const pref = createPreferences(["modern_tech"]);
    const score = computePreferenceScore(uppercaseJob, pref);

    expect(score).toBeGreaterThanOrEqual(90);
  });
});
