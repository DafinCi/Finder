import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FeedbackRepository,
  mapDbRowToSavedJob,
  mapDbRowToFeedbackEvent,
} from "@/features/feedback/repositories/feedback.repository";

describe("Unit: FeedbackRepository", () => {
  let mockClient: any;
  let repo: FeedbackRepository;

  const sampleSavedJobRow = {
    id: "s0000000-0000-0000-0000-000000000001",
    profile_id: "u0000000-0000-0000-0000-000000000001",
    job_id: "j0000000-0000-0000-0000-000000000001",
    notes: "Interesting engineering culture",
    created_at: new Date().toISOString(),
  };

  const sampleFeedbackRow = {
    id: "f0000000-0000-0000-0000-000000000001",
    profile_id: "u0000000-0000-0000-0000-000000000001",
    job_id: "j0000000-0000-0000-0000-000000000001",
    event_type: "save" as const,
    reason: null,
    metadata: { notes: "Interesting engineering culture" },
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("mapDbRow helpers", () => {
    it("should correctly map saved job DB row to domain type", () => {
      const mapped = mapDbRowToSavedJob(sampleSavedJobRow);
      expect(mapped.id).toBe(sampleSavedJobRow.id);
      expect(mapped.profileId).toBe(sampleSavedJobRow.profile_id);
      expect(mapped.jobId).toBe(sampleSavedJobRow.job_id);
      expect(mapped.notes).toBe(sampleSavedJobRow.notes);
    });

    it("should correctly map feedback event DB row to domain type", () => {
      const mapped = mapDbRowToFeedbackEvent(sampleFeedbackRow);
      expect(mapped.id).toBe(sampleFeedbackRow.id);
      expect(mapped.eventType).toBe("save");
      expect(mapped.profileId).toBe(sampleFeedbackRow.profile_id);
    });
  });

  describe("saveJob", () => {
    it("should upsert saved job and append save feedback event", async () => {
      const upsertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: sampleSavedJobRow,
            error: null,
          }),
        }),
      });

      const insertEventMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: sampleFeedbackRow,
            error: null,
          }),
        }),
      });

      mockClient = {
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "saved_jobs") {
            return { upsert: upsertMock };
          }
          if (tableName === "job_feedback_events") {
            return { insert: insertEventMock };
          }
          return {};
        }),
      };

      repo = new FeedbackRepository(mockClient);
      const result = await repo.saveJob(
        sampleSavedJobRow.profile_id,
        sampleSavedJobRow.job_id,
        sampleSavedJobRow.notes,
      );

      expect(result.id).toBe(sampleSavedJobRow.id);
      expect(upsertMock).toHaveBeenCalledWith(
        {
          profile_id: sampleSavedJobRow.profile_id,
          job_id: sampleSavedJobRow.job_id,
          notes: sampleSavedJobRow.notes,
        },
        { onConflict: "profile_id,job_id" },
      );
      expect(insertEventMock).toHaveBeenCalledWith({
        profile_id: sampleSavedJobRow.profile_id,
        job_id: sampleSavedJobRow.job_id,
        event_type: "save",
        reason: null,
        metadata: { notes: sampleSavedJobRow.notes },
      });
    });
  });

  describe("unsaveJob", () => {
    it("should delete saved job and append unsave feedback event", async () => {
      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: deleteEqMock,
        }),
      });

      const insertEventMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...sampleFeedbackRow, event_type: "unsave" },
            error: null,
          }),
        }),
      });

      mockClient = {
        from: vi.fn().mockImplementation((tableName: string) => {
          if (tableName === "saved_jobs") {
            return { delete: deleteMock };
          }
          if (tableName === "job_feedback_events") {
            return { insert: insertEventMock };
          }
          return {};
        }),
      };

      repo = new FeedbackRepository(mockClient);
      await repo.unsaveJob(
        sampleSavedJobRow.profile_id,
        sampleSavedJobRow.job_id,
      );

      expect(deleteMock).toHaveBeenCalled();
      expect(insertEventMock).toHaveBeenCalledWith({
        profile_id: sampleSavedJobRow.profile_id,
        job_id: sampleSavedJobRow.job_id,
        event_type: "unsave",
        reason: null,
        metadata: {},
      });
    });
  });

  describe("isJobSaved", () => {
    it("should return true when saved job record exists", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "some-uuid" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      repo = new FeedbackRepository(mockClient);
      const isSaved = await repo.isJobSaved("u1", "j1");
      expect(isSaved).toBe(true);
    });

    it("should return false when no saved job record exists", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      repo = new FeedbackRepository(mockClient);
      const isSaved = await repo.isJobSaved("u1", "j1");
      expect(isSaved).toBe(false);
    });
  });

  describe("getExcludedJobIds (Stage 1 Negative Gate)", () => {
    it("should return Set of job IDs explicitly rejected by the candidate", async () => {
      mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { job_id: "j-rejected-1" },
                  { job_id: "j-rejected-2" },
                  { job_id: "j-rejected-1" }, // Duplicate check
                ],
                error: null,
              }),
            }),
          }),
        }),
      };

      repo = new FeedbackRepository(mockClient);
      const excludedSet = await repo.getExcludedJobIds("u1");

      expect(excludedSet.size).toBe(2);
      expect(excludedSet.has("j-rejected-1")).toBe(true);
      expect(excludedSet.has("j-rejected-2")).toBe(true);
      expect(excludedSet.has("j-other")).toBe(false);
    });
  });
});
