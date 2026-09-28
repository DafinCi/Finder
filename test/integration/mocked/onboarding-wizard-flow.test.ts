import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CareerProfileRepository,
  CareerProfileDbRow,
} from "@/features/profile/repositories/career-profile.repository";
import { CareerProfileService } from "@/features/profile/services/career-profile.service";
import { VersionConflictError } from "@/features/profile/errors/profile-errors";
import { CareerProfile } from "@/features/profile/types/career-profile.types";

describe("Phase 1E: Onboarding Wizard End-to-End Flow Integration Tests", () => {
  let inMemoryDb: Map<string, CareerProfileDbRow>;
  let mockSupabase: any;
  let repository: CareerProfileRepository;
  let service: CareerProfileService;

  const TEST_PROFILE_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

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
                      // CAS update simulation
                      const profileId = col1 === "profile_id" ? val1 : val2;
                      const expectedVersion =
                        col1 === "profile_version" ? val1 : val2;
                      const existing = inMemoryDb.get(profileId);

                      if (
                        !existing ||
                        existing.profile_version !== expectedVersion
                      ) {
                        return { data: null, error: null }; // 0 rows updated
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

  it("should complete the full 4-step onboarding journey with version integrity", async () => {
    // 1. Initial State: Profile does not exist yet
    const initial = await service.getProfile(TEST_PROFILE_ID);
    expect(initial).toBeNull();

    // Initialize Draft
    const draft = await service.getOrCreateDraft(TEST_PROFILE_ID);
    expect(draft.profileVersion).toBe(1);
    expect(draft.currentOnboardingStep).toBe(1);
    expect(draft.status).toBe("draft");
    expect(draft.onboardingCompleted).toBe(false);

    // 2. Step 1: CV Extraction proposal applied
    const cvProposal = {
      resumeId: "a0000000-0000-4000-8000-000000000099",
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
              confidence: 0.9,
              updated_at: new Date().toISOString(),
            },
          },
          {
            skill: "TypeScript",
            category: "core" as const,
            confirmation_state: "draft" as const,
            provenance: {
              source: "resume_extracted" as const,
              confidence: 0.9,
              updated_at: new Date().toISOString(),
            },
          },
          {
            skill: "TailwindCSS",
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

    const afterCv = await service.applyCvProposal(
      TEST_PROFILE_ID,
      cvProposal,
      1,
    );
    expect(afterCv.profileVersion).toBe(2);
    expect(afterCv.capabilities.skills.length).toBe(3);

    // 3. Step 2: Set Career Intent (Roles + Seniority + Employment Types)
    const afterStep2 = await service.updateDraftStep(
      TEST_PROFILE_ID,
      2,
      {
        expected_version: afterCv.profileVersion,
        career_intent: {
          target_roles: [
            { role: "Frontend Engineer", priority: "primary" },
            { role: "Fullstack Engineer", priority: "secondary" },
          ],
          target_level: "junior",
          employment_types: ["full_time", "contract"],
        },
      },
      afterCv.profileVersion, // 2
    );
    expect(afterStep2.profileVersion).toBe(3);
    expect(afterStep2.careerIntent.target_roles.length).toBe(2);
    expect(afterStep2.careerIntent.target_level).toBe("junior");

    // 4. Step 3: Set Work Modes, Constraints & Preferences
    const afterStep3 = await service.updateDraftStep(
      TEST_PROFILE_ID,
      3,
      {
        expected_version: afterStep2.profileVersion,
        preferences: {
          locations: ["Indonesia", "Singapore"],
          work_modes: ["remote", "hybrid"],
          priorities: ["modern_tech", "mentorship"],
          salary: { min_amount: 60000, currency: "USD" },
          negative_preferences: [
            { domain: "tech", token: "legacy_codebases", penalty_weight: 1.0 },
          ],
        },
        constraints: {
          work_mode_strict: true,
          relocation_prohibited: true,
        },
      },
      afterStep2.profileVersion, // 3
    );
    expect(afterStep3.profileVersion).toBe(4);
    expect(afterStep3.constraints.work_mode_strict).toBe(true);
    expect(afterStep3.constraints.relocation_prohibited).toBe(true);

    // 5. Step 4 Review: Suppress unwanted skill & Add custom skill
    // User deletes TailwindCSS
    const afterSuppress = await service.suppressSkill(
      TEST_PROFILE_ID,
      "TailwindCSS",
      "user_deleted",
      afterStep3.profileVersion, // 4
    );
    expect(afterSuppress.profileVersion).toBe(5);
    expect(
      afterSuppress.capabilities.skills.some((s) => s.skill === "TailwindCSS"),
    ).toBe(false);
    expect(
      afterSuppress.capabilities.suppressed_skills.some(
        (s) => s.skill === "tailwindcss",
      ),
    ).toBe(true);

    // User adds Next.js
    const afterAdd = await service.addSkill(
      TEST_PROFILE_ID,
      "Next.js",
      "core",
      afterSuppress.profileVersion, // 5
    );
    expect(afterAdd.profileVersion).toBe(6);
    expect(
      afterAdd.capabilities.skills.some((s) => s.skill === "Next.js"),
    ).toBe(true);

    // 6. Step 4 Final Confirmation: Confirm Profile
    const confirmed = await service.confirmProfile(
      TEST_PROFILE_ID,
      {
        expected_version: afterAdd.profileVersion,
        career_intent: {
          target_roles: afterAdd.careerIntent.target_roles,
          target_level: afterAdd.careerIntent.target_level!,
          employment_types: afterAdd.careerIntent.employment_types,
        },
        preferences: afterAdd.preferences,
        constraints: afterAdd.constraints,
        capabilities: afterAdd.capabilities,
      },
      afterAdd.profileVersion, // 6
    );

    expect(confirmed.status).toBe("active");
    expect(confirmed.onboardingCompleted).toBe(true);
    expect(confirmed.profileVersion).toBe(7);
    expect(confirmed.confirmedAt).not.toBeNull();
  });

  it("should reject updates with VersionConflictError when expected_version is stale", async () => {
    // Initialize profile
    const draft = await service.getOrCreateDraft(TEST_PROFILE_ID);
    expect(draft.profileVersion).toBe(1);

    // Valid update advances version to 2
    await service.updateDraftStep(
      TEST_PROFILE_ID,
      2,
      { expected_version: 1 },
      1,
    );

    // Concurrent stale update with version 1 must throw VersionConflictError
    await expect(
      service.updateDraftStep(TEST_PROFILE_ID, 2, { expected_version: 1 }, 1),
    ).rejects.toThrow(VersionConflictError);

    // Confirmation with stale version 1 must also throw VersionConflictError
    await expect(
      service.confirmProfile(
        TEST_PROFILE_ID,
        {
          expected_version: 1,
          career_intent: {
            target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
            target_level: "junior",
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
            work_mode_strict: false,
            relocation_prohibited: false,
          },
        },
        1, // Stale! Current is 2
      ),
    ).rejects.toThrow(VersionConflictError);
  });
});
