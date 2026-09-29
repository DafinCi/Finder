import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  profileClientService,
  ProfileClientVersionConflictError,
  ProfileClientError,
} from "@/features/profile/services/profile-client.service";
import { CareerProfile } from "@/features/profile/types/career-profile.types";

describe("Phase 2B: Profile Client Service Unit Tests", () => {
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
    status: "active",
    onboardingCompleted: true,
    currentOnboardingStep: 4,
    profileVersion: 2,
    profileOrigin: "web",
    background: { education: [], experience: [], projects: [] },
    capabilities: {
      extraction_status: "success",
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
      suppressed_skills: [],
    },
    careerIntent: {
      target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
      target_level: "mid_level",
      employment_types: ["full_time"],
    },
    preferences: {
      locations: ["Remote"],
      work_modes: ["remote"],
      priorities: ["mentorship"],
      salary: null,
      negative_preferences: [],
    },
    constraints: { relocation_prohibited: false, work_mode_strict: false },
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("getProfile", () => {
    it("should return profile when API returns 200", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: mockProfile }),
      });

      const res = await profileClientService.getProfile();
      expect(res).toEqual(mockProfile);
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/profile", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
    });

    it("should return null when API returns 401 unauthorized", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      const res = await profileClientService.getProfile();
      expect(res).toBeNull();
    });

    it("should throw ProfileClientError when API returns 500", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      });

      await expect(profileClientService.getProfile()).rejects.toThrow(
        ProfileClientError,
      );
    });
  });

  describe("getOrCreateProfile", () => {
    it("should initialize profile on POST /api/profile", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ profile: mockProfile }),
      });

      const res = await profileClientService.getOrCreateProfile();
      expect(res).toEqual(mockProfile);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ origin: "web" }),
        }),
      );
    });
  });

  describe("updateCareerIntent", () => {
    it("should send PATCH to /api/profile/career-intent with expected_version", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          profile: { ...mockProfile, profileVersion: 3 },
        }),
      });

      const intentInput = {
        target_roles: [
          { role: "Fullstack Engineer", priority: "primary" as const },
        ],
        target_level: "senior" as const,
        employment_types: ["full_time" as const],
      };

      const res = await profileClientService.updateCareerIntent(intentInput, 2);
      expect(res.profileVersion).toBe(3);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/profile/career-intent",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            expected_version: 2,
            career_intent: intentInput,
          }),
        }),
      );
    });

    it("should throw ProfileClientVersionConflictError on 409", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Version conflict",
          expectedVersion: 2,
          currentVersion: 3,
        }),
      });

      await expect(
        profileClientService.updateCareerIntent(
          {
            target_roles: [{ role: "Frontend", priority: "primary" }],
            target_level: null,
            employment_types: ["full_time"],
          },
          2,
        ),
      ).rejects.toThrow(ProfileClientVersionConflictError);
    });
  });

  describe("updatePreferences", () => {
    it("should send PATCH to /api/profile/preferences", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          profile: { ...mockProfile, profileVersion: 3 },
        }),
      });

      const prefsInput = {
        locations: ["Singapore"],
        work_modes: ["remote" as const],
        priorities: ["mentorship"],
        salary: null,
        negative_preferences: [],
      };
      const constraintsInput = {
        relocation_prohibited: false,
        work_mode_strict: true,
      };

      const res = await profileClientService.updatePreferences(
        prefsInput,
        constraintsInput,
        2,
      );
      expect(res.profileVersion).toBe(3);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/profile/preferences",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            expected_version: 2,
            preferences: prefsInput,
            constraints: constraintsInput,
          }),
        }),
      );
    });
  });

  describe("updateSkills", () => {
    it("should send PATCH to /api/profile/skills with action payload", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          profile: { ...mockProfile, profileVersion: 3 },
        }),
      });

      const res = await profileClientService.updateSkills({
        action: "add",
        expected_version: 2,
        skill: "Docker",
        category: "tool",
      });

      expect(res.profileVersion).toBe(3);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/profile/skills",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            action: "add",
            expected_version: 2,
            skill: "Docker",
            category: "tool",
          }),
        }),
      );
    });
  });

  describe("updateBackground", () => {
    it("should send PATCH to /api/profile/background", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          profile: { ...mockProfile, profileVersion: 3 },
        }),
      });

      const bg = { education: [], experience: [], projects: [] };
      const res = await profileClientService.updateBackground(bg, 2);

      expect(res.profileVersion).toBe(3);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/profile/background",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            expected_version: 2,
            background: bg,
          }),
        }),
      );
    });
  });
});
