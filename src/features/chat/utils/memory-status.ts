export type MemoryStatusTone = "pending" | "verified" | "failed";

export interface MemoryStatusPresentation {
  label: string;
  tone: MemoryStatusTone;
}

/**
 * Maps a backend memory/walrus status to a user-facing label and visual tone.
 * The immediate chat response is typically "pending" (async Walrus sync).
 */
export function getMemoryStatusPresentation(
  status?: string | null,
): MemoryStatusPresentation {
  if (status === "stored") {
    return { label: "Sovereign Career Memory Updated", tone: "verified" };
  }
  if (status === "failed") {
    return { label: "Memory sync failed", tone: "failed" };
  }
  return { label: "Saved · Syncing to Walrus…", tone: "pending" };
}
