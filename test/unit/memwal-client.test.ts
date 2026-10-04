import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemWalClient } from "@/lib/walrus/memwal-client";
import {
  CareerMemoryService,
  normalizeMemoryContent,
  isRecalledMemoryZombie,
} from "@/features/memory/services/career-memory.service";
import { CareerMemoryRepository } from "@/features/memory/repositories/career-memory.repository";
import { CareerMemory } from "@/features/memory/types/memory.types";

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
          eq: vi.fn((col1: string, val1: any) => ({
            eq: vi.fn((col2: string, val2: any) => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: mockDbRows.filter(
                    (r) => (r as any)[col1] === val1 && (r as any)[col2] === val2,
                  ),
                  error: null,
                })),
              })),
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

  it("should report recall source and items via getDurableContext", async () => {
    const namespace = memwal.getUserNamespace(TEST_PROFILE_ID);
    await memwal.rememberAndWait(
      "Candidate [TECH_FOCUS]: Deep expertise in Rust and Sui Move",
      namespace
    );

    const recall = await service.getDurableContext(
      TEST_PROFILE_ID,
      3,
      "Which stack does the candidate use?"
    );

    expect(recall.source).toBe("walrus");
    expect(recall.memories.length).toBeGreaterThan(0);
    expect(recall.memories[0].content).toContain("Rust");
    expect(recall.context).toContain("RECALLED FROM WALRUS MEMORY");
  });

  it("should report 'cache' when Walrus recall returns nothing", async () => {
    mockDbRows.push({
      id: "m-cache-1",
      profile_id: TEST_PROFILE_ID,
      category: "tech_focus",
      content: "Knows Go and PostgreSQL",
      status: "active",
      walrus_status: "stored",
      walrus_blob_id: "blob-cache-1",
    });

    const recall = await service.getDurableContext(
      TEST_PROFILE_ID,
      3,
      "What databases does the candidate know?"
    );

    expect(recall.source).toBe("cache");
    expect(recall.memories[0].content).toContain("Go");
  });

  describe("Zombie Memory Elimination & Lifecycle Authority", () => {
    it("should normalize memory content by stripping candidate prefixes and punctuation", () => {
      const norm1 = normalizeMemoryContent("Candidate [WORK_PREFERENCE]: 100% Remote Only!");
      expect(norm1).toBe("100 remote only");

      const norm2 = normalizeMemoryContent("Candidate [CONSTRAINT]: Strictly requires salary above $150k USD");
      expect(norm2).toBe("strictly requires salary above 150k usd");
    });

    it("should correctly identify a recalled memory as a zombie when matching an inactive record", () => {
      const inactive: CareerMemory[] = [
        {
          id: "mem-forgotten-1",
          profileId: TEST_PROFILE_ID,
          category: "work_preference",
          content: "Prefers relocation to Berlin",
          source: "explicit_user",
          confidence: "high",
          status: "forgotten",
          walrusStatus: "stored",
          walrusBlobId: "blob-berlin-123",
          walrusObjectId: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Match via blob ID
      const recalledByBlob = {
        blob_id: "blob-berlin-123",
        text: "Candidate [WORK_PREFERENCE]: Prefers relocation to Berlin",
        distance: 0.05,
      };
      expect(isRecalledMemoryZombie(recalledByBlob, inactive)).toBe(true);

      // Match via fuzzy text
      const recalledByText = {
        blob_id: "blob-other-456",
        text: "Candidate [WORK_PREFERENCE]: Prefers relocation to Berlin, Germany",
        distance: 0.08,
      };
      expect(isRecalledMemoryZombie(recalledByText, inactive)).toBe(true);

      // Unrelated active fact is NOT a zombie
      const activeFact = {
        blob_id: "blob-remote-789",
        text: "Candidate [WORK_PREFERENCE]: 100% Remote Only",
        distance: 0.1,
      };
      expect(isRecalledMemoryZombie(activeFact, inactive)).toBe(false);
    });

    it("should filter out forgotten memories from recallActiveFromWalrus", async () => {
      const namespace = memwal.getUserNamespace(TEST_PROFILE_ID);

      // Store two facts into MemWal
      await memwal.rememberAndWait(
        "Candidate [WORK_PREFERENCE]: Prefers relocation to Singapore",
        namespace
      );
      await memwal.rememberAndWait(
        "Candidate [TECH_FOCUS]: Deep expertise in Rust and Sui Move",
        namespace
      );

      // In canonical database, mark Singapore as 'forgotten', Rust as 'active'
      mockDbRows.push(
        {
          id: "db-mem-1",
          profile_id: TEST_PROFILE_ID,
          category: "work_preference",
          content: "Prefers relocation to Singapore",
          status: "forgotten",
          walrus_status: "stored",
          walrus_blob_id: "blob-sg",
        },
        {
          id: "db-mem-2",
          profile_id: TEST_PROFILE_ID,
          category: "tech_focus",
          content: "Deep expertise in Rust and Sui Move",
          status: "active",
          walrus_status: "stored",
          walrus_blob_id: "blob-rust",
        }
      );

      const activeRecalled = await service.recallActiveFromWalrus(
        TEST_PROFILE_ID,
        "Where does the candidate want to work and what stack?",
        5
      );

      // The forgotten Singapore fact must be silenced
      const textJoined = activeRecalled.map((r) => r.text).join(" ");
      expect(textJoined).not.toContain("Singapore");
      expect(textJoined).toContain("Rust");
    });

    it("should filter out superseded memories from recallActiveFromWalrus", async () => {
      const namespace = memwal.getUserNamespace(TEST_PROFILE_ID);

      // User changed salary requirement over time
      await memwal.rememberAndWait(
        "Candidate [CONSTRAINT]: Minimum salary $100k USD",
        namespace
      );
      await memwal.rememberAndWait(
        "Candidate [CONSTRAINT]: Minimum salary $160k USD",
        namespace
      );

      // In canonical database, old $100k is superseded, new $160k is active
      mockDbRows.push(
        {
          id: "db-sal-old",
          profile_id: TEST_PROFILE_ID,
          category: "constraint_avoid",
          content: "Minimum salary $100k USD",
          status: "superseded",
          walrus_status: "stored",
          walrus_blob_id: "blob-old-sal",
        },
        {
          id: "db-sal-new",
          profile_id: TEST_PROFILE_ID,
          category: "constraint_avoid",
          content: "Minimum salary $160k USD",
          status: "active",
          walrus_status: "stored",
          walrus_blob_id: "blob-new-sal",
        }
      );

      const activeRecalled = await service.recallActiveFromWalrus(
        TEST_PROFILE_ID,
        "What is the salary floor requirement?",
        5
      );

      const textJoined = activeRecalled.map((r) => r.text).join(" ");
      expect(textJoined).not.toContain("100k");
      expect(textJoined).toContain("160k");
    });

    it("should not inject forgotten memories into LLM prompt via getDurableContextSummary", async () => {
      const namespace = memwal.getUserNamespace(TEST_PROFILE_ID);

      // User told bot they want Tokyo, then forgot it
      await memwal.rememberAndWait(
        "Candidate [WORK_PREFERENCE]: Only accepts roles in Tokyo",
        namespace
      );

      mockDbRows.push({
        id: "db-tokyo-1",
        profile_id: TEST_PROFILE_ID,
        category: "work_preference",
        content: "Only accepts roles in Tokyo",
        status: "forgotten",
        walrus_status: "stored",
        walrus_blob_id: "blob-tokyo",
      });

      const summary = await service.getDurableContextSummary(
        TEST_PROFILE_ID,
        3,
        "Show me jobs in Tokyo"
      );

      // Because the Tokyo memory is forgotten and no other active memory exists, summary is empty
      expect(summary).not.toContain("Tokyo");
      expect(summary).toBe("");
    });
  });
});

describe("MemWalClient production configuration guard", () => {
  it("should fail explicitly in production when MemWal credentials are missing", () => {
    const prevKey = process.env.MEMWAL_DELEGATE_PRIVATE_KEY;
    const prevAccount = process.env.MEMWAL_ACCOUNT_ID;
    delete process.env.MEMWAL_DELEGATE_PRIVATE_KEY;
    delete process.env.MEMWAL_ACCOUNT_ID;

    try {
      expect(() => new MemWalClient({ forceLive: true })).toThrow(
        /not configured/,
      );
    } finally {
      if (prevKey) process.env.MEMWAL_DELEGATE_PRIVATE_KEY = prevKey;
      if (prevAccount) process.env.MEMWAL_ACCOUNT_ID = prevAccount;
    }
  });
});
