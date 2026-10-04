import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getMemories, POST as postMemory } from "@/app/api/memory/route";
import { DELETE as deleteMemory } from "@/app/api/memory/[id]/route";
import { POST as postReinforce } from "@/app/api/memory/reinforce/route";
import { NextRequest } from "next/server";

const { mockAuthUser, mockMemoryService } = vi.hoisted(() => ({
  mockAuthUser: vi.fn(),
  mockMemoryService: {
    getAllMemories: vi.fn(),
    rememberFact: vi.fn(),
    forgetMemory: vi.fn(),
    reinforceMemories: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/features/memory/services/career-memory.service", () => ({
  careerMemoryService: mockMemoryService,
}));

describe("Integration (Mock-Based): /api/memory API Routes", () => {
  const sampleUser = {
    id: "b0000000-0000-4000-8000-000000000001",
    email: "candidate@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/memory", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new NextRequest("http://localhost:3000/api/memory");
      const res = await getMemories(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/unauthorized/i);
    });

    it("should return list of memories for authenticated user", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });

      const mockMemories = [
        {
          id: "m-1",
          profileId: sampleUser.id,
          category: "tech_focus",
          content: "Fokus ke Rust dan Go",
          status: "active",
        },
      ];

      mockMemoryService.getAllMemories.mockResolvedValueOnce(mockMemories);

      const req = new NextRequest("http://localhost:3000/api/memory");
      const res = await getMemories(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.memories).toHaveLength(1);
      expect(json.memories[0].content).toBe("Fokus ke Rust dan Go");
      expect(mockMemoryService.getAllMemories).toHaveBeenCalledWith(
        sampleUser.id,
      );
    });
  });

  describe("POST /api/memory", () => {
    it("should return 401 when unauthenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new NextRequest("http://localhost:3000/api/memory", {
        method: "POST",
        body: JSON.stringify({ category: "tech_focus", content: "Go" }),
      });
      const res = await postMemory(req);

      expect(res.status).toBe(401);
    });

    it("should create memory fact when input is valid", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });

      const created = {
        id: "m-new",
        profileId: sampleUser.id,
        category: "tech_focus",
        content: "Golang Backend Developer",
        status: "active",
      };

      mockMemoryService.rememberFact.mockResolvedValueOnce(created);

      const req = new NextRequest("http://localhost:3000/api/memory", {
        method: "POST",
        body: JSON.stringify({
          category: "tech_focus",
          content: "Golang Backend Developer",
        }),
      });
      const res = await postMemory(req);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.memory.id).toBe("m-new");
      expect(mockMemoryService.rememberFact).toHaveBeenCalledWith(
        sampleUser.id,
        expect.objectContaining({
          category: "tech_focus",
          content: "Golang Backend Developer",
        }),
      );
    });
  });

  describe("DELETE /api/memory/[id]", () => {
    it("should return 401 when unauthenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new NextRequest("http://localhost:3000/api/memory/m-1", {
        method: "DELETE",
      });
      const res = await deleteMemory(req, {
        params: Promise.resolve({ id: "m-1" }),
      });

      expect(res.status).toBe(401);
    });

    it("should mark memory as forgotten for authenticated user", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });

      const forgotten = {
        id: "m-1",
        profileId: sampleUser.id,
        status: "forgotten",
      };

      mockMemoryService.forgetMemory.mockResolvedValueOnce(forgotten);

      const req = new NextRequest("http://localhost:3000/api/memory/m-1", {
        method: "DELETE",
      });
      const res = await deleteMemory(req, {
        params: Promise.resolve({ id: "m-1" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.memory.status).toBe("forgotten");
      expect(mockMemoryService.forgetMemory).toHaveBeenCalledWith(
        sampleUser.id,
        "m-1",
      );
    });
  });

  describe("POST /api/memory/reinforce", () => {
    it("should return 401 when unauthenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new NextRequest(
        "http://localhost:3000/api/memory/reinforce",
        {
          method: "POST",
          body: JSON.stringify({
            memories: [{ id: null, content: "Prefers remote roles" }],
          }),
        },
      );
      const res = await postReinforce(req);
      expect(res.status).toBe(401);
    });

    it("should reinforce memories that shaped a helpful answer", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockMemoryService.reinforceMemories.mockResolvedValueOnce(1);

      const req = new NextRequest(
        "http://localhost:3000/api/memory/reinforce",
        {
          method: "POST",
          body: JSON.stringify({
            memories: [
              { id: null, content: "Prefers remote roles based in America" },
            ],
          }),
        },
      );
      const res = await postReinforce(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reinforced).toBe(1);
      expect(mockMemoryService.reinforceMemories).toHaveBeenCalledWith(
        sampleUser.id,
        [
          {
            id: null,
            content: "Prefers remote roles based in America",
          },
        ],
      );
    });
  });
});
