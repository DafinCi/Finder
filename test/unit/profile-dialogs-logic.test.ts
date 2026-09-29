import { describe, it, expect } from "vitest";
import {
  UpdateCareerIntentRequestSchema,
  UpdatePreferencesRequestSchema,
  UpdateSkillsRequestSchema,
} from "@/features/profile/schemas/career-profile.schema";

describe("Phase 2D: Profile Dialog Invariants & Validation Logic", () => {
  describe("EditCareerIntent Dialog Logic", () => {
    it("should enforce primary role uniqueness and presence", () => {
      const payload = {
        expected_version: 1,
        career_intent: {
          target_roles: [
            { role: "Frontend Engineer", priority: "primary" as const },
            { role: "React Developer", priority: "secondary" as const },
          ],
          target_level: "mid_level" as const,
          employment_types: ["full_time" as const],
        },
      };

      const result = UpdateCareerIntentRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject when primary role is duplicated into secondary roles", () => {
      const payload = {
        expected_version: 1,
        career_intent: {
          target_roles: [
            { role: "Frontend Engineer", priority: "primary" as const },
            { role: "frontend engineer", priority: "secondary" as const }, // duplicate
          ],
          target_level: "mid_level" as const,
          employment_types: ["full_time" as const],
        },
      };

      const result = UpdateCareerIntentRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Duplicate roles are not allowed",
        );
      }
    });

    it("should reject when secondary roles exceed allowed duplicates", () => {
      const payload = {
        expected_version: 1,
        career_intent: {
          target_roles: [
            { role: "Frontend Engineer", priority: "primary" as const },
            { role: "React Developer", priority: "secondary" as const },
            { role: "react developer", priority: "secondary" as const }, // duplicate
          ],
          target_level: "mid_level" as const,
          employment_types: ["full_time" as const],
        },
      };

      const result = UpdateCareerIntentRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("EditPreferences Dialog Logic", () => {
    it("should serialize null salary when user checks 'Not specified / Flexible'", () => {
      const payload = {
        expected_version: 2,
        preferences: {
          locations: ["Remote", "Indonesia"],
          work_modes: ["remote" as const],
          priorities: ["mentorship"],
          salary: null, // Neutral / Not specified
          negative_preferences: [
            {
              domain: "tech" as const,
              token: "legacy_codebases",
              penalty_weight: 1.0,
            },
          ],
        },
        constraints: {
          work_mode_strict: true,
          relocation_prohibited: false,
        },
      };

      const result = UpdatePreferencesRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preferences.salary).toBeNull();
        expect(result.data.constraints?.work_mode_strict).toBe(true);
      }
    });

    it("should reject preferences without any work mode selected", () => {
      const payload = {
        expected_version: 1,
        preferences: {
          locations: [],
          work_modes: [], // Invalid: empty
          priorities: [],
          salary: null,
          negative_preferences: [],
        },
      };

      const result = UpdatePreferencesRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("ManageSkills Dialog Logic", () => {
    it("should validate bulk skill confirmation payload via 'sync' action", () => {
      const syncPayload = {
        action: "sync" as const,
        expected_version: 3,
        skills: [
          {
            skill: "TypeScript",
            category: "core" as const,
            confirmation_state: "confirmed" as const,
            provenance: {
              source: "user_confirmed" as const,
              confidence: 1.0,
              updated_at: new Date().toISOString(),
            },
          },
          {
            skill: "React",
            category: "core" as const,
            confirmation_state: "confirmed" as const,
            provenance: {
              source: "user_confirmed" as const,
              confidence: 1.0,
              updated_at: new Date().toISOString(),
            },
          },
        ],
        suppressed_skills: [
          {
            skill: "angular",
            suppressed_at: new Date().toISOString(),
            reason: "user_deleted" as const,
          },
        ],
      };

      const result = UpdateSkillsRequestSchema.safeParse(syncPayload);
      expect(result.success).toBe(true);
      if (result.success && result.data.action === "sync") {
        expect(result.data.skills).toHaveLength(2);
        expect(result.data.suppressed_skills).toHaveLength(1);
      }
    });

    it("should validate skill category update action", () => {
      const updatePayload = {
        action: "update" as const,
        expected_version: 4,
        skill: "Docker",
        category: "tool" as const,
        proficiency_claim: "proficient" as const,
        confirmation_state: "confirmed" as const,
      };

      const result = UpdateSkillsRequestSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
    });
  });
});
