import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as getProfile,
  POST as postProfile,
} from "@/app/api/profile/route";
import { PATCH as patchDraft } from "@/app/api/profile/draft/route";
import { POST as postConfirm } from "@/app/api/profile/confirm/route";
import { NextRequest } from "next/server";
import { VersionConflictError } from "@/features/profile/errors/profile-errors";

const { mockAuthUser, mockCareerProfileService } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
  mockCareerProfileService: {
    getProfile: vi.fn(),
    getOrCreateDraft: vi.fn(),
    updateDraftStep: vi.fn(),
    confirmProfile: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/features/profile/services/career-profile.service", () => ({
  careerProfileService: mockCareerProfileService,
}));

describe("Integration (Mock-Based): Profile API Routes", () => {
  const sampleUser = {
    id: "b0000000-0000-4000-8000-000000000001",
    email: "candidate@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new NextRequest("http://localhost:3000/api/profile", {
        method: "GET",
      });
      const res = await getProfile(req);

      expect(res.status).toBe(401);
    });

    it("should return candidate profile when authenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockCareerProfileService.getProfile.mockResolvedValueOnce({
        id: "a1",
        userId: sampleUser.id,
        status: "active",
      });

      const req = new NextRequest("http://localhost:3000/api/profile", {
        method: "GET",
      });
      const res = await getProfile(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.profile.userId).toBe(sampleUser.id);
    });
  });

  describe("POST /api/profile", () => {
    it("should initialize draft profile for authenticated user", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockCareerProfileService.getOrCreateDraft.mockResolvedValueOnce({
        id: "a1",
        userId: sampleUser.id,
        status: "draft",
      });

      const req = new NextRequest("http://localhost:3000/api/profile", {
        method: "POST",
        body: JSON.stringify({ origin: "web" }),
      });
      const res = await postProfile(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.profile.status).toBe("draft");
      expect(mockCareerProfileService.getOrCreateDraft).toHaveBeenCalledWith(
        sampleUser.id,
        "web",
      );
    });
  });

  describe("PATCH /api/profile/draft", () => {
    it("should return 400 when expected_version is missing", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/profile/draft", {
        method: "PATCH",
        body: JSON.stringify({ current_step: 2 }), // missing expected_version
      });
      const res = await patchDraft(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("expected_version");
    });

    it("should return 409 when optimistic CAS detects version conflict", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockCareerProfileService.updateDraftStep.mockRejectedValueOnce(
        new VersionConflictError(1, 2),
      );

      const req = new NextRequest("http://localhost:3000/api/profile/draft", {
        method: "PATCH",
        body: JSON.stringify({
          expected_version: 1,
          current_step: 2,
        }),
      });
      const res = await patchDraft(req);

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.expectedVersion).toBe(1);
      expect(data.currentVersion).toBe(2);
    });

    it("should return 200 with updated profile on successful CAS update", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockCareerProfileService.updateDraftStep.mockResolvedValueOnce({
        id: "a1",
        userId: sampleUser.id,
        profileVersion: 2,
        currentOnboardingStep: 2,
      });

      const req = new NextRequest("http://localhost:3000/api/profile/draft", {
        method: "PATCH",
        body: JSON.stringify({
          expected_version: 1,
          current_step: 2,
        }),
      });
      const res = await patchDraft(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.profile.profileVersion).toBe(2);
    });
  });

  describe("POST /api/profile/confirm", () => {
    it("should return 400 when expected_version is missing", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/profile/confirm", {
        method: "POST",
        body: JSON.stringify({
          career_intent: {
            target_roles: [{ role: "Frontend Developer", priority: "primary" }],
          },
        }),
      });
      const res = await postConfirm(req);
      expect(res.status).toBe(400);
    });

    it("should finalize and confirm profile when valid payload and version provided", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockCareerProfileService.confirmProfile.mockResolvedValueOnce({
        id: "a1",
        userId: sampleUser.id,
        status: "active",
        onboardingCompleted: true,
      });

      const req = new NextRequest("http://localhost:3000/api/profile/confirm", {
        method: "POST",
        body: JSON.stringify({
          expected_version: 1,
          career_intent: {
            target_roles: [{ role: "Frontend Developer", priority: "primary" }],
            target_level: "mid_level",
            employment_types: ["full_time"],
          },
          preferences: {
            locations: ["Remote"],
            work_modes: ["remote"],
            priorities: [],
            salary: null,
            negative_preferences: [],
          },
          constraints: {
            relocation_prohibited: false,
            work_mode_strict: false,
          },
        }),
      });

      const res = await postConfirm(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.profile.status).toBe("active");
      expect(data.profile.onboardingCompleted).toBe(true);
    });
  });
});
