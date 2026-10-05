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

export interface MemoryEvidenceProfile {
  id: string;
  full_name?: string | null;
  sui_address?: string | null;
}

export interface MemoryEvidenceUser {
  profileId: string;
  displayName: string | null;
  suiAddress: string | null;
  total: number;
  active: number;
  storedBlobs: number;
  pending: number;
  failed: number;
  sampleBlobIds: string[];
  meetsSubmissionThreshold: boolean;
}

export interface MemoryEvidenceReport {
  agentId: string | null;
  network: string;
  explorerBaseUrl: string;
  generatedAt: string;
  submissionThreshold: number;
  totalMemories: number;
  totalStoredBlobs: number;
  totalUsers: number;
  usersMeetingThreshold: number;
  lastStoredAt: string | null;
  users: MemoryEvidenceUser[];
}

function explorerBaseUrlFor(network: string): string {
  return `https://walruscan.com/${network}/blob`;
}

function toSingleLine(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}

function emptyUser(profileId: string): MemoryEvidenceUser {
  return {
    profileId,
    displayName: null,
    suiAddress: null,
    total: 0,
    active: 0,
    storedBlobs: 0,
    pending: 0,
    failed: 0,
    sampleBlobIds: [],
    meetsSubmissionThreshold: false,
  };
}

export function buildMemoryEvidenceReport(
  rows: MemoryEvidenceRow[],
  options?: {
    agentId?: string | null;
    network?: string;
    explorerBaseUrl?: string;
    profiles?: MemoryEvidenceProfile[];
    sampleBlobIdsPerUser?: number;
    now?: string;
    submissionThreshold?: number;
  },
): MemoryEvidenceReport {
  const network = options?.network ?? "mainnet";
  const submissionThreshold = options?.submissionThreshold ?? 10;
  // Default to the threshold, so the report always proves at least that many.
  const sampleLimit = options?.sampleBlobIdsPerUser ?? submissionThreshold;

  const byUser = new Map<string, MemoryEvidenceUser>();
  const profileById = new Map<string, MemoryEvidenceProfile>();

  // Profiles come first so an account with no memories still shows up as a
  // zero row, which is how you notice a seeded user that fell short.
  for (const profile of options?.profiles ?? []) {
    profileById.set(profile.id, profile);
    const user = emptyUser(profile.id);
    user.displayName = profile.full_name?.trim() || null;
    user.suiAddress = profile.sui_address?.trim() || null;
    byUser.set(profile.id, user);
  }

  let lastStoredAt: string | null = null;

  for (const row of rows) {
    const profile = profileById.get(row.profile_id);
    const user = byUser.get(row.profile_id) ?? emptyUser(row.profile_id);
    if (user.displayName === null) {
      user.displayName = profile?.full_name?.trim() || null;
    }
    if (user.suiAddress === null) {
      user.suiAddress = profile?.sui_address?.trim() || null;
    }

    user.total += 1;
    if (row.status === "active") user.active += 1;
    if (row.walrus_status === "pending") user.pending += 1;
    if (row.walrus_status === "failed") user.failed += 1;

    if (row.walrus_status === "stored" && row.walrus_blob_id) {
      user.storedBlobs += 1;
      if (user.sampleBlobIds.length < sampleLimit) {
        user.sampleBlobIds.push(row.walrus_blob_id);
      }
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
  users.sort((a, b) => b.storedBlobs - a.storedBlobs || b.total - a.total);

  return {
    agentId: options?.agentId ?? null,
    network,
    explorerBaseUrl: options?.explorerBaseUrl ?? explorerBaseUrlFor(network),
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
    "",
    "## Totals",
    "",
    `- Users: ${report.totalUsers}`,
    `- Users meeting the threshold: ${report.usersMeetingThreshold}`,
    `- Memories: ${report.totalMemories}`,
    `- Stored blobs on Mainnet: ${report.totalStoredBlobs}`,
    `- Last stored at: ${report.lastStoredAt || "not yet"}`,
    `- Submission threshold: ${report.submissionThreshold} stored blobs per user`,
    "",
    "## Per user",
    "",
  ];

  if (report.users.length === 0) {
    lines.push("No users found.", "");
    return lines.join("\n");
  }

  let truncated = false;

  report.users.forEach((user, index) => {
    const heading = toSingleLine(user.displayName || user.profileId);
    lines.push(`### ${index + 1}. ${heading}`, "");
    lines.push(`- Profile: ${user.profileId}`);
    lines.push(`- Wallet: ${user.suiAddress || "not linked"}`);
    lines.push(
      `- Memories: ${user.total} total, ${user.active} active, ${user.pending} pending, ${user.failed} failed`,
    );
    lines.push(
      `- Stored on Mainnet: ${user.storedBlobs} of ${report.submissionThreshold} needed`,
    );
    lines.push(
      `- Meets threshold: ${user.meetsSubmissionThreshold ? "yes" : "no"}`,
    );

    if (user.sampleBlobIds.length === 0) {
      lines.push("- Blobs: none stored", "");
      return;
    }

    const isTruncated = user.storedBlobs > user.sampleBlobIds.length;
    if (isTruncated) truncated = true;
    lines.push(
      `- Blobs: ${
        isTruncated
          ? `${user.sampleBlobIds.length} of ${user.storedBlobs} shown`
          : `all ${user.storedBlobs} shown`
      }`,
    );
    for (const blobId of user.sampleBlobIds) {
      lines.push(`  - [${blobId}](${report.explorerBaseUrl}/${blobId})`);
    }
    lines.push("");
  });

  if (truncated) {
    lines.push(
      "Some users have more stored blobs than shown. Pass --all-blobs to list every stored blob.",
      "",
    );
  }

  return lines.join("\n");
}
