import { describe, it, expect, vi, beforeEach } from "vitest";
import { CareerProfileService } from "@/features/profile/services/career-profile.service";
import { CareerProfileRepository } from "@/features/profile/repositories/career-profile.repository";
import { CareerProfile } from "@/features/profile/types/career-profile.types";
import {
  ProfileNotFoundError,
  InvalidProfileStateError,
  ProfileValidationError,
} from "@/features/profile/errors/profile-errors";

describe("Unit: CareerProfileService", () => {
  let mockRepo: any;
  let service: CareerProfileService;

  const sampleProfile: CareerProfile = {
    id: "a0000000-0000-0000-0000-000000000001",
    userId: "u0000000-0000-0000-0000-000000000001",
    resumeId: null,
    status: "draft",
    onboardingCompleted: false,
    currentOnboardingStep: 1,
    profileVersion: 1,
    profileOrigin: "web",
    background: {
      education: [],
      experience: [],
      projects: [],
    },
    capabilities: {
      extraction_status: "unattempted",
      skills: [
        {
          skill: "typescript",
          category: "core",
          confirmation_state: "confirmed",
          provenance: {
            source: "user_confirmed",
            confidence: 1.0,
            updated_at: new Date().toISOString(),
          },
        },
      ],
      suppressed_skills: [
        {
          skill: "angular",
          suppressed_at: new Date().toISOString(),
          reason: "user_deleted",
        },
      ],
    },
    careerIntent: {
      target_roles: [{ role: "Fullstack Developer", priority: "primary" }],
      target_level: "mid_level",
      employment_types: ["full_time"],
    },
    preferences: {
      locations: ["Remote", "Jakarta"],
      work_modes: ["remote"],
      priorities: ["mentorship"],
      salary: { min_amount: 5000, currency: "USD" },
      negative_preferences: [],
    },
    constraints: {
      relocation_prohibited: true,
      work_mode_strict: true,
    },
    confirmedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRepo = {
      findByProfileId: vi.fn(),
      createDraft: vi.fn(),
      updateProfileWithCas: vi.fn(),
      confirmProfile: vi.fn(),
    };
    service = new CareerProfileService(
      mockRepo as unknown as CareerProfileRepository,
    );
  });

  describe("getOrCreateDraft", () => {
    it("should return existing profile directly if present", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      const result = await service.getOrCreateDraft("u1");

      expect(result).toBe(sampleProfile);
      expect(mockRepo.createDraft).not.toHaveBeenCalled();
    });

    it("should create new draft if none exists", async () => {
      mockRepo.findByProfileId.mockResolvedValue(null);
      mockRepo.createDraft.mockResolvedValue(sampleProfile);

      const result = await service.getOrCreateDraft("u1", "web");
      expect(result).toBe(sampleProfile);
      expect(mockRepo.createDraft).toHaveBeenCalledWith("u1", {
        origin: "web",
      });
    });
  });

  describe("updateDraftStep", () => {
    it("should reject invalid step (< 1 or > 4)", async () => {
      await expect(service.updateDraftStep("u1", 5, {}, 1)).rejects.toThrow(
        InvalidProfileStateError,
      );

      await expect(service.updateDraftStep("u1", 0, {}, 1)).rejects.toThrow(
        InvalidProfileStateError,
      );
    });

    it("should fail loudly when data fails zod schema validation", async () => {
      await expect(
        service.updateDraftStep("u1", 2, { expected_version: "invalid" }, 1),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should call updateProfileWithCas with merged step updates", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockResolvedValue({
        ...sampleProfile,
        currentOnboardingStep: 2,
        profileVersion: 2,
      });

      const result = await service.updateDraftStep(
        "u1",
        2,
        {
          expected_version: 1,
          preferences: {
            work_modes: ["remote"],
          },
        },
        1,
      );

      expect(result.currentOnboardingStep).toBe(2);
      expect(mockRepo.updateProfileWithCas).toHaveBeenCalled();
    });
  });

  describe("confirmProfile", () => {
    it("should throw ProfileValidationError if required fields are missing", async () => {
      const invalidConfirmation = {
        expected_version: 1,
        career_intent: {
          target_roles: [], // empty roles not allowed!
          target_level: "mid_level",
          employment_types: ["full_time"],
        },
        preferences: {
          locations: [],
          work_modes: ["remote"],
          priorities: [],
          salary: null,
          negative_preferences: [],
        },
        constraints: {
          relocation_prohibited: false,
          work_mode_strict: false,
        },
      };

      await expect(
        service.confirmProfile("u1", invalidConfirmation, 1),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should upgrade confirmed skills to confirmed state with 1.0 confidence", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.confirmProfile.mockResolvedValue({
        ...sampleProfile,
        status: "active",
        onboardingCompleted: true,
      });

      const validConfirmation = {
        expected_version: 1,
        career_intent: {
          target_roles: [
            { role: "Frontend Developer", priority: "primary" as const },
          ],
          target_level: "mid_level" as const,
          employment_types: ["full_time" as const],
        },
        preferences: {
          locations: ["Remote"],
          work_modes: ["remote" as const],
          priorities: ["culture"],
          salary: null,
          negative_preferences: [],
        },
        constraints: {
          relocation_prohibited: false,
          work_mode_strict: false,
        },
        capabilities: {
          skills: [
            {
              skill: "react",
              category: "core" as const,
              confirmation_state: "draft" as const, // will be upgraded!
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.8,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          suppressed_skills: [],
        },
      };

      await service.confirmProfile("u1", validConfirmation, 1);

      expect(mockRepo.confirmProfile).toHaveBeenCalled();
      const calledArgs = mockRepo.confirmProfile.mock.calls[0][1];
      const confirmedSkill = calledArgs.capabilities.skills[0];

      expect(confirmedSkill.confirmation_state).toBe("confirmed");
      expect(confirmedSkill.provenance.source).toBe("user_confirmed");
      expect(confirmedSkill.provenance.confidence).toBe(1.0);
    });
  });

  describe("applyCvProposal (Guardrails & Invariants)", () => {
    it("must NEVER resurrect suppressed skills into active capability items", async () => {
      // sampleProfile already has 'angular' in suppressed_skills
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          capabilities: payload.capabilities,
        }),
      );

      const proposal = {
        resumeId: "r-new-123",
        background: {
          education: [],
          experience: [],
          projects: [],
        },
        capabilities: {
          extraction_status: "success" as const,
          skills: [
            {
              skill: "angular", // MUST BE FILTERED OUT (suppressed)
              category: "core" as const,
              confirmation_state: "draft" as const,
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.8,
                updated_at: new Date().toISOString(),
              },
            },
            {
              skill: "Angular.js", // ALIAS MUST ALSO BE FILTERED OUT
              category: "supporting" as const,
              confirmation_state: "draft" as const,
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.8,
                updated_at: new Date().toISOString(),
              },
            },
            {
              skill: "node.js", // Valid new skill
              category: "supporting" as const,
              confirmation_state: "draft" as const,
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.8,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          suppressed_skills: [],
        },
      };

      const result = await service.applyCvProposal("u1", proposal, 1);
      const activeSkills = result.capabilities.skills.map((s) =>
        s.skill.toLowerCase(),
      );

      expect(activeSkills).not.toContain("angular");
      expect(activeSkills).not.toContain("angular.js");
      expect(activeSkills).toContain("node.js");
      // Preserved existing confirmed typescript skill
      expect(activeSkills).toContain("typescript");
    });

    it("must NEVER overwrite confirmed user intent", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockResolvedValue(sampleProfile);

      const proposal = {
        resumeId: "r-new-123",
        background: sampleProfile.background,
        capabilities: sampleProfile.capabilities,
      };

      await service.applyCvProposal("u1", proposal, 1);

      const updatePayload = mockRepo.updateProfileWithCas.mock.calls[0][1];
      // Notice target_roles, target_level, employment_types, preferences are NOT present in updatePayload!
      expect(updatePayload.careerIntent).toBeUndefined();
      expect(updatePayload.preferences).toBeUndefined();
      expect(updatePayload.constraints).toBeUndefined();
    });
  });

  describe("suppressSkill & addSkill", () => {
    it("suppressSkill should move skill to suppressed_skills and remove from active list", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          capabilities: payload.capabilities,
        }),
      );

      const result = await service.suppressSkill(
        "u1",
        "typescript",
        "user_deleted",
        1,
      );
      const skills = result.capabilities.skills.map((s) => s.skill);
      const suppressed = result.capabilities.suppressed_skills.map(
        (s) => s.skill,
      );

      expect(skills).not.toContain("typescript");
      expect(suppressed).toContain("typescript");
    });

    it("addSkill should add user_added skill with 1.0 confidence and un-suppress if previously suppressed", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          capabilities: payload.capabilities,
        }),
      );

      // 'angular' was in suppressed_skills, now user explicitly adds it
      const result = await service.addSkill("u1", "angular", "core", 1);
      const skills = result.capabilities.skills;
      const suppressed = result.capabilities.suppressed_skills.map(
        (s) => s.skill,
      );

      expect(suppressed).not.toContain("angular");
      const added = skills.find((s) => s.skill.toLowerCase() === "angular");
      expect(added).toBeDefined();
      expect(added?.confirmation_state).toBe("user_added");
      expect(added?.provenance.source).toBe("user_explicit");
      expect(added?.provenance.confidence).toBe(1.0);
    });
  });

  describe("updateCareerIntent", () => {
    it("should update career intent and set provenance to user_explicit with 1.0 confidence", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          careerIntent: payload.careerIntent,
        }),
      );

      const intentInput = {
        target_roles: [
          { role: "Backend Engineer", priority: "primary" as const },
          { role: "DevOps Engineer", priority: "secondary" as const },
        ],
        target_level: "senior" as const,
        employment_types: ["full_time" as const],
      };

      const result = await service.updateCareerIntent("u1", intentInput, 1);
      expect(mockRepo.updateProfileWithCas).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({
          careerIntent: expect.objectContaining({
            target_level: "senior",
            provenance: expect.objectContaining({
              source: "user_explicit",
              confidence: 1.0,
            }),
          }),
        }),
        1,
      );
      expect(result.careerIntent.target_roles).toHaveLength(2);
    });

    it("should throw ProfileValidationError when target roles violate invariants (e.g. no primary)", async () => {
      const invalidIntent = {
        target_roles: [
          { role: "Backend Engineer", priority: "secondary" as const },
        ],
        target_level: "senior" as const,
        employment_types: ["full_time" as const],
      };

      await expect(
        service.updateCareerIntent("u1", invalidIntent, 1),
      ).rejects.toThrow(ProfileValidationError);
    });
  });

  describe("updatePreferences", () => {
    it("should update preferences and constraints with CAS", async () => {
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          preferences: payload.preferences,
          constraints: payload.constraints,
        }),
      );

      const prefsInput = {
        locations: ["Singapore", "Tokyo"],
        work_modes: ["remote" as const],
        priorities: ["compensation", "mentorship"],
        salary: { min_amount: 8000, currency: "USD", period: "year" },
        negative_preferences: [],
      };
      const constraintsInput = {
        relocation_prohibited: false,
        work_mode_strict: true,
      };

      const result = await service.updatePreferences(
        "u1",
        prefsInput,
        constraintsInput,
        2,
      );
      expect(mockRepo.updateProfileWithCas).toHaveBeenCalledWith(
        "u1",
        {
          preferences: prefsInput,
          constraints: constraintsInput,
        },
        2,
      );
      expect(result.preferences.locations).toContain("Singapore");
    });
  });

  describe("updateBackground", () => {
    it("should update background evidence with CAS", async () => {
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          background: payload.background,
        }),
      );

      const bgInput = {
        education: [
          {
            id: "edu-new",
            institution: "MIT",
            degree: "BS",
            field_of_study: "CS",
            graduation_year: 2025,
            provenance: {
              source: "user_explicit" as const,
              confidence: 1.0,
              updated_at: new Date().toISOString(),
            },
          },
        ],
        experience: [],
        projects: [],
      };

      const result = await service.updateBackground("u1", bgInput, 1);
      expect(mockRepo.updateProfileWithCas).toHaveBeenCalledWith(
        "u1",
        { background: bgInput },
        1,
      );
      expect(result.background.education).toHaveLength(1);
    });
  });

  describe("restoreSuppressedSkill & updateSkill & handleSkillAction", () => {
    it("restoreSuppressedSkill should un-suppress and mark skill as confirmed", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          capabilities: payload.capabilities,
        }),
      );

      const result = await service.restoreSuppressedSkill(
        "u1",
        "angular",
        "core",
        1,
      );
      const suppressed = result.capabilities.suppressed_skills.map(
        (s) => s.skill,
      );
      expect(suppressed).not.toContain("angular");

      const skill = result.capabilities.skills.find(
        (s) => s.skill.toLowerCase() === "angular",
      );
      expect(skill).toBeDefined();
      expect(skill?.confirmation_state).toBe("confirmed");
      expect(skill?.category).toBe("core");
    });

    it("updateSkill should update skill category and proficiency claim", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          capabilities: payload.capabilities,
        }),
      );

      const result = await service.updateSkill(
        "u1",
        "typescript",
        {
          category: "tool",
          proficiency_claim: "proficient",
          confirmation_state: "confirmed",
        },
        1,
      );

      const skill = result.capabilities.skills.find(
        (s) => s.skill === "typescript",
      );
      expect(skill?.category).toBe("tool");
      expect(skill?.proficiency_claim).toBe("proficient");
      expect(skill?.provenance.source).toBe("user_confirmed");
    });

    it("updateSkill should throw error if skill does not exist", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);

      await expect(
        service.updateSkill("u1", "nonexistent-skill", { category: "tool" }, 1),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("handleSkillAction should dispatch properly for 'restore'", async () => {
      mockRepo.findByProfileId.mockResolvedValue(sampleProfile);
      mockRepo.updateProfileWithCas.mockImplementation(
        (_pid: string, payload: any) => ({
          ...sampleProfile,
          capabilities: payload.capabilities,
        }),
      );

      const result = await service.handleSkillAction("u1", {
        action: "restore",
        expected_version: 1,
        skill: "angular",
        category: "supporting",
      });

      expect(
        result.capabilities.suppressed_skills.map((s) => s.skill),
      ).not.toContain("angular");
    });
  });
});
