import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  onboardingService,
  OnboardingVersionConflictError,
  OnboardingApiError,
} from "@/features/onboarding/services/onboarding.service";
import { CareerProfile } from "@/features/profile/types/career-profile.types";

describe("Phase 1E: Onboarding Service Unit Tests", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockProfile: CareerProfile = {
    id: "profile-uuid-1",
    userId: "user-uuid-1",
    resumeId: null,
    status: "draft",
    onboardingCompleted: false,
    currentOnboardingStep: 1,
    profileVersion: 1,
    profileOrigin: "web",
    background: { education: [], experience: [], projects: [] },
    capabilities: {
      extraction_status: "unattempted",
      skills: [],
      suppressed_skills: [],
    },
    careerIntent: {
      target_roles: [],
      target_level: null,
      employment_types: ["full_time"],
    },
    preferences: {
      locations: [],
      work_modes: ["remote"],
      priorities: [],
      salary: null,
      negative_preferences: [],
    },
    constraints: { relocation_prohibited: false, work_mode_strict: false },
    confirmedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("fetchProfile should return profile when found", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ profile: mockProfile }),
    });

    const result = await onboardingService.fetchProfile();
    expect(result).toEqual(mockProfile);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("fetchProfile should return null when profile is null", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ profile: null }),
    });

    const result = await onboardingService.fetchProfile();
    expect(result).toBeNull();
  });

  it("fetchProfile should throw OnboardingApiError on 401", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    await expect(onboardingService.fetchProfile()).rejects.toThrow(
      OnboardingApiError,
    );
  });

  it("initializeDraft should call POST /api/profile and return created profile", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ profile: mockProfile }),
    });

    const result = await onboardingService.initializeDraft();
    expect(result).toEqual(mockProfile);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("saveDraftStep should return updated profile on successful CAS update", async () => {
    const updatedProfile = {
      ...mockProfile,
      profileVersion: 2,
      currentOnboardingStep: 2,
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ profile: updatedProfile }),
    });

    const result = await onboardingService.saveDraftStep({
      expected_version: 1,
      current_step: 2,
    });

    expect(result.profileVersion).toBe(2);
    expect(result.currentOnboardingStep).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/profile/draft",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("saveDraftStep should throw OnboardingVersionConflictError on 409 conflict", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Version conflict: profile has been updated",
        expectedVersion: 1,
        currentVersion: 3,
      }),
    });

    await expect(
      onboardingService.saveDraftStep({
        expected_version: 1,
        current_step: 2,
      }),
    ).rejects.toThrow(OnboardingVersionConflictError);
  });

  it("confirmProfile should return confirmed profile on success", async () => {
    const confirmedProfile = {
      ...mockProfile,
      status: "active" as const,
      onboardingCompleted: true,
      profileVersion: 2,
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ profile: confirmedProfile }),
    });

    const result = await onboardingService.confirmProfile({
      expected_version: 1,
      career_intent: {
        target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
        target_level: "junior",
        employment_types: ["full_time"],
      },
      preferences: {
        locations: ["Indonesia"],
        work_modes: ["remote"],
        priorities: ["modern_tech"],
        salary: null,
        negative_preferences: [],
      },
      constraints: {
        work_mode_strict: false,
        relocation_prohibited: false,
      },
    });

    expect(result.status).toBe("active");
    expect(result.onboardingCompleted).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/profile/confirm",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("confirmProfile should throw OnboardingVersionConflictError on 409", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: "Version conflict",
        expectedVersion: 1,
        currentVersion: 4,
      }),
    });

    await expect(
      onboardingService.confirmProfile({
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
      }),
    ).rejects.toThrow(OnboardingVersionConflictError);
  });

  it("uploadResume should send FormData and return resumeId", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        resumeId: "resume-123",
        fileName: "resume.pdf",
      }),
    });

    const dummyFile = new File(["dummy pdf content"], "resume.pdf", {
      type: "application/pdf",
    });
    const result = await onboardingService.uploadResume(dummyFile);

    expect(result.success).toBe(true);
    expect(result.resumeId).toBe("resume-123");
    expect(result.fileName).toBe("resume.pdf");
  });

  it("analyzeResume should send resumeId and return parsed analysis", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Analysis complete",
        analysisId: "analysis-999",
        analysis: {
          candidate: {
            name: "Alice",
            title: "Frontend Engineer",
            years_of_experience: 2,
            summary: "Passionate developer",
            skills: {
              core: ["React", "TypeScript"],
              supporting: ["TailwindCSS"],
            },
            experience: [],
            education: [],
          },
          career: {
            recommended_roles: ["Frontend Engineer"],
            career_level: "Junior",
            strengths: ["Clean code"],
            weaknesses: [],
          },
        },
      }),
    });

    const result = await onboardingService.analyzeResume("resume-123");
    expect(result.success).toBe(true);
    expect(result.analysis?.candidate.name).toBe("Alice");
    expect(result.analysis?.candidate.skills.core).toContain("React");
  });
});
