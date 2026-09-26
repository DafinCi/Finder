import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/jobs/sync/route";
import { jobIngestionService } from "@/features/jobs/services/job-ingestion.service";
import { NextRequest } from "next/server";

vi.mock("@/features/jobs/services/job-ingestion.service", () => ({
  jobIngestionService: {
    syncRemotive: vi.fn(),
  },
}));

describe("Integration: POST /api/jobs/sync Route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret-123",
      NODE_ENV: "production",
    };
  });

  function createRequest(
    url: string,
    options: { headers?: Record<string, string> } = {},
  ): NextRequest {
    return new NextRequest(new URL(url, "http://localhost:3000"), {
      method: "POST",
      headers: options.headers || {},
    });
  }

  it("should return 401 Unauthorized when no secret is provided", async () => {
    const req = createRequest("/api/jobs/sync");
    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Unauthorized");
  });

  it("should return 401 Unauthorized when an incorrect secret is provided", async () => {
    const req = createRequest("/api/jobs/sync", {
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should reject unsupported providers in Phase 1 with 400 Bad Request", async () => {
    const req = createRequest("/api/jobs/sync?provider=remoteok", {
      headers: {
        authorization: "Bearer test-cron-secret-123",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Phase 1");
  });

  it("should succeed and trigger sync when authorized via Bearer token", async () => {
    (jobIngestionService.syncRemotive as any).mockResolvedValue({
      provider: "remotive",
      fetched: 10,
      validated: 10,
      upserted: 10,
      skipped: 0,
      failed: 0,
      errors: [],
      durationMs: 250,
    });

    const req = createRequest("/api/jobs/sync?provider=remotive&limit=10", {
      headers: {
        authorization: "Bearer test-cron-secret-123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.upserted).toBe(10);
    expect(jobIngestionService.syncRemotive).toHaveBeenCalledWith({
      limit: 10,
    });
  });

  it("should succeed and trigger sync when authorized via x-sync-secret header", async () => {
    (jobIngestionService.syncRemotive as any).mockResolvedValue({
      provider: "remotive",
      fetched: 5,
      validated: 5,
      upserted: 5,
      skipped: 0,
      failed: 0,
      errors: [],
      durationMs: 150,
    });

    const req = createRequest("/api/jobs/sync", {
      headers: {
        "x-sync-secret": "test-cron-secret-123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.fetched).toBe(5);
  });
});
