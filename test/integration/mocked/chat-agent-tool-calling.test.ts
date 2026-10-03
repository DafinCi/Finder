import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/message/route";
import { NextRequest } from "next/server";
import { agentToolDispatcher } from "@/features/agent/services/agent-tool-dispatcher.service";

const mockAuthUser = vi.fn();
const mockAdminSingle = vi.fn();
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
                data: { id: "msg-persisted-123" },
                error: null,
              }),
            }),
          }),
        };
      }
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

async function readSseStream(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value);
  }
  return result;
}

describe("Phase 5 Integration: Chat Agent Tool Calling & Sovereign Memory E2E Flow", () => {
  const testUser = { id: "user-agent-e2e-001" };
  const testSession = { id: "session-e2e-001", user_id: testUser.id };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.mockResolvedValue({
      data: { user: testUser },
      error: null,
    });
    mockAdminSingle.mockResolvedValue({
      data: testSession,
      error: null,
    });
  });

  it("1. should stream direct answer without tools for ordinary career questions", async () => {
    async function* makeTextStream() {
      yield { choices: [{ delta: { content: "Strategi terbaik " } }] };
      yield { choices: [{ delta: { content: "untuk persiapan interview Anda adalah..." } }], usage: { total_tokens: 30 } };
    }
    mockGroqCreate.mockResolvedValueOnce(makeTextStream());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Bagaimana tips interview backend developer?",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const sseText = await readSseStream(res);
    expect(sseText).toContain("Strategi terbaik ");
    expect(sseText).toContain("untuk persiapan interview Anda adalah...");
    expect(sseText).not.toContain('"type":"tool_start"');
    expect(sseText).not.toContain('"type":"action_proposal"');
    expect(sseText).toContain('"done":true');
  });

  it("2. should orchestrate get_career_recommendations tool lifecycle and Turn 2 synthesis", async () => {
    const mockJobs = [
      {
        id: "job-uuid-1",
        title: "Senior Fullstack Engineer",
        company: "Acme Web3 Labs",
        location: "Remote",
        workMode: "remote",
        jobType: "Full-time",
        salaryRange: "IDR 25.000.000 - 35.000.000",
        matchScore: 94,
        fitRationale: "Sangat cocok dengan stack TypeScript dan React.",
        keyMatchingSkills: ["TypeScript", "React", "Node.js"],
        missingSkills: [],
        applyUrl: "https://example.com/apply/1",
      },
    ];

    const dispatchSpy = vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: true,
      toolName: "get_career_recommendations",
      data: {
        count: 1,
        recommendations: mockJobs,
      },
    });

    async function* makeTurn1() {
      yield {
        choices: [
          {
            delta: {
              content: null,
              tool_calls: [
                {
                  index: 0,
                  id: "call_recom_123",
                  type: "function" as const,
                  function: {
                    name: "get_career_recommendations",
                    arguments: JSON.stringify({
                      workMode: ["remote"],
                      excludeTechnologies: ["Angular"],
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeTurn2() {
      yield { choices: [{ delta: { content: "Saya menemukan 1 lowongan Senior Fullstack Engineer di Acme Web3 Labs." } }] };
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Cari lowongan fullstack remote tanpa Angular",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(dispatchSpy).toHaveBeenCalledWith(
      testUser.id,
      "get_career_recommendations",
      {
        workMode: ["remote"],
        excludeTechnologies: ["Angular"],
      },
    );

    expect(sseText).toContain('"type":"tool_start"');
    expect(sseText).toContain('"tool":"get_career_recommendations"');
    expect(sseText).toContain('"type":"tool_end"');
    expect(sseText).toContain('"success":true');
    expect(sseText).toContain("Saya menemukan 1 lowongan Senior Fullstack Engineer");
    expect(sseText).toContain('"done":true');
  });

  it("3. should execute remember_fact and emit memory_updated event", async () => {
    const dispatchSpy = vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: true,
      toolName: "remember_fact",
      memoryUpdated: {
        id: "mem-uuid-99",
        category: "tech_focus",
        content: "Fokus karir beralih ke Rust dan AI Engineering",
        walrusStatus: "pending",
      },
      data: {
        success: true,
        memoryId: "mem-uuid-99",
      },
    });

    async function* makeTurn1() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_mem_456",
                  type: "function" as const,
                  function: {
                    name: "remember_fact",
                    arguments: JSON.stringify({
                      category: "tech_focus",
                      content: "Fokus karir beralih ke Rust dan AI Engineering",
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeTurn2() {
      yield { choices: [{ delta: { content: "Fakta karir Anda telah disimpan ke memori berdaulat." } }] };
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Mulai sekarang ingat saya fokus Rust dan AI Engineering",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(dispatchSpy).toHaveBeenCalledWith(
      testUser.id,
      "remember_fact",
      {
        category: "tech_focus",
        content: "Fokus karir beralih ke Rust dan AI Engineering",
      },
    );

    expect(sseText).toContain('"type":"memory_updated"');
    expect(sseText).toContain('"memoryUpdated":true');
    expect(sseText).toContain("Fakta karir Anda telah disimpan ke memori berdaulat.");
  });

  it("4. should emit action_proposal event when preference mutation is proposed", async () => {
    const proposalData = {
      type: "preference_update" as const,
      proposedChanges: {
        workMode: ["hybrid" as const],
        targetRoles: ["Lead Engineer"],
      },
      summary: "Memperbarui preferensi kerja menjadi hybrid dan peran target ke Lead Engineer",
    };

    const dispatchSpy = vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: true,
      toolName: "propose_preference_update",
      actionProposal: proposalData,
      data: {
        proposal: proposalData,
      },
    });

    async function* makeTurn1() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_prop_789",
                  type: "function" as const,
                  function: {
                    name: "propose_preference_update",
                    arguments: JSON.stringify({
                      workMode: ["hybrid"],
                      targetRoles: ["Lead Engineer"],
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeTurn2() {
      yield { choices: [{ delta: { content: "Saya telah menyiapkan usulan perubahan preferensi di bawah ini." } }] };
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Ubah preferensi kerja saya ke Hybrid sebagai Lead Engineer",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(dispatchSpy).toHaveBeenCalledWith(
      testUser.id,
      "propose_preference_update",
      {
        workMode: ["hybrid"],
        targetRoles: ["Lead Engineer"],
      },
    );

    expect(sseText).toContain('"type":"action_proposal"');
    expect(sseText).toContain("Memperbarui preferensi kerja menjadi hybrid");
    expect(sseText).toContain('"actionProposal":{');
  });

  it("5. should handle tool failure gracefully without breaking conversation stream", async () => {
    vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: false,
      toolName: "inspect_job_details",
      error: "Lowongan dengan ID tersebut tidak ditemukan.",
    });

    async function* makeTurn1() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_err_000",
                  type: "function" as const,
                  function: {
                    name: "inspect_job_details",
                    arguments: JSON.stringify({
                      jobId: "00000000-0000-0000-0000-000000000000",
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeTurn2() {
      yield { choices: [{ delta: { content: "Maaf, detail lowongan tersebut tidak dapat ditemukan di database saat ini." } }] };
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockResolvedValueOnce(makeTurn2());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Lihat detail lowongan 00000000-0000-0000-0000-000000000000",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(sseText).toContain('"type":"tool_end"');
    expect(sseText).toContain('"success":false');
    expect(sseText).toContain("Maaf, detail lowongan tersebut tidak dapat ditemukan");
    expect(sseText).toContain('"done":true');
  });

  it("6. should NOT emit memory_updated when the model claims success without calling a tool", async () => {
    async function* makeFabricatedStream() {
      yield { choices: [{ delta: { content: "I've saved your preference to always use English." } }] };
      yield { choices: [{ delta: { content: " Done!" } }], usage: { total_tokens: 12 } };
    }
    mockGroqCreate.mockResolvedValueOnce(makeFabricatedStream());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "always use English, save it to your memo",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(sseText).toContain("I've saved your preference");
    expect(sseText).not.toContain('"type":"memory_updated"');
    expect(sseText).not.toContain('"memoryUpdated":true');
    expect(sseText).toContain('"done":true');
  });

  it("7. should ground the turn-2 fallback in actual tool outcomes instead of claiming success", async () => {
    vi.spyOn(agentToolDispatcher, "executeTool").mockResolvedValueOnce({
      success: true,
      status: "pending",
      toolName: "remember_fact",
      memoryUpdated: {
        id: "mem-uuid-77",
        category: "work_preference",
        content: "Remote jobs from America only",
        walrusStatus: "pending",
      },
      data: {
        success: true,
        memoryId: "mem-uuid-77",
        walrusStatus: "pending",
      },
    });

    async function* makeTurn1() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_mem_t2",
                  type: "function" as const,
                  function: {
                    name: "remember_fact",
                    arguments: JSON.stringify({
                      category: "work_preference",
                      content: "Remote jobs from America only",
                    }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    mockGroqCreate.mockResolvedValueOnce(makeTurn1());
    mockGroqCreate.mockRejectedValueOnce(new Error("Turn 2 stream failed"));

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Remember I only want remote jobs from America",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(sseText).toContain("Tool outcome:");
    expect(sseText).toContain("remember_fact: succeeded");
    expect(sseText).not.toContain("Action processed successfully by the system");
    expect(sseText).toContain('"type":"memory_updated"');
  });

  it("8. should support a bounded multi-turn tool chain before producing the final answer", async () => {
    const dispatchSpy = vi
      .spyOn(agentToolDispatcher, "executeTool")
      .mockResolvedValueOnce({
        success: true,
        status: "success",
        toolName: "get_career_recommendations",
        data: {
          totalFound: 1,
          recommendations: [
            {
              id: "job-uuid-chain",
              title: "Staff AI Engineer",
              company: "Nexus Web3 AI Labs",
              matchScore: 88,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        status: "success",
        toolName: "inspect_job_details",
        data: {
          id: "job-uuid-chain",
          title: "Staff AI Engineer",
          companyName: "Nexus Web3 AI Labs",
          requirements: ["Python", "Sui Move"],
        },
      });

    async function* makeRecommendationTurn() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_chain_1",
                  type: "function" as const,
                  function: {
                    name: "get_career_recommendations",
                    arguments: JSON.stringify({ workMode: ["remote"] }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeInspectTurn() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_chain_2",
                  type: "function" as const,
                  function: {
                    name: "inspect_job_details",
                    arguments: JSON.stringify({ jobId: "job-uuid-chain" }),
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeFinalTurn() {
      yield {
        choices: [
          {
            delta: {
              content:
                "The top role is Staff AI Engineer at Nexus Web3 AI Labs.",
            },
          },
        ],
      };
    }

    mockGroqCreate
      .mockResolvedValueOnce(makeRecommendationTurn())
      .mockResolvedValueOnce(makeInspectTurn())
      .mockResolvedValueOnce(makeFinalTurn());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Recommend a remote role then inspect it",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(dispatchSpy).toHaveBeenCalledTimes(2);
    expect(sseText).toContain('"tool":"get_career_recommendations"');
    expect(sseText).toContain('"tool":"inspect_job_details"');
    expect(sseText).toContain(
      "The top role is Staff AI Engineer at Nexus Web3 AI Labs.",
    );
    expect(sseText).toContain('"done":true');
  });

  it("9. should surface malformed tool arguments as a structured failure without executing the tool", async () => {
    const dispatchSpy = vi.spyOn(agentToolDispatcher, "executeTool");

    async function* makeMalformedTurn() {
      yield {
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: "call_malformed",
                  type: "function" as const,
                  function: {
                    name: "remember_fact",
                    arguments: "{not-valid-json",
                  },
                },
              ],
            },
          },
        ],
      };
    }

    async function* makeRecoveryTurn() {
      yield {
        choices: [
          {
            delta: {
              content: "I could not save that because the arguments were invalid.",
            },
          },
        ],
      };
    }

    mockGroqCreate
      .mockResolvedValueOnce(makeMalformedTurn())
      .mockResolvedValueOnce(makeRecoveryTurn());

    const req = new NextRequest("http://localhost:3000/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        session_id: testSession.id,
        content: "Save a memory",
      }),
    });

    const res = await POST(req);
    const sseText = await readSseStream(res);

    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(sseText).toContain('"type":"tool_end"');
    expect(sseText).toContain('"success":false');

    // The malformed-argument error must be delivered to the model as a structured tool result.
    const secondCallArgs = mockGroqCreate.mock.calls[1][0] as any;
    const lastMessage = secondCallArgs.messages[
      secondCallArgs.messages.length - 1
    ] as { role: string; content: string };
    expect(lastMessage.role).toBe("tool");
    expect(lastMessage.content).toContain('"success":false');
    expect(lastMessage.content).toContain(
      "Invalid tool arguments for remember_fact",
    );
  });
});
