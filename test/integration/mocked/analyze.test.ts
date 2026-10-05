import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { NextRequest } from "next/server";

const mockAuthUser = vi.fn();
const mockAdminSingle = vi.fn();
const mockWorkflow = vi.fn();
const { mockClassify, mockGetStatus, mockAdvance } = vi.hoisted(() => ({
  mockClassify: vi.fn(),
  mockGetStatus: vi.fn(),
  mockAdvance: vi.fn(),
}));
const { mockStorageRemove } = vi.hoisted(() => ({
  mockStorageRemove: vi.fn(),
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
    from: vi.fn((table: string) => {
      if (table === "resumes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockAdminSingle,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
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
    storage: {
      from: vi.fn(() => ({
        remove: mockStorageRemove.mockResolvedValue({ error: null }),
      })),
    },
  },
}));

vi.mock(
  "@/features/ai-analysis/services/analysis-orchestrator.service",
  () => ({
    runResumeAnalysisWorkflow: (...args: any[]) => mockWorkflow(...args),
  }),
);

vi.mock("@/lib/groq/document-classifier", () => ({
  classifyDocument: (...args: any[]) => mockClassify(...args),
}));

vi.mock("@/features/ai-analysis/services/resume-processing.service", () => ({
  resumeProcessingService: {
    getStatus: (...args: any[]) => mockGetStatus(...args),
    advance: (...args: any[]) => mockAdvance(...args),
  },
}));

describe("Integration (Mock-Based): /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStatus.mockResolvedValue(null);
    mockAdvance.mockResolvedValue({});
    mockClassify.mockResolvedValue({
      is_resume: true,
      document_type: "resume",
      confidence: 0.95,
      reason: "Clear resume structure",
    });
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
    expect(json.error).toContain("resumeId is required");
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
    expect(json.error).toContain("does not contain valid text on the server");
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
    expect(json.error).toContain("does not belong to you");
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

  it("should soft-block a classified non-resume with NEEDS_REVIEW and not run the workflow", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-review" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "res-1",
        profile_id: "user-review",
        raw_text:
          "This is an invoice document with subtotal and total amounts, not a resume.",
      },
      error: null,
    });
    mockClassify.mockResolvedValueOnce({
      is_resume: false,
      document_type: "invoice",
      confidence: 0.92,
      reason: "Contains invoice totals and payment details",
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-1" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("NEEDS_REVIEW");
    expect(json.classification.documentType).toBe("invoice");
    expect(mockWorkflow).not.toHaveBeenCalled();
    expect(mockAdvance).toHaveBeenCalledWith(
      "res-1",
      "user-review",
      "needs_review",
      undefined,
    );
  });

  it("should proceed with extraction when the user overrides a non-resume classification", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-override" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "res-1",
        profile_id: "user-override",
        raw_text:
          "This is a portfolio-style document with project experience and skills.",
        storage_path: "user-override/portfolio.pdf",
      },
      error: null,
    });
    mockClassify.mockResolvedValueOnce({
      is_resume: false,
      document_type: "portfolio",
      confidence: 0.4,
      reason: "Uncertain structure",
    });
    mockWorkflow.mockResolvedValueOnce({
      analysisId: "analysis-override",
      analysis: { candidate: { name: "Budi" } },
      jobMatches: [],
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-1", allowNonResume: true }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.contentDeleted).toBe(true);
    expect(mockWorkflow).toHaveBeenCalled();
    expect(mockAdvance).toHaveBeenCalledWith(
      "res-1",
      "user-override",
      "classified",
      expect.objectContaining({
        decision: "overridden",
        overriddenByUser: true,
      }),
    );
    expect(mockStorageRemove).toHaveBeenCalledWith([
      "user-override/portfolio.pdf",
    ]);
    expect(mockAdvance).toHaveBeenCalledWith(
      "res-1",
      "user-override",
      "completed",
      expect.objectContaining({
        decision: "overridden",
        rawContentDeletedAt: expect.any(String),
      }),
    );
  });

  it("should delete content and record a rejection when the user rejects the document", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-reject" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "res-reject",
        profile_id: "user-reject",
        raw_text: null,
        storage_path: "user-reject/invoice.pdf",
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/analyze", {
      method: "POST",
      body: JSON.stringify({ resumeId: "res-reject", decision: "reject" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.code).toBe("REJECTED");
    expect(json.contentDeleted).toBe(true);
    expect(mockStorageRemove).toHaveBeenCalledWith(["user-reject/invoice.pdf"]);
    expect(mockAdvance).toHaveBeenCalledWith(
      "res-reject",
      "user-reject",
      "rejected",
      expect.objectContaining({ decision: "rejected" }),
    );
  });
});
