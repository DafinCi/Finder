/**
 * Pure aggregation for the Walrus Memory evidence report.
 * Read-only: it only summarizes rows that were already fetched.
 */

export interface MemoryEvidenceRow {
  profile_id: string;
  status: string;
  walrus_status: string;
  walrus_blob_id: string | null;
  updated_at?: string | null;
}

export interface MemoryEvidenceUser {
  profileId: string;
  total: number;
  active: number;
  storedBlobs: number;
  pending: number;
  failed: number;
  meetsSubmissionThreshold: boolean;
}

export interface MemoryEvidenceReport {
  agentId: string | null;
  network: string;
  generatedAt: string;
  submissionThreshold: number;
  totalMemories: number;
  totalStoredBlobs: number;
  totalUsers: number;
  usersMeetingThreshold: number;
  lastStoredAt: string | null;
  users: MemoryEvidenceUser[];
}

export function buildMemoryEvidenceReport(
  rows: MemoryEvidenceRow[],
  options?: {
    agentId?: string | null;
    network?: string;
    now?: string;
    submissionThreshold?: number;
  },
): MemoryEvidenceReport {
  const submissionThreshold = options?.submissionThreshold ?? 10;
  const byUser = new Map<string, MemoryEvidenceUser>();
  let lastStoredAt: string | null = null;

  for (const row of rows) {
    const user =
      byUser.get(row.profile_id) ??
      ({
        profileId: row.profile_id,
        total: 0,
        active: 0,
        storedBlobs: 0,
        pending: 0,
        failed: 0,
        meetsSubmissionThreshold: false,
      } satisfies MemoryEvidenceUser);

    user.total += 1;
    if (row.status === "active") user.active += 1;
    if (row.walrus_status === "pending") user.pending += 1;
    if (row.walrus_status === "failed") user.failed += 1;

    if (row.walrus_status === "stored" && row.walrus_blob_id) {
      user.storedBlobs += 1;
      if (row.updated_at && (!lastStoredAt || row.updated_at > lastStoredAt)) {
        lastStoredAt = row.updated_at;
      }
    }

    byUser.set(row.profile_id, user);
  }

  const users = Array.from(byUser.values()).map((user) => ({
    ...user,
    meetsSubmissionThreshold: user.storedBlobs >= submissionThreshold,
  }));
  users.sort((a, b) => b.storedBlobs - a.storedBlobs);

  return {
    agentId: options?.agentId ?? null,
    network: options?.network ?? "mainnet",
    generatedAt: options?.now ?? new Date().toISOString(),
    submissionThreshold,
    totalMemories: rows.length,
    totalStoredBlobs: users.reduce((sum, user) => sum + user.storedBlobs, 0),
    totalUsers: users.length,
    usersMeetingThreshold: users.filter((user) => user.meetsSubmissionThreshold)
      .length,
    lastStoredAt,
    users,
  };
}

export function renderMemoryEvidenceMarkdown(
  report: MemoryEvidenceReport,
): string {
  const lines: string[] = [
    "# Walrus Memory Evidence",
    "",
    `Generated: ${report.generatedAt}`,
    `Network: ${report.network}`,
    `Agent ID: ${report.agentId || "not configured"}`,
    `Submission threshold: ${report.submissionThreshold} stored blobs per user`,
    "",
    "## Totals",
    "",
    `- Users: ${report.totalUsers}`,
    `- Users meeting the threshold: ${report.usersMeetingThreshold}`,
    `- Memories: ${report.totalMemories}`,
    `- Stored blobs on Mainnet: ${report.totalStoredBlobs}`,
    `- Last stored at: ${report.lastStoredAt || "not yet"}`,
    "",
    "## Per user",
    "",
    "| Profile | Total | Active | Stored | Pending | Failed | Meets threshold |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const user of report.users) {
    lines.push(
      `| ${user.profileId} | ${user.total} | ${user.active} | ${user.storedBlobs} | ${user.pending} | ${user.failed} | ${user.meetsSubmissionThreshold ? "yes" : "no"} |`,
    );
  }

  if (report.users.length === 0) {
    lines.push("| (no memories yet) | 0 | 0 | 0 | 0 | 0 | no |");
  }

  return lines.join("\n");
}
