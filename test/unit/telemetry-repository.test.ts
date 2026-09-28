import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TelemetryRepository,
  mapDbRowToTelemetry,
} from "@/features/feedback/repositories/telemetry.repository";

describe("Unit: TelemetryRepository", () => {
  let mockClient: any;
  let repo: TelemetryRepository;

  const sampleTelemetryRow = {
    id: "t0000000-0000-0000-0000-000000000001",
    profile_id: "u0000000-0000-0000-0000-000000000001",
    job_id: "j0000000-0000-0000-0000-000000000001",
    interaction_type: "card_click" as const,
    duration_ms: 1200,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("mapDbRowToTelemetry", () => {
    it("should correctly map telemetry DB row to domain type", () => {
      const mapped = mapDbRowToTelemetry(sampleTelemetryRow);
      expect(mapped.id).toBe(sampleTelemetryRow.id);
      expect(mapped.profileId).toBe(sampleTelemetryRow.profile_id);
      expect(mapped.jobId).toBe(sampleTelemetryRow.job_id);
      expect(mapped.interactionType).toBe("card_click");
      expect(mapped.durationMs).toBe(1200);
    });
  });

  describe("recordInteraction", () => {
    it("should insert a single operational interaction event", async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: sampleTelemetryRow,
            error: null,
          }),
        }),
      });

      mockClient = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      repo = new TelemetryRepository(mockClient);
      const result = await repo.recordInteraction(
        sampleTelemetryRow.profile_id,
        sampleTelemetryRow.job_id,
        "card_click",
        1200,
      );

      expect(result.id).toBe(sampleTelemetryRow.id);
      expect(insertMock).toHaveBeenCalledWith({
        profile_id: sampleTelemetryRow.profile_id,
        job_id: sampleTelemetryRow.job_id,
        interaction_type: "card_click",
        duration_ms: 1200,
      });
    });
  });

  describe("recordBatch", () => {
    it("should return 0 immediately when items array is empty", async () => {
      mockClient = { from: vi.fn() };
      repo = new TelemetryRepository(mockClient);
      const count = await repo.recordBatch("u1", []);
      expect(count).toBe(0);
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it("should insert batch of interaction events and return inserted count", async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: "t1" }, { id: "t2" }],
          error: null,
        }),
      });

      mockClient = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      repo = new TelemetryRepository(mockClient);
      const count = await repo.recordBatch("u1", [
        { jobId: "j1", interactionType: "impression" },
        { jobId: "j2", interactionType: "drawer_view", durationMs: 4500 },
      ]);

      expect(count).toBe(2);
      expect(insertMock).toHaveBeenCalledWith([
        {
          profile_id: "u1",
          job_id: "j1",
          interaction_type: "impression",
          duration_ms: null,
        },
        {
          profile_id: "u1",
          job_id: "j2",
          interaction_type: "drawer_view",
          duration_ms: 4500,
        },
      ]);
    });
  });

  describe("getRecentInteractions", () => {
    it("should query recent interactions ordered by created_at DESC with limit", async () => {
      const limitMock = vi.fn().mockResolvedValue({
        data: [sampleTelemetryRow],
        error: null,
      });

      const orderMock = vi.fn().mockReturnValue({
        limit: limitMock,
      });

      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });

      const selectMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });

      mockClient = {
        from: vi.fn().mockReturnValue({
          select: selectMock,
        }),
      };

      repo = new TelemetryRepository(mockClient);
      const items = await repo.getRecentInteractions("u1", 20);

      expect(items.length).toBe(1);
      expect(limitMock).toHaveBeenCalledWith(20);
      expect(orderMock).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });
  });
});
