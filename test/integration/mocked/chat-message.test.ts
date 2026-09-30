import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/message/route";
import { NextRequest } from "next/server";
import { agentToolDispatcher } from "@/features/agent/services/agent-tool-dispatcher.service";

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
        table === "jobs" ||
        table === "career_memories" ||
        table === "career_profiles"
      ) {
        const queryChain: any = {};
        queryChain.eq = vi.fn().mockReturnValue(queryChain);
        queryChain.neq = vi.fn().mockReturnValue(queryChain);
        queryChain.order = vi.fn().mockReturnValue(queryChain);
        queryChain.single = vi.fn().mockResolvedValue({ data: null, error: null });
        queryChain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        queryChain.limit = vi.fn(() => ({
          ...queryChain,
          then: (resolve: any) => Promise.resolve({ data: [] }).then(resolve),
        }));
        return {
          select: vi.fn().mockReturnValue(queryChain),
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

  it("should handle agent tool calling with tool_start, tool_end, Turn 2 synthesis, and stream results", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-agent-test" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: { id: "ses-agent", user_id: "user-agent-test" },
      error: null,
    });

    const executeSpy = vi
      .spyOn(agentToolDispatcher, "executeTool")
      .mockResolvedValueOnce({
        success: true,
        toolName: "save_job",
        data: { success: true, message: "Job saved successfully" },
      });

    // Turn 1: LLM returns tool_calls delta
    const turn1Chunks = [
      {
        choices: [
          {
            delta: {
              content: null,
              tool_calls: [
                {
                  index: 0,
                  id: "call_save_123",
                  type: "function" as const,
                  function: {
                    name: "save_job",
                    arguments: JSON.stringify({
                      jobId: "550e8400-e29b-41d4-a716-446655440000",
                    }),
                  },
                },
              ],
            },
          },
        ],
      },
    ];

    // Turn 2: LLM synthesizes natural response
    const turn2Chunks = [
      {
        choices: [
          {
            delta: {
              content: "Lowongan berhasil disimpan ke bookmark Anda.",
            },
          },
        ],
      },
      {
        choices: [{ delta: { content: " Ada yang lain?" } }],
        usage: { total_tokens: 60 },
      },
    ];

    async function* makeTurn1() {
      for (const c of turn1Chunks) yield c;
    }
    async function* makeTurn2() {
      for (const c of turn2Chunks) yield c;
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: "ses-agent",
        content: "Tolong simpan lowongan tersebut",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(executeSpy).toHaveBeenCalledWith(
      "user-agent-test",
      "save_job",
      { jobId: "550e8400-e29b-41d4-a716-446655440000" },
    );
    expect(text).toContain('"type":"tool_start"');
    expect(text).toContain('"tool":"save_job"');
    expect(text).toContain('"type":"tool_end"');
    expect(text).toContain("Lowongan berhasil disimpan");
    expect(text).toContain('"done":true');
  });

  it("should emit action_proposal event and attach proposal to done payload and db metadata", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-proposal-test" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: { id: "ses-proposal", user_id: "user-proposal-test" },
      error: null,
    });

    const mockProposal = {
      type: "preference_update" as const,
      proposedChanges: { workMode: ["remote" as const] },
      summary: "Mengubah preferensi kerja menjadi remote",
    };

    vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: true,
      toolName: "propose_preference_update",
      actionProposal: mockProposal,
    });

    const turn1Chunks = [
      {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_prop_123",
                  type: "function" as const,
                  function: {
                    name: "propose_preference_update",
                    arguments: JSON.stringify({ workMode: ["remote"] }),
                  },
                },
              ],
            },
          },
        ],
      },
    ];

    const turn2Chunks = [
      {
        choices: [
          {
            delta: {
              content: "Saya telah menyiapkan usulan perubahan preferensi.",
            },
          },
        ],
      },
    ];

    async function* makeTurn1() {
      for (const c of turn1Chunks) yield c;
    }
    async function* makeTurn2() {
      for (const c of turn2Chunks) yield c;
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: "ses-proposal",
        content: "Saya ingin kerja remote saja",
      }),
    });
    const res = await POST(req);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain('"type":"action_proposal"');
    expect(text).toContain("Mengubah preferensi kerja menjadi remote");
    expect(text).toContain('"actionProposal":{');
  });

  it("should emit memory_updated event when sovereign memory is added", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-mem-test" } },
      error: null,
    });
    mockAdminSingle.mockResolvedValueOnce({
      data: { id: "ses-mem", user_id: "user-mem-test" },
      error: null,
    });

    vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: true,
      toolName: "remember_fact",
      memoryUpdated: {
        id: "mem-uuid-1",
        category: "tech_focus",
        content: "Fokus ke Rust dan Go",
        walrusStatus: "pending",
      },
    });

    const turn1Chunks = [
      {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_mem_123",
                  type: "function" as const,
                  function: {
                    name: "remember_fact",
                    arguments: JSON.stringify({
                      category: "tech_focus",
                      content: "Fokus ke Rust dan Go",
                    }),
                  },
                },
              ],
            },
          },
        ],
      },
    ];

    const turn2Chunks = [
      {
        choices: [
          {
            delta: {
              content:
                "Saya telah mencatat fokus teknologi Anda ke Rust dan Go.",
            },
          },
        ],
      },
    ];

    async function* makeTurn1() {
      for (const c of turn1Chunks) yield c;
    }
    async function* makeTurn2() {
      for (const c of turn2Chunks) yield c;
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: "ses-mem",
        content: "Ingat saya fokus Rust dan Go",
      }),
    });
    const res = await POST(req);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }

    expect(text).toContain('"type":"memory_updated"');
    expect(text).toContain('"memoryUpdated":true');
  });
});
