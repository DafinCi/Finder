import { describe, it, expect } from "vitest";
import {
  buildMemoryEvidenceReport,
  renderMemoryEvidenceMarkdown,
  MemoryEvidenceRow,
  MemoryEvidenceProfile,
} from "@/features/memory/utils/memory-evidence";

function storedRow(
  profileId: string,
  index: number,
  updatedAt: string,
): MemoryEvidenceRow {
  return {
    profile_id: profileId,
    status: "active",
    walrus_status: "stored",
    walrus_blob_id: `blob-${profileId}-${index}`,
    updated_at: updatedAt,
  };
}

describe("Memory evidence aggregation", () => {
  const rows: MemoryEvidenceRow[] = [
    ...Array.from({ length: 10 }, (_, index) =>
      storedRow("user-1", index, `2026-10-0${(index % 5) + 1}T00:00:00Z`),
    ),
    {
      profile_id: "user-1",
      status: "active",
      walrus_status: "pending",
      walrus_blob_id: null,
      updated_at: "2026-10-02T00:00:00Z",
    },
    {
      profile_id: "user-2",
      status: "forgotten",
      walrus_status: "failed",
      walrus_blob_id: null,
      updated_at: "2026-10-03T00:00:00Z",
    },
  ];

  it("should aggregate totals per user and count stored blobs", () => {
    const report = buildMemoryEvidenceReport(rows, {
      agentId: "0xagent",
      network: "mainnet",
      now: "2026-10-04T00:00:00Z",
    });

    expect(report.totalUsers).toBe(2);
    expect(report.totalMemories).toBe(rows.length);
    expect(report.totalStoredBlobs).toBe(10);
    expect(report.usersMeetingThreshold).toBe(1);

    const user1 = report.users.find((user) => user.profileId === "user-1");
    expect(user1?.storedBlobs).toBe(10);
    expect(user1?.pending).toBe(1);
    expect(user1?.meetsSubmissionThreshold).toBe(true);

    const user2 = report.users.find((user) => user.profileId === "user-2");
    expect(user2?.failed).toBe(1);
    expect(user2?.meetsSubmissionThreshold).toBe(false);
  });

  it("should report the most recent stored timestamp", () => {
    const report = buildMemoryEvidenceReport(rows);
    expect(report.lastStoredAt).toBe("2026-10-05T00:00:00Z");
  });

  it("should render the header, totals, and one block per user", () => {
    const report = buildMemoryEvidenceReport(rows, {
      agentId: "0xagent",
      network: "mainnet",
    });
    const markdown = renderMemoryEvidenceMarkdown(report);

    expect(markdown).toContain("# Walrus Memory Evidence");
    expect(markdown).toContain("0xagent");
    expect(markdown).toContain("## Per user");
    expect(markdown).toContain("### 1.");
    expect(markdown).toContain("- Meets threshold: yes");
    expect(markdown).toContain("- Meets threshold: no");
  });

  it("should handle an empty database without throwing", () => {
    const report = buildMemoryEvidenceReport([], { agentId: null });
    expect(report.totalUsers).toBe(0);
    expect(report.totalStoredBlobs).toBe(0);
    expect(renderMemoryEvidenceMarkdown(report)).toContain("No users found.");
  });
});

describe("Memory evidence identity and sample blobs", () => {
  const profiles: MemoryEvidenceProfile[] = [
    { id: "user-1", full_name: "Ada Lovelace", sui_address: "0xaaa1" },
    { id: "user-2", full_name: "Grace Hopper", sui_address: "0xbbb2" },
    { id: "user-3", full_name: "Alan Turing", sui_address: "0xccc3" },
  ];

  const rows: MemoryEvidenceRow[] = [
    ...Array.from({ length: 12 }, (_, index) =>
      storedRow("user-1", index, `2026-10-01T00:00:0${index % 10}Z`),
    ),
    {
      profile_id: "user-2",
      status: "active",
      walrus_status: "pending",
      walrus_blob_id: null,
      updated_at: "2026-10-02T00:00:00Z",
    },
  ];

  it("should attach the name and wallet from profiles", () => {
    const report = buildMemoryEvidenceReport(rows, { profiles });
    const user1 = report.users.find((user) => user.profileId === "user-1");
    expect(user1?.displayName).toBe("Ada Lovelace");
    expect(user1?.suiAddress).toBe("0xaaa1");
    expect(user1?.meetsSubmissionThreshold).toBe(true);
  });

  it("should list a profile with no memories as a zero row", () => {
    const report = buildMemoryEvidenceReport(rows, { profiles });
    const user3 = report.users.find((user) => user.profileId === "user-3");
    expect(user3?.total).toBe(0);
    expect(user3?.storedBlobs).toBe(0);
    expect(user3?.meetsSubmissionThreshold).toBe(false);
    expect(report.usersMeetingThreshold).toBe(1);
  });

  it("should cap the sample blob ids at the threshold without losing the real count", () => {
    const report = buildMemoryEvidenceReport(rows, { profiles });
    const user1 = report.users.find((user) => user.profileId === "user-1");
    expect(user1?.storedBlobs).toBe(12);
    expect(user1?.sampleBlobIds).toHaveLength(10);
  });

  it("should list every blob when the sample limit is unlimited", () => {
    const report = buildMemoryEvidenceReport(rows, {
      profiles,
      sampleBlobIdsPerUser: Number.POSITIVE_INFINITY,
    });
    const user1 = report.users.find((user) => user.profileId === "user-1");
    expect(user1?.sampleBlobIds).toHaveLength(12);
  });

  it("should render the wallet, counts, and a walruscan link per blob", () => {
    const report = buildMemoryEvidenceReport(rows, { profiles });
    const markdown = renderMemoryEvidenceMarkdown(report);
    expect(markdown).toContain("### 1. Ada Lovelace");
    expect(markdown).toContain("- Wallet: 0xaaa1");
    expect(markdown).toContain("- Stored on Mainnet: 12 of 10 needed");
    expect(markdown).toContain(
      "https://walruscan.com/mainnet/blob/blob-user-1-0",
    );
  });

  it("should say how many blobs are shown when the list is truncated", () => {
    const report = buildMemoryEvidenceReport(rows, { profiles });
    const markdown = renderMemoryEvidenceMarkdown(report);
    expect(markdown).toContain("- Blobs: 10 of 12 shown");
    expect(markdown).toContain(
      "Pass --all-blobs to list every stored blob.",
    );
  });

  it("should mark a user with no stored blobs", () => {
    const report = buildMemoryEvidenceReport(rows, { profiles });
    const markdown = renderMemoryEvidenceMarkdown(report);
    expect(markdown).toContain("- Blobs: none stored");
  });

  it("should collapse newlines in a user heading", () => {
    const report = buildMemoryEvidenceReport([], {
      profiles: [{ id: "user-9", full_name: "Bad\nName", sui_address: null }],
    });
    const markdown = renderMemoryEvidenceMarkdown(report);
    expect(markdown).toContain("### 1. Bad Name");
  });
});
