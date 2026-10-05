export type MemoryStatusTone = "pending" | "verified" | "failed";

export interface MemoryStatusPresentation {
  label: string;
  tone: MemoryStatusTone;
}

/**
 * Maps a memory's Walrus replication status for the memory panel.
 * The chat surface no longer shows replication status; it only confirms the save.
 */
export function getMemoryStatusPresentation(
  status?: string | null,
): MemoryStatusPresentation {
  if (status === "stored") {
    return { label: "Mainnet Certified", tone: "verified" };
  }
  if (status === "failed") {
    return { label: "Sync failed", tone: "failed" };
  }
  return { label: "Syncing to Walrus…", tone: "pending" };
}
