import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/message/route";
import { NextRequest } from "next/server";

const mockAuthUser = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminInsert = vi.fn();
const mockGroqCreate = vi.fn();

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
      if (table === "chat_sessions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockAdminSingle,
              }),
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
                data: { id: "msg-created" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (
        table === "resumes" ||
        table === "resume_analysis" ||
        table === "job_matches" ||
        table === "jobs"
      ) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
              limit: vi.fn().mockResolvedValue({ data: [] }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
        };
      }
      return {};
    }),
  },
}));

vi.mock("@/lib/groq/client", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    groq: {
      chat: {
        completions: {
          create: (...args: any[]) => mockGroqCreate(...args),
        },
      },
    },
  };
});

describe("Integration (Mock-Based): /api/chat/message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when request is unauthenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ session_id: "ses-1", content: "Halo" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("should return 400 when prompt exceeds MAX_PROMPT_CHARS (2000)", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-test" } },
      error: null,
    });

    const excessivePrompt = "a".repeat(2001);
    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ session_id: "ses-1", content: excessivePrompt }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/maksimal 2000 karakter/i);
  });

  it("should return 404 when session belongs to another user (IDOR prevention)", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "attacker-user-id" } },
      error: null,
    });
    // Query with .eq("id", ...).eq("user_id", attackerId) yields no record
    mockAdminSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "PGRST116" },
    });

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ session_id: "ses-victim", content: "Halo" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("tidak ditemukan");
  });

  it("should switch to fallback model when primary model encounters 429 rate limit", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: { id: "ses-legit", user_id: "user-legit" },
      error: null,
    });

    // 1st call fails with 429 Rate Limit
    mockGroqCreate.mockRejectedValueOnce(
      new Error("Rate limit reached. 429 Too Many Requests"),
    );

    // 2nd call (fallback model) succeeds with async chunk stream
    const mockChunks = [
      { choices: [{ delta: { content: "Halo " } }] },
      {
        choices: [{ delta: { content: "rekan!" } }],
        usage: { total_tokens: 45 },
      },
    ];
    async function* makeStream() {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    }
    mockGroqCreate.mockResolvedValueOnce(makeStream());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: "ses-legit",
        content: "Bagaimana persiapan interview saya?",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(mockGroqCreate).toHaveBeenCalledTimes(2);

    // Verify fallback model was called in 2nd attempt
    const fallbackCallArgs = mockGroqCreate.mock.calls[1][0];
    expect(fallbackCallArgs.model).toBe("openai/gpt-oss-20b");
  });
});
