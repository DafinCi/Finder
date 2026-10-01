import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/chat/message/[id]/route";
import { NextRequest } from "next/server";

const mockAuthUser = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminUpdate = vi.fn();

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
      if (table === "chat_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockAdminSingle,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(mockAdminUpdate()),
          }),
        };
      }
      if (table === "chat_sessions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "session-123", user_id: "user-legit" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    }),
  },
}));

describe("PATCH /api/chat/message/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminUpdate.mockResolvedValue({ error: null });
  });

  it("should reject unauthenticated request with 401", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message/msg-1", {
      method: "PATCH",
      body: JSON.stringify({ action_proposal_status: "applied" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "msg-1" }) });
    expect(res.status).toBe(401);
  });

  it("should reject invalid status with 400", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message/msg-1", {
      method: "PATCH",
      body: JSON.stringify({ action_proposal_status: "invalid_status" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "msg-1" }) });
    expect(res.status).toBe(400);
  });

  it("should return 404 when message is not found", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message/msg-not-found", {
      method: "PATCH",
      body: JSON.stringify({ action_proposal_status: "applied" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "msg-not-found" }) });
    expect(res.status).toBe(404);
  });

  it("should return 200 and persist applied status in metadata", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "msg-1",
        session_id: "session-123",
        metadata: {
          action_proposal: {
            type: "preference_update",
            summary: "Buka remote",
            status: "proposed",
          },
        },
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message/msg-1", {
      method: "PATCH",
      body: JSON.stringify({ action_proposal_status: "applied" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "msg-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.metadata.action_proposal.status).toBe("applied");
  });

  it("should return 200 and persist feedback in metadata", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: {
        id: "msg-1",
        session_id: "session-123",
        metadata: {
          previous_info: "sample",
        },
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message/msg-1", {
      method: "PATCH",
      body: JSON.stringify({ feedback: "helpful" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "msg-1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.metadata.feedback).toBe("helpful");
    expect(json.metadata.previous_info).toBe("sample");
  });

  it("should reject invalid feedback value with 400", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message/msg-1", {
      method: "PATCH",
      body: JSON.stringify({ feedback: "invalid_feedback_type" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "msg-1" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid feedback value");
  });
});
