import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { NextRequest } from "next/server";

const mockAuthUser = vi.fn();
const mockAdminSingle = vi.fn();
const mockWorkflow = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "resumes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockAdminSingle,
            }),
          }),
        };
      }
      if (table === "chat_sessions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockAdminSingle,
            }),
          }),
        };
      }
      return {};
    }),
  },
}));

vi.mock(
  "@/features/ai-analysis/services/analysis-orchestrator.service",
  () => ({
    runResumeAnalysisWorkflow: (...args: any[]) => mockWorkflow(...args),
  }),
);

describe("Integration (Mock-Based): /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when request is unauthenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-1" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("should return 400 when resumeId is missing", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("resumeId wajib dikirim");
  });

  it("should return 404 when resume is not found in database", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-missing" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("should return 403 Forbidden when resume belongs to another user", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "attacker-user-id" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "res-victim",
        profile_id: "victim-user-id",
        raw_text: "Valid content",
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-victim" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("should return 400 when canonical database raw_text is empty or too short (<50 chars)", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: { id: "res-1", profile_id: "user-123", raw_text: "Too short" },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        resumeId: "res-1",
        rawText: "Client attempting to inject synthetic text",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("tidak memiliki teks yang valid di server");
  });

  it("should return 403 when sessionId is provided but belongs to another user", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    // First call: resume belongs to user
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "res-1",
        profile_id: "user-123",
        raw_text:
          "Valid long resume text with more than 50 characters for testing",
      },
      error: null,
    });
    // Second call: session belongs to another user
    mockAdminSingle.mockResolvedValueOnce({
      data: { id: "session-other", user_id: "user-999" },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-1", sessionId: "session-other" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("bukan milik Anda");
  });

  it("should execute workflow and return 200 when all validation passes", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "res-1",
        profile_id: "user-123",
        raw_text:
          "Valid long resume text with more than 50 characters for testing",
      },
      error: null,
    });

    mockWorkflow.mockResolvedValueOnce({
      analysisId: "analysis-999",
      candidateProfile: { name: "Budi" },
      jobMatches: [],
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-1" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.analysisId).toBe("analysis-999");
  });
});
