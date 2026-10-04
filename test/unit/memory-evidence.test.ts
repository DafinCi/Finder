import { describe, it, expect } from "vitest";
import {
  buildMemoryEvidenceReport,
  renderMemoryEvidenceMarkdown,
  MemoryEvidenceRow,
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

  it("should render a markdown report with the agent id and per-user rows", () => {
    const report = buildMemoryEvidenceReport(rows, {
      agentId: "0xagent",
      network: "mainnet",
    });
    const markdown = renderMemoryEvidenceMarkdown(report);

    expect(markdown).toContain("# Walrus Memory Evidence");
    expect(markdown).toContain("0xagent");
    expect(markdown).toContain("| user-1 |");
    expect(markdown).toContain("Meets threshold");
  });

  it("should handle an empty database without throwing", () => {
    const report = buildMemoryEvidenceReport([], { agentId: null });
    expect(report.totalUsers).toBe(0);
    expect(report.totalStoredBlobs).toBe(0);
    expect(renderMemoryEvidenceMarkdown(report)).toContain("no memories yet");
  });
});
