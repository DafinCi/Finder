import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/agent/status/route";

const { mockAuthUser } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

describe("Integration (Mock-Based): GET /api/agent/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when unauthenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const res = await GET(
      new NextRequest("http://localhost:3000/api/agent/status"),
    );
    expect(res.status).toBe(401);
  });

  it("should report models and memory status without leaking secrets", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const res = await GET(
      new NextRequest("http://localhost:3000/api/agent/status"),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.provider).toBe("Groq");
    expect(typeof json.primaryModel).toBe("string");
    expect(typeof json.agentModel).toBe("string");
    expect(typeof json.fallbackModel).toBe("string");
    expect(["mainnet", "testnet"]).toContain(json.memoryNetwork);
    expect(typeof json.memwalConfigured).toBe("boolean");
    expect(JSON.stringify(json)).not.toMatch(/gsk_|private_key|SUPABASE/i);
  });
});
