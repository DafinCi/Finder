import { describe, it, expect } from "vitest";
import {
  SENIORITY_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  PRESET_NEGATIVE_PREFERENCES,
  NEGATIVE_PREFERENCE_LABELS,
} from "@/features/onboarding/types/onboarding.types";
import {
  TargetLevelSchema,
  EmploymentTypeSchema,
  WorkModeSchema,
  NegativePreferenceItemSchema,
} from "@/features/profile/schemas/career-profile.schema";
import { matchesSkill } from "@/features/matching/utils/skill-normalizer";
import {
  CapabilityItem,
  SuppressedSkillItem,
} from "@/features/profile/types/career-profile.types";

describe("Phase 1E: Onboarding Types & Helper Logic Unit Tests", () => {
  it("all SENIORITY_LEVEL_OPTIONS values should conform to TargetLevelSchema", () => {
    for (const opt of SENIORITY_LEVEL_OPTIONS) {
      expect(() => TargetLevelSchema.parse(opt.value)).not.toThrow();
      expect(opt.label.length).toBeGreaterThan(0);
      expect(opt.description.length).toBeGreaterThan(0);
    }
  });

  it("all EMPLOYMENT_TYPE_OPTIONS values should conform to EmploymentTypeSchema", () => {
    for (const opt of EMPLOYMENT_TYPE_OPTIONS) {
      expect(() => EmploymentTypeSchema.parse(opt.value)).not.toThrow();
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });

  it("all WORK_MODE_OPTIONS values should conform to WorkModeSchema", () => {
    for (const opt of WORK_MODE_OPTIONS) {
      expect(() => WorkModeSchema.parse(opt.value)).not.toThrow();
      expect(opt.label.length).toBeGreaterThan(0);
      expect(opt.description.length).toBeGreaterThan(0);
    }
  });

  it("all PRESET_NEGATIVE_PREFERENCES should conform to NegativePreferenceItemSchema and have human labels", () => {
    for (const item of PRESET_NEGATIVE_PREFERENCES) {
      expect(() => NegativePreferenceItemSchema.parse(item)).not.toThrow();
      expect(NEGATIVE_PREFERENCE_LABELS[item.token]).toBeDefined();
      expect(NEGATIVE_PREFERENCE_LABELS[item.token].length).toBeGreaterThan(0);
    }
  });

  it("skill suppression filter should correctly exclude suppressed skills even with different casing or aliases", () => {
    const suppressed: SuppressedSkillItem[] = [
      {
        skill: "react",
        suppressed_at: new Date().toISOString(),
        reason: "user_deleted",
      },
      {
        skill: "TypeScript",
        suppressed_at: new Date().toISOString(),
        reason: "user_deleted",
      },
    ];

    const candidateSkills: CapabilityItem[] = [
      {
        skill: "React.js",
        category: "core",
        confirmation_state: "draft",
        provenance: {
          source: "resume_extracted",
          confidence: 0.9,
          updated_at: "",
        },
      },
      {
        skill: "ts",
        category: "core",
        confirmation_state: "draft",
        provenance: {
          source: "resume_extracted",
          confidence: 0.9,
          updated_at: "",
        },
      },
      {
        skill: "PostgreSQL",
        category: "core",
        confirmation_state: "draft",
        provenance: {
          source: "resume_extracted",
          confidence: 0.9,
          updated_at: "",
        },
      },
    ];

    const active = candidateSkills.filter(
      (c) => !suppressed.some((s) => matchesSkill(s.skill, c.skill)),
    );

    // React.js matches react, and ts matches TypeScript -> both suppressed
    expect(active.length).toBe(1);
    expect(active[0].skill).toBe("PostgreSQL");
  });
});
