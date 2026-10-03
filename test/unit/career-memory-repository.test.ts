import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CareerMemoryRepository,
  mapDbRowToCareerMemory,
  CareerMemoryDbRow,
  memoryOverlapRatio,
} from "@/features/memory/repositories/career-memory.repository";
import { CareerMemoryService } from "@/features/memory/services/career-memory.service";

describe("Phase 1: Sovereign Career Memory Repository & Service", () => {
  let mockDbRows: CareerMemoryDbRow[] = [];
  let mockClient: any;
  let repository: CareerMemoryRepository;
  let mockMemWalClient: any;
  let service: CareerMemoryService;

  const TEST_PROFILE_ID = "profile-uuid-123";

  describe("memoryOverlapRatio", () => {
    it("should report high overlap for topically similar memories", () => {
      expect(
        memoryOverlapRatio(
          "Focusing on Next.js, React, and TypeScript",
          "Currently focusing on learning Next.js and React",
        ),
      ).toBeGreaterThanOrEqual(0.5);
    });

    it("should report low overlap for unrelated memories sharing one common word", () => {
      expect(
        memoryOverlapRatio(
          "Prefers remote roles only",
          "Prefers four-day work week",
        ),
      ).toBeLessThan(0.5);
    });
  });

  beforeEach(() => {
    mockDbRows = [];

    mockClient = {
      from: vi.fn((table: string) => {
        if (table !== "career_memories") throw new Error(`Unexpected table ${table}`);
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => ({
                order: vi.fn(() => ({
                  limit: vi.fn((lim: number) => ({
                    data: mockDbRows
                      .filter((r) => (r as any)[col1] === val1 && (r as any)[col2] === val2)
                      .slice(0, lim),
                    error: null,
                  })),
                })),
                maybeSingle: vi.fn(() => {
                  const found = mockDbRows.find(
                    (r) => (r as any)[col1] === val1 && (r as any)[col2] === val2,
                  );
                  return { data: found || null, error: null };
                }),
              })),
              order: vi.fn(() => ({
                data: mockDbRows.filter((r) => (r as any)[col1] === val1),
                error: null,
              })),
            })),
          })),
          insert: vi.fn((payload: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(() => {
                const newRow: CareerMemoryDbRow = {
                  id: "mem-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
                  profile_id: payload.profile_id,
                  category: payload.category,
                  content: payload.content,
                  source: payload.source,
                  confidence: payload.confidence,
                  status: payload.status,
                  walrus_status: payload.walrus_status,
                  walrus_blob_id: payload.walrus_blob_id || null,
                  walrus_object_id: payload.walrus_object_id || null,
                  supersedes_id: payload.supersedes_id || null,
                  metadata: payload.metadata || {},
                  created_at: payload.created_at,
                  updated_at: payload.updated_at,
                };
                mockDbRows.push(newRow);
                return { data: newRow, error: null };
              }),
            })),
          })),
          update: vi.fn((updates: any) => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => {
                    const row = mockDbRows.find(
                      (r) => (r as any)[col1] === val1 && (r as any)[col2] === val2,
                    );
                    if (!row) return { data: null, error: new Error("Row not found") };
                    Object.assign(row, updates);
                    return { data: row, error: null };
                  }),
                })),
              })),
              neq: vi.fn((neqCol: string, neqVal: any) => ({
                select: vi.fn(() => {
                  const matches = mockDbRows.filter(
                    (r) => (r as any)[col1] === val1 && (r as any)[neqCol] !== neqVal,
                  );
                  matches.forEach((r) => Object.assign(r, updates));
                  return { data: matches.map((m) => ({ id: m.id })), error: null };
                }),
              })),
            })),
          })),
        };
      }),
    };

    repository = new CareerMemoryRepository(mockClient);

    mockMemWalClient = {
      getUserNamespace: vi.fn((pid: string) => `finder:user:${pid}`),
      rememberAndWait: vi.fn().mockResolvedValue({
        blobId: "walrus-blob-mock-123",
        jobId: "job-123",
        namespace: `finder:user:${TEST_PROFILE_ID}`,
        isMock: true,
      }),
    };

    service = new CareerMemoryService(repository, mockMemWalClient);
  });

  describe("1. Repository: Entity Mapping & Database Operations", () => {
    it("should map snake_case database row to camelCase CareerMemory domain object", () => {
      const dbRow: CareerMemoryDbRow = {
        id: "mem-1",
        profile_id: "prof-1",
        category: "career_goal",
        content: "Transition to AI Engineer",
        source: "explicit_user",
        confidence: "high",
        status: "active",
        walrus_status: "stored",
        walrus_blob_id: "blob-123",
        walrus_object_id: "obj-123",
        metadata: { origin: "chat" },
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      };

      const entity = mapDbRowToCareerMemory(dbRow);
      expect(entity.id).toBe("mem-1");
      expect(entity.profileId).toBe("prof-1");
      expect(entity.category).toBe("career_goal");
      expect(entity.walrusBlobId).toBe("blob-123");
      expect(entity.walrusStatus).toBe("stored");
    });

    it("should insert a new memory with status active and walrus_status pending", async () => {
      const created = await repository.createMemory({
        profileId: TEST_PROFILE_ID,
        category: "work_preference",
        content: "Only interested in remote roles",
        source: "explicit_user",
        confidence: "high",
      });

      expect(created.id).toBeDefined();
      expect(created.status).toBe("active");
      expect(created.walrusStatus).toBe("pending");
      expect(created.content).toBe("Only interested in remote roles");
      expect(mockDbRows).toHaveLength(1);
    });

    it("should retrieve only active memories for user", async () => {
      await repository.createMemory({
        profileId: TEST_PROFILE_ID,
        category: "career_goal",
        content: "Target role AI",
        source: "explicit_user",
        confidence: "high",
      });

      const activeMemories = await repository.getActiveMemories(TEST_PROFILE_ID);
      expect(activeMemories).toHaveLength(1);
    });

    it("should update status to forgotten", async () => {
      const mem = await repository.createMemory({
        profileId: TEST_PROFILE_ID,
        category: "tech_focus",
        content: "Learning React",
        source: "explicit_user",
        confidence: "high",
      });

      const updated = await repository.updateMemoryStatus(
        mem.id,
        TEST_PROFILE_ID,
        "forgotten",
      );
      expect(updated.status).toBe("forgotten");
    });

    it("should guard against updating Walrus metadata if memory is forgotten", async () => {
      const mem = await repository.createMemory({
        profileId: TEST_PROFILE_ID,
        category: "tech_focus",
        content: "Learning React",
        source: "explicit_user",
        confidence: "high",
      });

      await repository.updateMemoryStatus(mem.id, TEST_PROFILE_ID, "forgotten");

      const updated = await repository.updateWalrusMetadata(
        mem.id,
        "blob-walrus-xyz",
        "0x123",
        "stored",
      );

      expect(updated).toBe(false);
      const rowInDb = mockDbRows.find((r) => r.id === mem.id);
      expect(rowInDb?.walrus_blob_id).toBeNull();
      expect(rowInDb?.status).toBe("forgotten");
    });
  });

  describe("2. Service: Lifecycle, Deduplication & Walrus Background Sync", () => {
    it("should remember fact and supersede existing similar memory in the same category", async () => {
      const mem1 = await service.rememberFact(TEST_PROFILE_ID, {
        category: "tech_focus",
        content: "Currently focusing on learning Next.js and React",
        source: "explicit_user",
        confidence: "high",
      });

      expect(mem1.status).toBe("active");
      expect(mockDbRows).toHaveLength(1);

      const mem2 = await service.rememberFact(TEST_PROFILE_ID, {
        category: "tech_focus",
        content: "Focusing on Next.js, React, and TypeScript",
        source: "explicit_user",
        confidence: "high",
      });

      expect(mem2.status).toBe("active");
      expect(mockDbRows).toHaveLength(2);
      expect(mem2.supersedesId).toBe(mem1.id);

      const row1 = mockDbRows.find((r) => r.id === mem1.id);
      const row2 = mockDbRows.find((r) => r.id === mem2.id);
      expect(row1?.status).toBe("superseded");
      expect(row2?.status).toBe("active");
    });

    it("should NOT supersede unrelated memories in the same category", async () => {
      const mem1 = await service.rememberFact(TEST_PROFILE_ID, {
        category: "work_preference",
        content: "Prefers remote roles only",
        source: "explicit_user",
        confidence: "high",
      });
      const mem2 = await service.rememberFact(TEST_PROFILE_ID, {
        category: "work_preference",
        content: "Prefers four-day work week",
        source: "explicit_user",
        confidence: "high",
      });

      expect(mem1.status).toBe("active");
      expect(mem2.status).toBe("active");
      expect(mem2.supersedesId).toBeNull();
    });

    it("should trigger non-blocking Walrus sync on rememberFact", async () => {
      const mem = await service.rememberFact(TEST_PROFILE_ID, {
        category: "career_goal",
        content: "Transition to AI Engineering",
        source: "explicit_user",
        confidence: "high",
      });

      expect(mem.id).toBeDefined();
      expect(mockMemWalClient.rememberAndWait).toHaveBeenCalled();
    });

    it("should generate a compact context summary for prompt injection", async () => {
      await service.rememberFact(TEST_PROFILE_ID, {
        category: "career_goal",
        content: "Transitioning toward AI Systems",
        source: "explicit_user",
        confidence: "high",
      });
      await service.rememberFact(TEST_PROFILE_ID, {
        category: "work_preference",
        content: "Prefers remote opportunities",
        source: "explicit_user",
        confidence: "high",
      });

      const summary = await service.getDurableContextSummary(TEST_PROFILE_ID);
      expect(summary).toContain("<untrusted_career_memory>");
      expect(summary).toContain("Career Goal / Direction: Transitioning toward AI Systems");
      expect(summary).toContain("Work Mode Preference: Prefers remote opportunities");
    });

    it("should return empty string if no active memories exist", async () => {
      const summary = await service.getDurableContextSummary("empty-user");
      expect(summary).toBe("");
    });
  });
});
