import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/upload-resume/route";
import { NextRequest } from "next/server";

const mockAuthUser = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminInsert = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminMaybeSingle = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();

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
              maybeSingle: mockAdminMaybeSingle,
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: mockAdminUpdate,
            }),
          }),
        };
      }
      if (table === "resumes") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "resume-123" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "chat_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload.mockResolvedValue({ error: null }),
        remove: mockStorageRemove.mockResolvedValue({ error: null }),
      })),
    },
  },
}));

vi.mock("pdf-parse", () => {
  const parseFn = vi.fn(async () => ({
    text: "John Doe - Senior Software Engineer with 8 years experience in TypeScript, React, and Node.js. Built distributed microservices and managed cloud infrastructure.",
  }));
  return {
    default: parseFn,
    PDFParse: parseFn,
  };
});

describe("Integration (Mock-Based): /api/upload-resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when request is unauthenticated", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("should return 400 when file is missing or not PDF mime type", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-test" } },
      error: null,
    });

    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("wajib dikirim");
  });

  it("should return 400 when file has fake PDF extension with invalid magic bytes", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-test" } },
      error: null,
    });

    // Create fake file with text content instead of %PDF magic bytes
    const fakeFile = new File(["NOT_A_REAL_PDF_HEADER"], "fake.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.append("file", fakeFile);

    const req = new NextRequest("http://localhost:3000/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Format file tidak valid");
  });

  it("should return 413 when file size exceeds 5MB limit", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-test" } },
      error: null,
    });

    // 5MB + 1 byte
    const largeBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
    largeBuffer[0] = 0x25;
    largeBuffer[1] = 0x50;
    largeBuffer[2] = 0x44;
    largeBuffer[3] = 0x46; // %PDF

    const largeFile = new File([largeBuffer], "large.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.append("file", largeFile);

    const req = new NextRequest("http://localhost:3000/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toContain("Maksimal ukuran file resume adalah 5 MB");
  });

  it("should return 403 Forbidden when user attempts to attach to another user's session", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "attacker-user-id" } },
      error: null,
    });

    // Mock that the session is owned by someone else
    mockAdminMaybeSingle.mockResolvedValueOnce({
      data: { id: "session-victim", user_id: "victim-user-id" },
      error: null,
    });

    const validPdfBuffer = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
    ]);
    const validFile = new File([validPdfBuffer], "resume.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.append("file", validFile);
    formData.append("sessionId", "session-victim");

    const req = new NextRequest("http://localhost:3000/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("bukan milik Anda");
  });

  it("should succeed for valid PDF, owner session, and extract text", async () => {
    mockAuthUser.mockResolvedValueOnce({
      data: { user: { id: "user-legit" } },
      error: null,
    });

    mockAdminMaybeSingle.mockResolvedValueOnce({
      data: { id: "session-legit", user_id: "user-legit" },
      error: null,
    });

    const validPdfBuffer = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34,
    ]);
    const validFile = new File([validPdfBuffer], "my_cv.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.append("file", validFile);
    formData.append("sessionId", "session-legit");

    const req = new NextRequest("http://localhost:3000/api/upload-resume", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.resumeId).toBe("resume-123");
  });
});
