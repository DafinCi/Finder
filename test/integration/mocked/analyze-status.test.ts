import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/analyze/status/route";

const { mockAuthUser, mockResumeSingle, mockGetStatus } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
  mockResumeSingle: vi.fn(),
  mockGetStatus: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockResumeSingle })),
      })),
    })),
  },
}));

vi.mock("@/features/ai-analysis/services/resume-processing.service", () => ({
  resumeProcessingService: {
    getStatus: mockGetStatus,
  },
}));

describe("Integration (Mock-Based): GET /api/analyze/status", () => {
  const user = { id: "user-1" };
  const resumeId = "resume-1";
  const url = `http://localhost:3000/api/analyze/status?resumeId=${resumeId}`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.mockResolvedValue({ data: { user }, error: null });
    mockResumeSingle.mockResolvedValue({
      data: { id: resumeId, profile_id: user.id, status: "uploaded" },
      error: null,
    });
    mockGetStatus.mockResolvedValue(null);
  });

  it("should return 401 when unauthenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(401);
  });

  it("should return 400 when resumeId is missing", async () => {
    const res = await GET(
      new NextRequest("http://localhost:3000/api/analyze/status"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 404 when the resume does not exist", async () => {
    mockResumeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(404);
  });

  it("should return 403 when the resume belongs to another user", async () => {
    mockResumeSingle.mockResolvedValueOnce({
      data: { id: resumeId, profile_id: "someone-else", status: "uploaded" },
      error: null,
    });
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(403);
  });

  it("should return the persisted processing state for the owner", async () => {
    mockGetStatus.mockResolvedValueOnce({
      resumeId,
      profileId: user.id,
      stage: "classifying",
      documentType: null,
      isResume: null,
      classificationConfidence: null,
      classificationReason: null,
      heuristicScore: 0.8,
      decision: null,
      overriddenByUser: false,
      errorCode: null,
      errorMessage: null,
      rawContentDeletedAt: null,
      createdAt: "2026-10-04T00:00:00.000Z",
      updatedAt: "2026-10-04T00:00:05.000Z",
    });

    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.hasProcessingState).toBe(true);
    expect(json.resumeStatus).toBe("uploaded");
    expect(json.processing.stage).toBe("classifying");
    expect(mockGetStatus).toHaveBeenCalledWith(resumeId, user.id);
  });

  it("should report no processing state when the row is absent", async () => {
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.hasProcessingState).toBe(false);
    expect(json.processing).toBeNull();
  });
});
