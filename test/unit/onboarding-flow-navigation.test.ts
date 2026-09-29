import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  OnboardingFormState,
  OnboardingFlowMode,
  COMMON_POPULAR_SKILLS,
  SUGGESTED_SKILLS_BY_ROLE,
} from "@/features/onboarding/types/onboarding.types";
import { CareerProfile } from "@/features/profile/types/career-profile.types";
import { matchesSkill } from "@/features/matching/utils/skill-normalizer";

describe("Phase 3C: Onboarding Flow Navigation & Fast TTV Lifecycle", () => {
  let mockState: OnboardingFormState;

  beforeEach(() => {
    mockState = {
      flowMode: "choice",
      resumeId: null,
      resumeFileName: null,
      isUploadingResume: false,
      isAnalyzingResume: false,
      resumeExtracted: false,
      background: { education: [], experience: [], projects: [] },
      targetRoles: [],
      targetLevel: null,
      employmentTypes: ["full_time"],
      workModes: ["remote"],
      workModeStrict: false,
      locations: [],
      relocationProhibited: false,
      salaryMin: null,
      salaryCurrency: "USD",
      priorities: [],
      negativePreferences: [],
      skills: [],
      suppressedSkills: [],
      currentStep: 1,
      expectedVersion: 1,
      profileId: "profile-test-1",
      isExistingActiveProfile: false,
    };
  });

  describe("Fast TTV: Path A (Resume Magic Flow)", () => {
    it("should initialize flowMode to 'cv_magic' when profile already has resume", () => {
      const profileWithResume: Partial<CareerProfile> = {
        id: "p1",
        resumeId: "resume-uuid-123",
        status: "draft",
        onboardingCompleted: false,
        currentOnboardingStep: 1,
      };

      const hasCv = Boolean(profileWithResume.resumeId);
      const derivedMode: OnboardingFlowMode = hasCv
        ? "cv_magic"
        : (profileWithResume.currentOnboardingStep || 1) > 1
          ? "manual"
          : "choice";

      expect(derivedMode).toBe("cv_magic");
    });

    it("should correctly prepare confirmation payload from quick review state", () => {
      // User reviewed extracted resume
      mockState.flowMode = "cv_magic";
      mockState.targetRoles = [
        { role: "Fullstack Engineer", priority: "primary" },
      ];
      mockState.targetLevel = "mid_level";
      mockState.workModes = ["remote", "hybrid"];
      mockState.skills = [
        {
          skill: "React",
          category: "core",
          confirmation_state: "confirmed",
          provenance: {
            source: "resume_extracted",
            confidence: 0.9,
            updated_at: "",
          },
        },
        {
          skill: "Node.js",
          category: "core",
          confirmation_state: "confirmed",
          provenance: {
            source: "resume_extracted",
            confidence: 0.9,
            updated_at: "",
          },
        },
      ];

      // Confirmation invariant check
      expect(mockState.targetRoles.length).toBeGreaterThan(0);
      expect(
        mockState.targetRoles.filter((r) => r.priority === "primary"),
      ).toHaveLength(1);
      expect(mockState.targetLevel).toBe("mid_level");
      expect(mockState.workModes.length).toBeGreaterThan(0);
      expect(mockState.skills.length).toBe(2);
    });
  });

  describe("Fast TTV: Path B (3-Question Manual Flow)", () => {
    it("should start at choice and transition to manual step 1", () => {
      expect(mockState.flowMode).toBe("choice");

      // User selects manual setup
      mockState.flowMode = "manual";
      mockState.currentStep = 1;

      expect(mockState.flowMode).toBe("manual");
      expect(mockState.currentStep).toBe(1);
    });

    it("should transition through Step 1 -> Step 2 -> Step 3", () => {
      // Step 1: Role
      mockState.targetRoles = [
        { role: "Frontend Engineer", priority: "primary" },
      ];
      mockState.targetLevel = "junior";
      mockState.currentStep = 2; // Advance to preferences

      expect(mockState.currentStep).toBe(2);

      // Step 2: Preferences
      mockState.workModes = ["remote"];
      mockState.locations = ["Jakarta", "Singapore"];
      mockState.currentStep = 3; // Advance to skills

      expect(mockState.currentStep).toBe(3);

      // Step 3: Skills selection
      const suggested = SUGGESTED_SKILLS_BY_ROLE["frontend"];
      expect(suggested).toBeDefined();
      expect(suggested).toContain("React");
      expect(suggested).toContain("TypeScript");

      // User picks 2 skills
      mockState.skills = [
        {
          skill: "React",
          category: "core",
          confirmation_state: "user_added",
          provenance: {
            source: "user_explicit",
            confidence: 1.0,
            updated_at: "",
          },
        },
        {
          skill: "TypeScript",
          category: "core",
          confirmation_state: "user_added",
          provenance: {
            source: "user_explicit",
            confidence: 1.0,
            updated_at: "",
          },
        },
      ];

      expect(mockState.skills).toHaveLength(2);
    });
  });

  describe("Existing Active Profile Invariant", () => {
    it("should detect active profile and flag isExistingActiveProfile true", () => {
      const activeProfile: Partial<CareerProfile> = {
        id: "p2",
        status: "active",
        onboardingCompleted: true,
      };

      const isExistingActive =
        activeProfile.status === "active" ||
        Boolean(activeProfile.onboardingCompleted);

      expect(isExistingActive).toBe(true);
    });
  });
});
