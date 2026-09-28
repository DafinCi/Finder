import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CareerProfileRepository,
  CareerProfileDbRow,
} from "@/features/profile/repositories/career-profile.repository";
import {
  ProfileNotFoundError,
  VersionConflictError,
} from "@/features/profile/errors/profile-errors";

describe("Unit: CareerProfileRepository", () => {
  let mockClient: any;
  let repo: CareerProfileRepository;

  const sampleDbRow: CareerProfileDbRow = {
    id: "a0000000-0000-4000-8000-000000000001",
    profile_id: "b0000000-0000-4000-8000-000000000001",
    resume_id: null,
    status: "draft",
    onboarding_completed: false,
    current_onboarding_step: 1,
    profile_version: 1,
    profile_origin: "web",
    background: {
      education: [],
      experience: [],
      projects: [],
    },
    capabilities: {
      extraction_status: "unattempted",
      skills: [],
      suppressed_skills: [],
    },
    career_intent: {
      target_roles: [],
      target_level: null,
      employment_types: [],
    },
    preferences: {
      locations: [],
      work_modes: [],
      priorities: [],
      salary: null,
      negative_preferences: [],
    },
    constraints: {
      relocation_prohibited: false,
      work_mode_strict: false,
    },
    confirmed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("findByProfileId", () => {
    it("should return parsed domain CareerProfile when record is found", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: sampleDbRow,
                error: null,
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      const result = await repo.findByProfileId(
        "b0000000-0000-4000-8000-000000000001",
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(sampleDbRow.id);
      expect(result?.userId).toBe(sampleDbRow.profile_id);
      expect(result?.profileVersion).toBe(1);
      expect(result?.status).toBe("draft");
    });

    it("should return null when profile does not exist", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      const result = await repo.findByProfileId(
        "b0000000-0000-4000-8000-000000000099",
      );
      expect(result).toBeNull();
    });

    it("should throw when query encounters database error", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("DB Connection timeout"),
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      await expect(
        repo.findByProfileId("b0000000-0000-4000-8000-000000000001"),
      ).rejects.toThrow("DB Connection timeout");
    });
  });

  describe("createDraft", () => {
    it("should be idempotent: return existing profile if one already exists", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: sampleDbRow,
                error: null,
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      const result = await repo.createDraft(
        "b0000000-0000-4000-8000-000000000001",
      );
      expect(result.id).toBe(sampleDbRow.id);
      expect(result.status).toBe("draft");
    });

    it("should insert a new draft when no profile exists", async () => {
      const maybeSingleMock = vi
        .fn()
        .mockResolvedValue({ data: null, error: null });
      const singleInsertMock = vi
        .fn()
        .mockResolvedValue({ data: sampleDbRow, error: null });

      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: maybeSingleMock,
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: singleInsertMock,
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      const result = await repo.createDraft(
        "b0000000-0000-4000-8000-000000000001",
        {
          origin: "web",
        },
      );

      expect(result.id).toBe(sampleDbRow.id);
    });
  });

  describe("updateProfileWithCas (Optimistic Concurrency Control)", () => {
    it("should successfully update and return incremented profile when versions match", async () => {
      const updatedRow = {
        ...sampleDbRow,
        current_onboarding_step: 2,
        profile_version: 2,
      };

      mockClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: updatedRow,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      const result = await repo.updateProfileWithCas(
        "b0000000-0000-4000-8000-000000000001",
        { currentOnboardingStep: 2 },
        1, // expected version
      );

      expect(result.profileVersion).toBe(2);
      expect(result.currentOnboardingStep).toBe(2);
    });

    it("should throw VersionConflictError (409) when expected version does not match DB version", async () => {
      // First update call returns null (0 rows matched profile_version)
      // Second select call returns current DB version = 2
      mockClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // CAS failed!
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { profile_version: 2 },
                error: null,
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);

      await expect(
        repo.updateProfileWithCas(
          "b0000000-0000-4000-8000-000000000001",
          { currentOnboardingStep: 2 },
          1, // Stale expected version
        ),
      ).rejects.toThrow(VersionConflictError);
    });

    it("should throw ProfileNotFoundError (404) when CAS fails because profile does not exist", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null, // Profile not found at all
                error: null,
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);

      await expect(
        repo.updateProfileWithCas(
          "b0000000-0000-4000-8000-000000000099",
          { currentOnboardingStep: 2 },
          1,
        ),
      ).rejects.toThrow(ProfileNotFoundError);
    });
  });

  describe("confirmProfile", () => {
    it("should set status to active and onboardingCompleted to true", async () => {
      const activeRow = {
        ...sampleDbRow,
        status: "active" as const,
        onboarding_completed: true,
        current_onboarding_step: 4,
        profile_version: 2,
        confirmed_at: new Date().toISOString(),
        career_intent: {
          target_roles: [
            { role: "Fullstack Developer", priority: "primary" as const },
          ],
          target_level: "mid_level" as const,
          employment_types: ["full_time" as const],
        },
        preferences: {
          ...sampleDbRow.preferences,
          work_modes: ["remote" as const],
        },
      };

      mockClient = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: activeRow,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      repo = new CareerProfileRepository(mockClient);
      const result = await repo.confirmProfile(
        "b0000000-0000-4000-8000-000000000001",
        {
          careerIntent: activeRow.career_intent,
          preferences: activeRow.preferences,
          constraints: activeRow.constraints,
        },
        1,
      );

      expect(result.status).toBe("active");
      expect(result.onboardingCompleted).toBe(true);
      expect(result.currentOnboardingStep).toBe(4);
      expect(result.confirmedAt).not.toBeNull();
    });
  });
});
