import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CareerProfileRepository,
  CareerProfileDbRow,
} from "@/features/profile/repositories/career-profile.repository";
import { CareerProfileService } from "@/features/profile/services/career-profile.service";
import {
  VersionConflictError,
  ProfileValidationError,
} from "@/features/profile/errors/profile-errors";
import {
  profileClientService,
  ProfileClientVersionConflictError,
} from "@/features/profile/services/profile-client.service";

describe("Phase 2E: Profile Management Lifecycle, Invariants & CAS Integration Tests", () => {
  let inMemoryDb: Map<string, CareerProfileDbRow>;
  let mockSupabase: any;
  let repository: CareerProfileRepository;
  let service: CareerProfileService;

  const TEST_PROFILE_ID = "c2000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    vi.restoreAllMocks();
    inMemoryDb = new Map();

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "career_profiles") {
          return {
            select: vi.fn((_columns?: string) => ({
              eq: vi.fn((col: string, val: any) => ({
                maybeSingle: vi.fn(async () => {
                  if (col === "profile_id") {
                    const row = inMemoryDb.get(val);
                    return { data: row ? { ...row } : null, error: null };
                  }
                  return { data: null, error: null };
                }),
              })),
            })),
            insert: vi.fn((payload: any) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  const id = crypto.randomUUID();
                  const row: CareerProfileDbRow = {
                    id,
                    profile_id: payload.profile_id,
                    resume_id: payload.resume_id || null,
                    status: payload.status || "draft",
                    onboarding_completed: payload.onboarding_completed || false,
                    current_onboarding_step:
                      payload.current_onboarding_step || 1,
                    profile_version: 1,
                    profile_origin: payload.profile_origin || "web",
                    background: payload.background,
                    capabilities: payload.capabilities,
                    career_intent: payload.career_intent,
                    preferences: payload.preferences,
                    constraints: payload.constraints,
                    confirmed_at: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  inMemoryDb.set(payload.profile_id, row);
                  return { data: { ...row }, error: null };
                }),
              })),
            })),
            update: vi.fn((payload: any) => ({
              eq: vi.fn((col1: string, val1: any) => ({
                eq: vi.fn((col2: string, val2: any) => ({
                  select: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => {
                      const profileId = col1 === "profile_id" ? val1 : val2;
                      const expectedVersion =
                        col1 === "profile_version" ? val1 : val2;
                      const existing = inMemoryDb.get(profileId);

                      if (
                        !existing ||
                        existing.profile_version !== expectedVersion
                      ) {
                        return { data: null, error: null };
                      }

                      const updated: CareerProfileDbRow = {
                        ...existing,
                        ...payload,
                        profile_version: existing.profile_version + 1,
                        updated_at: new Date().toISOString(),
                      };
                      inMemoryDb.set(profileId, updated);
                      return { data: { ...updated }, error: null };
                    }),
                  })),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };

    repository = new CareerProfileRepository(mockSupabase);
    service = new CareerProfileService(repository);
  });

  // Helper to bootstrap an active confirmed profile at version 2
  async function bootstrapActiveProfile(profileId: string) {
    await service.getOrCreateDraft(profileId);
    return service.confirmProfile(
      profileId,
      {
        expected_version: 1,
        career_intent: {
          target_roles: [
            { role: "Frontend Engineer", priority: "primary" as const },
            { role: "React Developer", priority: "secondary" as const },
          ],
          target_level: "mid_level" as const,
          employment_types: ["full_time" as const],
        },
        preferences: {
          locations: ["Jakarta", "Remote"],
          work_modes: ["remote" as const, "hybrid" as const],
          priorities: ["learning", "mentorship"],
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
          suppressed_skills: [],
        },
      },
      1,
    );
  }

  describe("1. Full Lifecycle & CAS Progression (v1 -> v7)", () => {
    it("should sequentially increment profile version across granular domain updates", async () => {
      // 1. Initial State: Profile starts as active confirmed at v2
      const active = await bootstrapActiveProfile(TEST_PROFILE_ID);
      expect(active.profileVersion).toBe(2);
      expect(active.status).toBe("active");
      expect(active.onboardingCompleted).toBe(true);

      // 2. CAS Transition 1: Update Career Intent (v2 -> v3)
      const v3 = await service.updateCareerIntent(
        TEST_PROFILE_ID,
        {
          target_roles: [
            { role: "Senior Frontend Engineer", priority: "primary" },
            { role: "Fullstack Developer", priority: "secondary" },
            { role: "React Native Developer", priority: "secondary" },
          ],
          target_level: "senior",
          employment_types: ["full_time", "contract"],
        },
        2,
      );

      expect(v3.profileVersion).toBe(3);
      expect(v3.careerIntent.target_roles).toHaveLength(3);
      expect(
        v3.careerIntent.target_roles.find((r) => r.priority === "primary")
          ?.role,
      ).toBe("Senior Frontend Engineer");
      expect(v3.careerIntent.target_level).toBe("senior");
      expect(v3.careerIntent.employment_types).toEqual([
        "full_time",
        "contract",
      ]);
      expect(v3.careerIntent.provenance?.source).toBe("user_explicit");

      // 3. CAS Transition 2: Update Preferences (v3 -> v4)
      const v4 = await service.updatePreferences(
        TEST_PROFILE_ID,
        {
          locations: ["Singapore", "Remote"],
          work_modes: ["remote"],
          priorities: ["compensation", "mentorship", "work_life_balance"],
          salary: null, // Neutral salary preference verification
          negative_preferences: [],
        },
        { relocation_prohibited: true, work_mode_strict: true },
        3,
      );

      expect(v4.profileVersion).toBe(4);
      expect(v4.preferences.locations).toEqual(["Singapore", "Remote"]);
      expect(v4.preferences.work_modes).toEqual(["remote"]);
      expect(v4.preferences.salary).toBeNull();
      expect(v4.constraints.relocation_prohibited).toBe(true);
      expect(v4.constraints.work_mode_strict).toBe(true);

      // 4. CAS Transition 3: Add Skill (v4 -> v5)
      const v5 = await service.handleSkillAction(TEST_PROFILE_ID, {
        action: "add",
        skill: "GraphQL",
        category: "supporting",
        proficiency_claim: "competent",
        expected_version: 4,
      });

      expect(v5.profileVersion).toBe(5);
      const graphQlSkill = v5.capabilities.skills.find(
        (s) => s.skill.toLowerCase() === "graphql",
      );
      expect(graphQlSkill).toBeDefined();
      expect(graphQlSkill?.category).toBe("supporting");
      expect(graphQlSkill?.proficiency_claim).toBe("competent");
      expect(graphQlSkill?.confirmation_state).toBe("user_added");
      expect(graphQlSkill?.provenance.source).toBe("user_explicit");

      // 5. CAS Transition 4: Update Skill Category & Proficiency (v5 -> v6)
      const v6 = await service.handleSkillAction(TEST_PROFILE_ID, {
        action: "update",
        skill: "GraphQL",
        category: "core",
        proficiency_claim: "proficient",
        confirmation_state: "confirmed",
        expected_version: 5,
      });

      expect(v6.profileVersion).toBe(6);
      const updatedGraphQl = v6.capabilities.skills.find(
        (s) => s.skill.toLowerCase() === "graphql",
      );
      expect(updatedGraphQl?.category).toBe("core");
      expect(updatedGraphQl?.proficiency_claim).toBe("proficient");
      expect(updatedGraphQl?.confirmation_state).toBe("confirmed");

      // 6. CAS Transition 5: Update Background (v6 -> v7)
      const v7 = await service.updateBackground(
        TEST_PROFILE_ID,
        {
          education: [
            {
              id: "edu-1",
              institution: "Universitas Gadjah Mada",
              degree: "Bachelor of Computer Science",
              field_of_study: "Information Technology",
              graduation_year: 2022,
              provenance: {
                source: "user_confirmed",
                confidence: 1.0,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          experience: [
            {
              id: "exp-1",
              company_name: "Tech Nusantara",
              role_title: "Frontend Engineer",
              start_date: "2022-08-01",
              end_date: null,
              is_current: true,
              description_summary: "Building next-gen career platform.",
              technologies_used: ["React", "TypeScript"],
              provenance: {
                source: "user_confirmed",
                confidence: 1.0,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          projects: [],
        },
        6,
      );

      expect(v7.profileVersion).toBe(7);
      expect(v7.background.education).toHaveLength(1);
      expect(v7.background.education[0].institution).toBe(
        "Universitas Gadjah Mada",
      );
      expect(v7.background.experience).toHaveLength(1);
      expect(v7.background.experience[0].company_name).toBe("Tech Nusantara");
    });
  });

  describe("2. Skill Suppression & Anti-Resurrection Invariants", () => {
    it("should suppress a skill, prevent resurrection on CV re-upload, and restore it cleanly on user demand", async () => {
      // 1. Initial State: Confirmed profile at v2 with TypeScript, React, and PHP
      await service.getOrCreateDraft(TEST_PROFILE_ID);
      await service.confirmProfile(
        TEST_PROFILE_ID,
        {
          expected_version: 1,
          career_intent: {
            target_roles: [
              { role: "Web Developer", priority: "primary" as const },
            ],
            target_level: "mid_level" as const,
            employment_types: ["full_time" as const],
          },
          preferences: {
            locations: ["Remote"],
            work_modes: ["remote" as const],
            priorities: ["learning"],
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
              {
                skill: "PHP",
                category: "supporting" as const,
                confirmation_state: "confirmed" as const,
                provenance: {
                  source: "user_confirmed" as const,
                  confidence: 1.0,
                  updated_at: new Date().toISOString(),
                },
              },
            ],
            suppressed_skills: [],
          },
        },
        1,
      );

      // 2. Candidate suppresses "PHP" because they do not want PHP job recommendations
      const afterSuppress = await service.handleSkillAction(TEST_PROFILE_ID, {
        action: "suppress",
        skill: "PHP",
        reason: "user_deleted",
        expected_version: 2,
      });

      expect(afterSuppress.profileVersion).toBe(3);
      expect(
        afterSuppress.capabilities.skills.find(
          (s) => s.skill.toLowerCase() === "php",
        ),
      ).toBeUndefined();
      expect(afterSuppress.capabilities.suppressed_skills).toHaveLength(1);
      expect(
        afterSuppress.capabilities.suppressed_skills[0].skill.toLowerCase(),
      ).toBe("php");
      expect(afterSuppress.capabilities.suppressed_skills[0].reason).toBe(
        "user_deleted",
      );

      // 3. User re-uploads CV. Parser extracts ["React", "PHP", "Docker"]
      const cvProposal = {
        resumeId: "b0000000-0000-4000-8000-000000000099",
        background: { education: [], experience: [], projects: [] },
        capabilities: {
          extraction_status: "success" as const,
          skills: [
            {
              skill: "React",
              category: "core" as const,
              confirmation_state: "draft" as const,
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.95,
                updated_at: new Date().toISOString(),
              },
            },
            {
              skill: "PHP", // MUST BE SUPPRESSED / NOT RESURRECTED
              category: "supporting" as const,
              confirmation_state: "draft" as const,
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.85,
                updated_at: new Date().toISOString(),
              },
            },
            {
              skill: "Docker", // New skill from CV
              category: "tool" as const,
              confirmation_state: "draft" as const,
              provenance: {
                source: "resume_extracted" as const,
                confidence: 0.9,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          suppressed_skills: [],
        },
      };

      const afterCv = await service.applyCvProposal(
        TEST_PROFILE_ID,
        cvProposal,
        3,
      );

      expect(afterCv.profileVersion).toBe(4);
      // Invariant Check: PHP was NOT resurrected
      expect(
        afterCv.capabilities.skills.find(
          (s) => s.skill.toLowerCase() === "php",
        ),
      ).toBeUndefined();
      // PHP remains in suppressed_skills
      expect(
        afterCv.capabilities.suppressed_skills.some(
          (s) => s.skill.toLowerCase() === "php",
        ),
      ).toBe(true);
      // Docker was added as draft
      const docker = afterCv.capabilities.skills.find(
        (s) => s.skill.toLowerCase() === "docker",
      );
      expect(docker).toBeDefined();
      expect(docker?.confirmation_state).toBe("draft");

      // 4. Candidate explicitly chooses to restore "PHP"
      const afterRestore = await service.handleSkillAction(TEST_PROFILE_ID, {
        action: "restore",
        skill: "PHP",
        category: "supporting",
        expected_version: 4,
      });

      expect(afterRestore.profileVersion).toBe(5);
      // PHP is removed from suppressed_skills
      expect(afterRestore.capabilities.suppressed_skills).toHaveLength(0);
      // PHP is restored with user_confirmed provenance
      const restoredPhp = afterRestore.capabilities.skills.find(
        (s) => s.skill.toLowerCase() === "php",
      );
      expect(restoredPhp).toBeDefined();
      expect(restoredPhp?.category).toBe("supporting");
      expect(restoredPhp?.confirmation_state).toBe("confirmed");
      expect(restoredPhp?.provenance.source).toBe("user_confirmed");
      expect(restoredPhp?.provenance.confidence).toBe(1.0);
    });
  });

  describe("3. Concurrency Control & CAS Collision (HTTP 409)", () => {
    it("should throw VersionConflictError when expected_version is stale on updateCareerIntent", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID); // Version is now 2

      // Simulate concurrent update: profile has moved to version 3
      await service.updateCareerIntent(
        TEST_PROFILE_ID,
        {
          target_roles: [
            { role: "Lead Frontend Engineer", priority: "primary" },
          ],
          target_level: "lead",
          employment_types: ["full_time"],
        },
        2,
      ); // Profile is now 3

      // Stale attempt with version 2
      await expect(
        service.updateCareerIntent(
          TEST_PROFILE_ID,
          {
            target_roles: [{ role: "Principal Engineer", priority: "primary" }],
            target_level: "lead",
            employment_types: ["full_time"],
          },
          2, // Stale version! Current is 3
        ),
      ).rejects.toThrow(VersionConflictError);

      try {
        await service.updateCareerIntent(
          TEST_PROFILE_ID,
          {
            target_roles: [{ role: "Principal Engineer", priority: "primary" }],
            target_level: "lead",
            employment_types: ["full_time"],
          },
          2,
        );
      } catch (err: any) {
        expect(err).toBeInstanceOf(VersionConflictError);
        expect(err.expectedVersion).toBe(2);
        expect(err.currentVersion).toBe(3);
        expect(err.statusCode).toBe(409);
      }
    });

    it("should reject stale expected_version across preferences, skills, and background mutations", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID); // Current version = 2

      // Advance version to 3
      await service.updateBackground(
        TEST_PROFILE_ID,
        { education: [], experience: [], projects: [] },
        2,
      ); // Version is now 3

      // Preferences with stale version 2
      await expect(
        service.updatePreferences(
          TEST_PROFILE_ID,
          {
            locations: ["Remote"],
            work_modes: ["remote"],
            priorities: [],
            salary: null,
            negative_preferences: [],
          },
          undefined,
          2, // Stale
        ),
      ).rejects.toThrow(VersionConflictError);

      // Skills action with stale version 2
      await expect(
        service.handleSkillAction(TEST_PROFILE_ID, {
          action: "add",
          skill: "Go",
          expected_version: 2, // Stale
        }),
      ).rejects.toThrow(VersionConflictError);

      // Background with stale version 2
      await expect(
        service.updateBackground(
          TEST_PROFILE_ID,
          { education: [], experience: [], projects: [] },
          2, // Stale
        ),
      ).rejects.toThrow(VersionConflictError);
    });

    it("should successfully recover from conflict after fetching the latest version", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID); // Version 2

      // First writer advances to 3
      await service.updateCareerIntent(
        TEST_PROFILE_ID,
        {
          target_roles: [
            { role: "Staff Frontend Engineer", priority: "primary" },
          ],
          target_level: "senior",
          employment_types: ["full_time"],
        },
        2,
      );

      // Second writer attempts with stale version 2 -> fails
      await expect(
        service.updatePreferences(
          TEST_PROFILE_ID,
          {
            locations: ["Bandung"],
            work_modes: ["hybrid"],
            priorities: ["culture"],
            salary: null,
            negative_preferences: [],
          },
          undefined,
          2,
        ),
      ).rejects.toThrow(VersionConflictError);

      // Client recovery: Refresh profile to get current version
      const fresh = await service.getProfile(TEST_PROFILE_ID);
      expect(fresh?.profileVersion).toBe(3);

      // Retry with refreshed version 3 -> succeeds and increments to 4
      const recovered = await service.updatePreferences(
        TEST_PROFILE_ID,
        {
          locations: ["Bandung"],
          work_modes: ["hybrid"],
          priorities: ["culture"],
          salary: null,
          negative_preferences: [],
        },
        undefined,
        fresh!.profileVersion,
      );

      expect(recovered.profileVersion).toBe(4);
      expect(recovered.preferences.locations).toEqual(["Bandung"]);
    });
  });

  describe("4. Domain Invariant Validation Boundaries", () => {
    it("should enforce exactly one primary role requirement", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      // 0 primary roles
      await expect(
        service.updateCareerIntent(
          TEST_PROFILE_ID,
          {
            target_roles: [
              { role: "Frontend Engineer", priority: "secondary" },
              { role: "Backend Engineer", priority: "secondary" },
            ],
            target_level: "mid_level",
            employment_types: ["full_time"],
          },
          2,
        ),
      ).rejects.toThrow(ProfileValidationError);

      // 2 primary roles
      await expect(
        service.updateCareerIntent(
          TEST_PROFILE_ID,
          {
            target_roles: [
              { role: "Frontend Engineer", priority: "primary" },
              { role: "Backend Engineer", priority: "primary" },
            ],
            target_level: "mid_level",
            employment_types: ["full_time"],
          },
          2,
        ),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should reject duplicate role titles between primary and secondary (case-insensitive)", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      await expect(
        service.updateCareerIntent(
          TEST_PROFILE_ID,
          {
            target_roles: [
              { role: "Frontend Engineer", priority: "primary" },
              { role: "frontend engineer", priority: "secondary" },
            ],
            target_level: "mid_level",
            employment_types: ["full_time"],
          },
          2,
        ),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should reject duplicate secondary role titles", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      await expect(
        service.updateCareerIntent(
          TEST_PROFILE_ID,
          {
            target_roles: [
              { role: "Frontend Engineer", priority: "primary" },
              { role: "React Developer", priority: "secondary" },
              { role: "react developer", priority: "secondary" },
            ],
            target_level: "mid_level",
            employment_types: ["full_time"],
          },
          2,
        ),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should reject empty work modes in preferences update", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      await expect(
        service.updatePreferences(
          TEST_PROFILE_ID,
          {
            locations: ["Remote"],
            work_modes: [] as any, // Invariant: At least 1 work mode required
            priorities: [],
            salary: null,
            negative_preferences: [],
          },
          undefined,
          2,
        ),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should cleanly allow and preserve neutral null salary without forcing numerical defaults", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      const updated = await service.updatePreferences(
        TEST_PROFILE_ID,
        {
          locations: ["Remote"],
          work_modes: ["remote"],
          priorities: [],
          salary: null,
          negative_preferences: [],
        },
        undefined,
        2,
      );

      expect(updated.preferences.salary).toBeNull();
    });

    it("should reject updating a skill that does not exist in the candidate capabilities", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      await expect(
        service.handleSkillAction(TEST_PROFILE_ID, {
          action: "update",
          skill: "NonExistentSkillXYZ",
          category: "core",
          expected_version: 2,
        }),
      ).rejects.toThrow(ProfileValidationError);
    });

    it("should reject adding empty or whitespace skill name", async () => {
      await bootstrapActiveProfile(TEST_PROFILE_ID);

      await expect(
        service.handleSkillAction(TEST_PROFILE_ID, {
          action: "add",
          skill: "   ",
          expected_version: 2,
        }),
      ).rejects.toThrow(ProfileValidationError);
    });
  });

  describe("5. Client Service 409 Translation & Completeness Score Dynamics", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("should map 409 HTTP responses from API into typed ProfileClientVersionConflictError with version metadata", async () => {
      const mockConflictResponse = {
        ok: false,
        status: 409,
        json: async () => ({
          error: "Version conflict detected",
          expected_version: 3,
          current_version: 4,
        }),
      };
      (globalThis.fetch as any).mockResolvedValueOnce(mockConflictResponse);

      await expect(
        profileClientService.updateCareerIntent({
          expected_version: 3,
          career_intent: {
            target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
            target_level: "mid_level",
            employment_types: ["full_time"],
          },
        }),
      ).rejects.toThrow(ProfileClientVersionConflictError);
    });

    it("should track profile completeness score progression across lifecycle states", async () => {
      // Step 1: Draft profile has lower completeness
      const draft = await service.getOrCreateDraft(TEST_PROFILE_ID);
      expect(draft.careerIntent.target_roles).toHaveLength(0);

      // Step 2: Confirmed profile with full details reaches high/full completeness
      const confirmed = await bootstrapActiveProfile(TEST_PROFILE_ID);
      const v3 = await service.updateBackground(
        TEST_PROFILE_ID,
        {
          education: [
            {
              id: "edu-ugm-1",
              institution: "UGM",
              degree: "B.Sc",
              field_of_study: "CS",
              graduation_year: 2022,
              provenance: {
                source: "user_confirmed",
                confidence: 1.0,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          experience: [
            {
              id: "exp-startup-1",
              company_name: "Startup",
              role_title: "Developer",
              start_date: "2022-01-01",
              end_date: null,
              is_current: true,
              description_summary: "Developer",
              technologies_used: ["TypeScript"],
              provenance: {
                source: "user_confirmed",
                confidence: 1.0,
                updated_at: new Date().toISOString(),
              },
            },
          ],
          projects: [],
        },
        2,
      );

      const v4 = await service.handleSkillAction(TEST_PROFILE_ID, {
        action: "add",
        skill: "Next.js",
        category: "core",
        expected_version: 3,
      });

      // Pure completeness calculation verification
      const primaryRole = v4.careerIntent?.target_roles?.find(
        (r) => r.priority === "primary",
      );
      const hasLevel = Boolean(v4.careerIntent?.target_level);
      const hasEmployment =
        (v4.careerIntent?.employment_types?.length || 0) > 0;
      const hasWorkModes = (v4.preferences?.work_modes?.length || 0) > 0;
      const totalSkills = v4.capabilities?.skills?.length || 0;
      const hasEducation = (v4.background?.education?.length || 0) > 0;
      const hasExperience = (v4.background?.experience?.length || 0) > 0;

      let score = 0;
      if (primaryRole) score += 20;
      if (hasLevel) score += 15;
      if (hasEmployment) score += 10;
      if (hasWorkModes) score += 15;
      if (totalSkills >= 3) score += 20;
      if (hasEducation && hasExperience) score += 20;

      expect(score).toBe(100);
    });
  });
});
