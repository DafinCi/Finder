import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/chat/message/route";
import { NextRequest } from "next/server";
import { AMNESIA_DEMO_KEY } from "@/contexts/AgentContext";
import { careerMemoryService } from "@/features/memory/services/career-memory.service";

const mockAuthUser = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminInsert = vi.fn();
const mockGroqCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/features/memory/services/career-memory.service", () => ({
  careerMemoryService: {
    getDurableContextSummary: vi.fn().mockResolvedValue("\n\n[RECALLED FROM WALRUS MEMORY]: Rust and Move"),
    getDurableContext: vi.fn().mockResolvedValue({
      source: "walrus",
      memories: [
        { id: null, content: "Rust and Move", category: "tech_focus", blobId: "blob-1", source: "walrus" },
      ],
      context: "\n\n[RECALLED FROM WALRUS MEMORY]: Rust and Move",
    }),
  },
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
          insert: vi.fn((data: any) => {
            mockAdminInsert(data);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "msg-created" },
                  error: null,
                }),
              }),
            };
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

describe("Reviewer Demo / Amnesia Mode Simulation", () => {
  const sampleUser = { id: "user-reviewer-123" };
  const sampleSession = { id: "session-benchmark-1", user_id: sampleUser.id };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.mockResolvedValue({
      data: { user: sampleUser },
      error: null,
    });
    mockAdminSingle.mockResolvedValue({
      data: sampleSession,
      error: null,
    });

    // Mock streaming response from Groq
    mockGroqCreate.mockResolvedValue(
      (async function* () {
        yield { choices: [{ delta: { content: "Sample response from agent" } }] };
      })(),
    );
  });

  describe("API Route Simulation Behavior", () => {
    it("should bypass memory recall when simulate_stateless is true in request body", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat/message", {
        method: "POST",
        body: JSON.stringify({
          session_id: sampleSession.id,
          content: "What are my career preferences?",
          simulate_stateless: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify careerMemoryService was NEVER queried for durable context
      expect(careerMemoryService.getDurableContext).not.toHaveBeenCalled();

      // Read SSE stream to verify simulation_mode event was emitted
      const text = await res.text();
      expect(text).toContain('"type":"simulation_mode"');
      expect(text).toContain('"mode":"stateless"');

      // Verify database message metadata marks stateless_simulation
      expect(mockAdminInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: sampleSession.id,
          role: "assistant",
          metadata: expect.objectContaining({
            stateless_simulation: true,
          }),
        }),
      );
    });

    it("should bypass memory recall when ?demo=stateless is passed in URL", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/chat/message?demo=stateless",
        {
          method: "POST",
          body: JSON.stringify({
            session_id: sampleSession.id,
            content: "What are my career preferences?",
          }),
        },
      );

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(careerMemoryService.getDurableContext).not.toHaveBeenCalled();

      const text = await res.text();
      expect(text).toContain('"mode":"stateless"');
    });

    it("should bypass memory recall when x-simulate-stateless header is set to true", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat/message", {
        method: "POST",
        headers: {
          "x-simulate-stateless": "true",
        },
        body: JSON.stringify({
          session_id: sampleSession.id,
          content: "What are my career preferences?",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(careerMemoryService.getDurableContext).not.toHaveBeenCalled();
    });

    it("should recall memory normally when simulation mode is false or absent", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat/message", {
        method: "POST",
        body: JSON.stringify({
          session_id: sampleSession.id,
          content: "What are my career preferences?",
          simulate_stateless: false,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // In normal mode, memory recall is actively invoked
      expect(careerMemoryService.getDurableContext).toHaveBeenCalledWith(
        sampleUser.id,
        5,
        "What are my career preferences?",
        undefined,
      );

      // Verify simulation_mode event is NOT emitted
      const text = await res.text();
      expect(text).not.toContain('"type":"simulation_mode"');
    });
  });

  describe("AgentContext Storage Key Contract", () => {
    it("should expose AMNESIA_DEMO_KEY with expected namespace", () => {
      expect(AMNESIA_DEMO_KEY).toBe("finder_demo_amnesia");
    });
  });
});
