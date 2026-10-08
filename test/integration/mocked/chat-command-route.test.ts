import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/chat/message/route";

const {
  mockAuthUser,
  mockSessionSingle,
  mockRememberFact,
  mockExecuteStream,
} = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
  mockSessionSingle: vi.fn(),
  mockRememberFact: vi.fn(),
  mockExecuteStream: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockAuthUser },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === "chat_sessions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ single: mockSessionSingle }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "chat_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "msg-created", role: "assistant" },
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

vi.mock("@/lib/groq/client", () => ({
  groq: {},
  DEFAULT_GROQ_MODEL: "test-model",
  normalizeGroqError: (error: unknown) => String(error),
  estimateTokens: () => 1,
  executeStreamWithResilience: mockExecuteStream,
}));

vi.mock("@/features/memory/services/career-memory.service", () => ({
  careerMemoryService: { rememberFact: mockRememberFact },
}));

function buildRequest(content: string) {
  return new NextRequest("http://localhost:3000/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: "session-1", content }),
  });
}

describe("POST /api/chat/message slash commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSessionSingle.mockResolvedValue({
      data: { id: "session-1", user_id: "user-1", resume_id: null },
      error: null,
    });
    mockRememberFact.mockResolvedValue({
      id: "memory-1",
      category: "work_preference",
      content: "I only want remote roles",
      status: "active",
      walrusStatus: "pending",
      walrusBlobId: null,
      supersedesId: null,
    });
  });

  it("saves memory through the shared service without calling the model", async () => {
    const res = await POST(buildRequest("/remember I only want remote roles"));
    const body = await res.text();

    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(mockRememberFact).toHaveBeenCalledTimes(1);
    expect(mockRememberFact).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        category: "work_preference",
        content: "I only want remote roles",
        source: "explicit_user",
      }),
    );
    expect(mockExecuteStream).not.toHaveBeenCalled();
    expect(body).toContain("chat_command");
    expect(body).toContain("memory-1");
    expect(body).toContain('"done":true');
  });

  it("honours an explicit category", async () => {
    await POST(buildRequest("/remember tech_focus I am learning Rust"));

    expect(mockRememberFact).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ category: "tech_focus" }),
    );
  });

  it("does not write memory when /remember has no fact", async () => {
    const res = await POST(buildRequest("/remember"));
    const body = await res.text();

    expect(mockRememberFact).not.toHaveBeenCalled();
    expect(mockExecuteStream).not.toHaveBeenCalled();
    expect(body).toContain("MISSING_CONTENT");
  });

  it("lists commands for /help without calling the model", async () => {
    const res = await POST(buildRequest("/help"));
    const body = await res.text();

    expect(mockRememberFact).not.toHaveBeenCalled();
    expect(mockExecuteStream).not.toHaveBeenCalled();
    expect(body).toContain("Available commands");
    expect(body).toContain("/remember");
  });
});
