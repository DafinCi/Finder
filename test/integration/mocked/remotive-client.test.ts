import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchRemotiveJobs,
  RemotiveApiError,
} from "@/features/jobs/sources/remotive/remotive.client";

describe("Integration (Mock-Based): Remotive HTTP Client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should successfully fetch and return parsed Remotive jobs on 200 OK", () => {
    const mockApiResponse = {
      "0-legal-notice": "Terms apply",
      "job-count": 1,
      jobs: [
        {
          id: 101,
          url: "https://remotive.com/remote-jobs/101",
          title: "Frontend Engineer",
          company_name: "PixelCraft",
          company_logo: "https://remotive.com/logos/101.png",
          category: "Software Development",
          tags: ["react", "next.js"],
          job_type: "full_time",
          publication_date: "2026-09-24T00:00:00",
          candidate_required_location: "Remote",
          salary: "$90,000",
          description: "<p>Great frontend job</p>",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    return fetchRemotiveJobs({ limit: 5 }).then((data) => {
      expect(data.jobs.length).toBe(1);
      expect(data.jobs[0].title).toBe("Frontend Engineer");

      const calledUrl = (global.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain("https://remotive.com/api/remote-jobs");
      expect(calledUrl).toContain("limit=5");
    });
  });

  it("should append category and search parameters to the request URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ jobs: [] }),
    } as Response);

    await fetchRemotiveJobs({
      category: "software-dev",
      search: "typescript",
      limit: 10,
    });

    const calledUrl = (global.fetch as any).mock.calls[0][0];
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get("category")).toBe("software-dev");
    expect(parsed.searchParams.get("search")).toBe("typescript");
    expect(parsed.searchParams.get("limit")).toBe("10");
  });

  it("should throw RemotiveApiError on non-200 HTTP response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response);

    await expect(fetchRemotiveJobs()).rejects.toThrowError(RemotiveApiError);
    await expect(fetchRemotiveJobs()).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 503,
    });
  });

  it("should throw RemotiveApiError on invalid JSON response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("Unexpected token < in JSON");
      },
    } as unknown as Response);

    await expect(fetchRemotiveJobs()).rejects.toThrowError(RemotiveApiError);
    await expect(fetchRemotiveJobs()).rejects.toMatchObject({
      code: "INVALID_JSON",
    });
  });

  it("should throw RemotiveApiError on schema validation mismatch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        jobs: [
          {
            // Missing id, url, title, company_name
            invalidField: 123,
          },
        ],
      }),
    } as Response);

    await expect(fetchRemotiveJobs()).rejects.toThrowError(RemotiveApiError);
    await expect(fetchRemotiveJobs()).rejects.toMatchObject({
      code: "SCHEMA_MISMATCH",
    });
  });

  it("should throw RemotiveApiError on request abort/timeout", async () => {
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        const signal = options?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const abortError = new Error("This operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        }
      });
    });

    await expect(fetchRemotiveJobs({ timeoutMs: 50 })).rejects.toThrowError(
      RemotiveApiError,
    );
    await expect(fetchRemotiveJobs({ timeoutMs: 50 })).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 408,
    });
  });
});
