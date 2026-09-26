import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  JobIngestionService,
  resolveCompanyMap,
  canonicalJobToDbRow,
} from "@/features/jobs/services/job-ingestion.service";
import * as remotiveClient from "@/features/jobs/sources/remotive/remotive.client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CanonicalJob } from "@/features/jobs/domain/canonical-job";

// Mock supabaseAdmin
vi.mock("@/lib/supabase/admin", () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
    },
  };
});

describe("Integration: Job Ingestion Service & Idempotent Upsert", () => {
  let ingestionService: JobIngestionService;

  beforeEach(() => {
    vi.restoreAllMocks();
    ingestionService = new JobIngestionService();
  });

  describe("resolveCompanyMap", () => {
    it("should resolve existing companies case-insensitively and ignore unverified ones", async () => {
      const mockCompanies = [
        { id: "comp-uuid-1", name: "Google Inc." },
        { id: "comp-uuid-2", name: "Starlight Corp" },
      ];

      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: mockCompanies,
            error: null,
          }),
        }),
      });

      const companyMap = await resolveCompanyMap([
        "google inc.",
        "STARLIGHT CORP",
        "Unknown New Startup",
      ]);

      expect(companyMap.get("google inc.")).toBe("comp-uuid-1");
      expect(companyMap.get("starlight corp")).toBe("comp-uuid-2");
      expect(companyMap.get("unknown new startup")).toBeUndefined();
    });

    it("should handle database errors gracefully without throwing", async () => {
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "DB Connection timeout" },
          }),
        }),
      });

      const companyMap = await resolveCompanyMap(["Acme Inc."]);
      expect(companyMap.size).toBe(0);
    });
  });

  describe("canonicalJobToDbRow", () => {
    it("should correctly format canonical job to public.jobs database schema", () => {
      const job: CanonicalJob = {
        source: "remotive",
        sourceJobId: "776655",
        title: "Staff Data Engineer",
        companyName: "DataCo",
        companyLogo: "https://remotive.com/logo.png",
        description: "Build robust pipelines.",
        requirements: ["Python", "Spark", "SQL"],
        location: "Remote - US",
        isRemote: true,
        jobType: "full-time",
        experienceLevel: "Senior",
        salaryRange: "$160,000 - $190,000",
        postedAt: "2026-09-21T00:00:00.000Z",
        applyUrl: "https://remotive.com/apply/776655",
        sourceUrl: "https://remotive.com/job/776655",
        isActive: true,
        lastSyncedAt: "2026-09-24T12:00:00.000Z",
      };

      const row = canonicalJobToDbRow(job, "comp-dataco-id");

      expect(row.source).toBe("remotive");
      expect(row.source_job_id).toBe("776655");
      expect(row.company_name).toBe("DataCo");
      expect(row.company_id).toBe("comp-dataco-id");
      expect(row.apply_url).toBe("https://remotive.com/apply/776655");
      expect(row.source_url).toBe("https://remotive.com/job/776655");
      expect(row.is_active).toBe(true);
    });
  });

  describe("syncRemotive pipeline & Idempotency", () => {
    it("should fetch, validate, resolve companies, and upsert jobs with source/source_job_id conflict key", async () => {
      const mockRawJobs = [
        {
          id: 1001,
          url: "https://remotive.com/job/1001",
          title: "Fullstack Engineer",
          company_name: "Starlight Corp",
          company_logo: "https://remotive.com/logo/1001.png",
          job_type: "full_time",
          candidate_required_location: "Worldwide",
          salary: "$100,000",
          tags: ["TypeScript", "React"],
          publication_date: "2026-09-20T10:00:00.000Z",
          description: "<p>Work with us!</p>",
        },
        {
          id: 1002,
          url: "https://remotive.com/job/1002",
          title: "DevOps Engineer",
          company_name: "BrandNewTech",
          company_logo: null,
          job_type: "contract",
          candidate_required_location: "EMEA",
          salary: "Competitive",
          tags: ["Docker", "K8s"],
          publication_date: "2026-09-21T10:00:00.000Z",
          description: "<p>Cloud infra</p>",
        },
      ];

      vi.spyOn(remotiveClient, "fetchRemotiveJobs").mockResolvedValue({
        jobs: mockRawJobs as any,
      });

      // Mock companies table lookup: Starlight Corp exists, BrandNewTech does not
      const mockCompaniesQuery = {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: "comp-starlight-id", name: "Starlight Corp" }],
            error: null,
          }),
        }),
      };

      // Mock jobs upsert
      const mockUpsertFn = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 2,
      });

      const mockJobsTable = {
        upsert: mockUpsertFn,
      };

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "companies") return mockCompaniesQuery;
        if (table === "jobs") return mockJobsTable;
        return {};
      });

      const telemetry = await ingestionService.syncRemotive({ limit: 10 });

      expect(telemetry.provider).toBe("remotive");
      expect(telemetry.fetched).toBe(2);
      expect(telemetry.validated).toBe(2);
      expect(telemetry.upserted).toBe(2);
      expect(telemetry.failed).toBe(0);
      expect(telemetry.skipped).toBe(0);

      // Verify upsert call contract: onConflict MUST specify "source,source_job_id"
      expect(mockUpsertFn).toHaveBeenCalledTimes(1);
      const [upsertRows, upsertOptions] = mockUpsertFn.mock.calls[0];

      expect(upsertOptions).toEqual({
        onConflict: "source,source_job_id",
        ignoreDuplicates: false,
        count: "exact",
      });

      expect(upsertRows.length).toBe(2);
      // Job 1 should have resolved company_id
      expect(upsertRows[0].company_name).toBe("Starlight Corp");
      expect(upsertRows[0].company_id).toBe("comp-starlight-id");
      expect(upsertRows[0].source_job_id).toBe("1001");

      // Job 2 should have null company_id (unverified)
      expect(upsertRows[1].company_name).toBe("BrandNewTech");
      expect(upsertRows[1].company_id).toBeNull();
      expect(upsertRows[1].source_job_id).toBe("1002");
    });

    it("should handle partial invalid jobs gracefully without stopping the batch", async () => {
      const mockRawJobs = [
        {
          id: 2001,
          url: "https://remotive.com/job/2001",
          title: "Valid Engineer",
          company_name: "ValidCo",
          job_type: "full_time",
          description: "A valid job.",
        },
        {
          // Invalid: missing required title
          id: 2002,
          url: "https://remotive.com/job/2002",
          title: "",
          company_name: "BrokenCo",
          job_type: "full_time",
          description: "Broken job.",
        },
      ];

      vi.spyOn(remotiveClient, "fetchRemotiveJobs").mockResolvedValue({
        jobs: mockRawJobs as any,
      });

      const mockUpsertFn = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 1,
      });

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "companies") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "jobs") {
          return { upsert: mockUpsertFn };
        }
        return {};
      });

      const telemetry = await ingestionService.syncRemotive();

      expect(telemetry.fetched).toBe(2);
      expect(telemetry.validated).toBe(1);
      expect(telemetry.skipped).toBe(1);
      expect(telemetry.upserted).toBe(1);
      expect(telemetry.errors.length).toBeGreaterThan(0);
    });

    it("should enforce client-side slicing when limit is provided", async () => {
      const mockRawJobs = [
        {
          id: 4001,
          url: "https://remotive.com/job/4001",
          title: "Job 1",
          company_name: "C1",
          job_type: "full_time",
          description: "D1",
        },
        {
          id: 4002,
          url: "https://remotive.com/job/4002",
          title: "Job 2",
          company_name: "C2",
          job_type: "full_time",
          description: "D2",
        },
        {
          id: 4003,
          url: "https://remotive.com/job/4003",
          title: "Job 3",
          company_name: "C3",
          job_type: "full_time",
          description: "D3",
        },
        {
          id: 4004,
          url: "https://remotive.com/job/4004",
          title: "Job 4",
          company_name: "C4",
          job_type: "full_time",
          description: "D4",
        },
      ];

      vi.spyOn(remotiveClient, "fetchRemotiveJobs").mockResolvedValue({
        jobs: mockRawJobs as any,
      });

      const mockUpsertFn = vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: 2,
      });

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "companies") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "jobs") {
          return { upsert: mockUpsertFn };
        }
        return {};
      });

      // Request limit: 2 despite provider returning 4
      const telemetry = await ingestionService.syncRemotive({ limit: 2 });

      expect(telemetry.fetched).toBe(4);
      expect(telemetry.validated).toBe(2);
      expect(telemetry.upserted).toBe(2);

      const [upsertRows] = mockUpsertFn.mock.calls[0];
      expect(upsertRows.length).toBe(2);
      expect(upsertRows[0].source_job_id).toBe("4001");
      expect(upsertRows[1].source_job_id).toBe("4002");
    });

    it("should handle database upsert errors and report in telemetry", async () => {
      vi.spyOn(remotiveClient, "fetchRemotiveJobs").mockResolvedValue({
        jobs: [
          {
            id: 3001,
            url: "https://remotive.com/job/3001",
            title: "Database Admin",
            company_name: "TechCorp",
            job_type: "full_time",
            description: "Manage PostgreSQL.",
          },
        ] as any,
      });

      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === "companies") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "jobs") {
          return {
            upsert: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: "Unique constraint violation on source_job_id",
              },
            }),
          };
        }
        return {};
      });

      const telemetry = await ingestionService.syncRemotive();

      expect(telemetry.upserted).toBe(0);
      expect(telemetry.failed).toBe(1);
      expect(
        telemetry.errors.some((e) => e.includes("Database upsert error")),
      ).toBe(true);
    });
  });
});
