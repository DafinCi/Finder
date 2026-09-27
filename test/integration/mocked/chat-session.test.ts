import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE, PATCH } from "@/app/api/chat/session/[id]/route";
import { NextRequest } from "next/server";

const mockAuthUser = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminDelete = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminOrder = vi.fn();

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
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: mockAdminDelete,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: mockAdminSingle,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "chat_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: mockAdminOrder,
            }),
          }),
        };
      }
      return {};
    }),
  },
}));

describe("Integration (Mock-Based): /api/chat/session/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/chat/session/[id]", () => {
    it("should return 401 when request is unauthenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Unauthorized"),
      });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
      );
      const res = await GET(req, {
        params: Promise.resolve({ id: "session-1" }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("should return 404 when session does not exist or belongs to another user", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: { id: "user-alpha", email: "alpha@example.com" } },
        error: null,
      });
      mockAdminSingle.mockResolvedValueOnce({
        data: null,
        error: { message: "Row not found" },
      });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/session/session-not-owned",
      );
      const res = await GET(req, {
        params: Promise.resolve({ id: "session-not-owned" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("tidak ditemukan");
    });

    it("should return session and messages for the rightful owner", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: { id: "user-alpha", email: "alpha@example.com" } },
        error: null,
      });
      mockAdminSingle.mockResolvedValueOnce({
        data: {
          id: "session-1",
          user_id: "user-alpha",
          title: "My Career Plan",
        },
        error: null,
      });
      mockAdminOrder.mockResolvedValueOnce({
        data: [{ id: "msg-1", content: "Halo", role: "user" }],
        error: null,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
      );
      const res = await GET(req, {
        params: Promise.resolve({ id: "session-1" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session.id).toBe("session-1");
      expect(json.messages).toHaveLength(1);
    });
  });

  describe("PATCH /api/chat/session/[id] (Renaming)", () => {
    it("should return 400 when title is empty or exceeds 100 characters", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: { id: "user-alpha" } },
        error: null,
      });

      const emptyReq = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
        {
          method: "PATCH",
          body: JSON.stringify({ title: "   " }),
        },
      );
      const emptyRes = await PATCH(emptyReq, {
        params: Promise.resolve({ id: "session-1" }),
      });
      expect(emptyRes.status).toBe(400);

      mockAuthUser.mockResolvedValueOnce({
        data: { user: { id: "user-alpha" } },
        error: null,
      });
      const tooLongTitle = "a".repeat(101);
      const longReq = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
        {
          method: "PATCH",
          body: JSON.stringify({ title: tooLongTitle }),
        },
      );
      const longRes = await PATCH(longReq, {
        params: Promise.resolve({ id: "session-1" }),
      });
      expect(longRes.status).toBe(400);
    });

    it("should update session title successfully for owner", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: { id: "user-alpha" } },
        error: null,
      });
      mockAdminSingle.mockResolvedValueOnce({
        data: {
          id: "session-1",
          user_id: "user-alpha",
          title: "New Valid Title",
        },
        error: null,
      });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
        {
          method: "PATCH",
          body: JSON.stringify({ title: "New Valid Title" }),
        },
      );
      const res = await PATCH(req, {
        params: Promise.resolve({ id: "session-1" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.session.title).toBe("New Valid Title");
    });
  });

  describe("DELETE /api/chat/session/[id]", () => {
    it("should return 401 when unauthenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Unauthorized"),
      });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
        { method: "DELETE" },
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: "session-1" }),
      });

      expect(res.status).toBe(401);
    });

    it("should delete session successfully when authorized", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: { id: "user-alpha" } },
        error: null,
      });
      mockAdminDelete.mockResolvedValueOnce({ error: null });

      const req = new NextRequest(
        "http://localhost:3000/api/chat/session/session-1",
        { method: "DELETE" },
      );
      const res = await DELETE(req, {
        params: Promise.resolve({ id: "session-1" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
