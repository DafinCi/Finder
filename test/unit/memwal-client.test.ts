import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemWalClient } from "@/lib/walrus/memwal-client";
import { CareerMemoryService } from "@/features/memory/services/career-memory.service";
import { CareerMemoryRepository } from "@/features/memory/repositories/career-memory.repository";

describe("MemWalClient & CareerMemoryService Semantic Integration", () => {
  let memwal: MemWalClient;
  let repository: CareerMemoryRepository;
  let service: CareerMemoryService;
  let mockDbRows: any[] = [];

  const TEST_PROFILE_ID = "profile-uuid-abc";

  beforeEach(() => {
    mockDbRows = [];
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: mockDbRows,
                  error: null,
                })),
              })),
            })),
          })),
        })),
        insert: vi.fn((payload: any) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              const row = { id: "mem-" + Date.now(), ...payload };
              mockDbRows.push(row);
              return { data: row, error: null };
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              select: vi.fn(() => ({ data: [{ id: "mem-1" }], error: null })),
            })),
          })),
        })),
      })),
    };

    repository = new CareerMemoryRepository(mockClient);
    memwal = new MemWalClient();

    const mockWalrusClient: any = {
      storeBlob: vi.fn().mockResolvedValue({
        blobId: "walrus-blob-mock-test",
        suiObjectId: "0xobjecttest",
      }),
    };

    service = new CareerMemoryService(repository, mockWalrusClient, memwal);
  });

  it("should generate user-isolated namespace format", () => {
    const ns = memwal.getUserNamespace("0x1234");
    expect(ns).toBe("finder:user:0x1234");
  });

  it("should generate correct Walruscan blob explorer URL", () => {
    const url = memwal.getBlobExplorerUrl("blob-xyz");
    expect(url).toContain("blob-xyz");
    expect(url).toContain("walruscan.com");
  });

  it("should store and recall semantic facts using MemWal client", async () => {
    const namespace = memwal.getUserNamespace(TEST_PROFILE_ID);
    await memwal.rememberAndWait(
      "Candidate prefers 100% remote roles and refuses onsite work",
      namespace
    );

    const recalled = await memwal.recall({
      query: "Does this user work remotely?",
      limit: 3,
      namespace,
    });

    expect(recalled).toBeDefined();
    expect(recalled.results.length).toBeGreaterThan(0);
    expect(recalled.results[0].text).toContain("remote");
  });

  it("should prioritize MemWal recall in getDurableContextSummary when query is provided", async () => {
    const namespace = memwal.getUserNamespace(TEST_PROFILE_ID);
    await memwal.rememberAndWait(
      "Candidate [CONSTRAINT]: Strictly requires salary above $150k USD",
      namespace
    );

    const summary = await service.getDurableContextSummary(
      TEST_PROFILE_ID,
      3,
      "What is the salary expectation?"
    );

    expect(summary).toContain("<untrusted_career_memory>");
    expect(summary).toContain("RECALLED FROM WALRUS MEMORY");
    expect(summary).toContain("150k");
  });
});
