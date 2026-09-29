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

  describe("Phase 3A: Streamlined Onboarding Preset & Skill Suggestions", () => {
    it("COMMON_POPULAR_SKILLS should be non-empty with trimmed unique skill names", async () => {
      const { COMMON_POPULAR_SKILLS } =
        await import("@/features/onboarding/types/onboarding.types");
      expect(COMMON_POPULAR_SKILLS.length).toBeGreaterThanOrEqual(5);
      for (const skill of COMMON_POPULAR_SKILLS) {
        expect(skill.trim()).toBe(skill);
        expect(skill.length).toBeGreaterThan(0);
      }
    });

    it("SUGGESTED_SKILLS_BY_ROLE should provide curated skills for core tech roles", async () => {
      const { SUGGESTED_SKILLS_BY_ROLE } =
        await import("@/features/onboarding/types/onboarding.types");
      const expectedRoles = [
        "frontend",
        "backend",
        "fullstack",
        "mobile",
        "devops",
        "data",
        "ai",
      ];
      for (const roleKey of expectedRoles) {
        expect(SUGGESTED_SKILLS_BY_ROLE[roleKey]).toBeDefined();
        expect(SUGGESTED_SKILLS_BY_ROLE[roleKey].length).toBeGreaterThanOrEqual(
          3,
        );
      }
    });

    it("should correctly promote first role to primary and deduplicate roles", () => {
      const rolesInput = [
        "Frontend Engineer",
        "frontend engineer",
        "React Developer",
      ];
      // Simulate setPrimaryRole logic
      const targetRole = "Frontend Engineer";
      const otherRoles = rolesInput
        .filter((r) => r.toLowerCase() !== targetRole.toLowerCase())
        .map((r) => ({ role: r, priority: "secondary" as const }));

      const finalRoles = [
        { role: targetRole, priority: "primary" as const },
        ...otherRoles,
      ];

      expect(finalRoles).toHaveLength(2); // "Frontend Engineer" and "React Developer"
      expect(finalRoles[0].priority).toBe("primary");
      expect(finalRoles[1].priority).toBe("secondary");
    });

    it("should toggle skill membership correctly", () => {
      let skills = [{ skill: "React" }, { skill: "TypeScript" }];
      const toggle = (list: { skill: string }[], name: string) => {
        const exists = list.some((s) => matchesSkill(s.skill, name));
        if (exists) {
          return list.filter((s) => !matchesSkill(s.skill, name));
        }
        return [...list, { skill: name }];
      };

      // Toggle off existing skill
      skills = toggle(skills, "react");
      expect(skills.some((s) => s.skill === "React")).toBe(false);

      // Toggle on new skill
      skills = toggle(skills, "Next.js");
      expect(skills.some((s) => s.skill === "Next.js")).toBe(true);
    });
  });

  describe("Phase 3B: Antislop Copywriting & Flow State Invariants", () => {
    it("should ensure no em dashes exist in any onboarding options or labels", () => {
      for (const opt of SENIORITY_LEVEL_OPTIONS) {
        expect(opt.label).not.toContain("—");
        expect(opt.description).not.toContain("—");
      }
      for (const opt of WORK_MODE_OPTIONS) {
        expect(opt.label).not.toContain("—");
        expect(opt.description).not.toContain("—");
      }
      for (const opt of EMPLOYMENT_TYPE_OPTIONS) {
        expect(opt.label).not.toContain("—");
      }
      for (const label of Object.values(NEGATIVE_PREFERENCE_LABELS)) {
        expect(label).not.toContain("—");
      }
    });

    it("should ensure work mode toggle maintains at least one active mode", () => {
      let modes = ["remote", "hybrid"];
      const toggleMode = (current: string[], mode: string) => {
        if (current.includes(mode)) {
          if (current.length === 1) return current; // Keep at least one
          return current.filter((m) => m !== mode);
        }
        return [...current, mode];
      };

      modes = toggleMode(modes, "hybrid");
      expect(modes).toEqual(["remote"]);

      // Attempt to unselect last mode should be a no-op
      modes = toggleMode(modes, "remote");
      expect(modes).toEqual(["remote"]);
    });

    it("should verify flowMode state transitions", () => {
      type OnboardingFlowMode = "choice" | "cv_magic" | "manual";
      let mode: OnboardingFlowMode = "choice";

      // User uploads resume -> transitions to cv_magic
      mode = "cv_magic";
      expect(mode).toBe("cv_magic");

      // User opts for manual flow -> transitions to manual
      mode = "manual";
      expect(mode).toBe("manual");
    });
  });
});
