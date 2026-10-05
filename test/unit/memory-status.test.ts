import { describe, it, expect } from "vitest";
import { getMemoryStatusPresentation } from "@/features/memory/utils/memory-status";

describe("Memory status presentation", () => {
  it("should treat 'stored' as Mainnet certified", () => {
    expect(getMemoryStatusPresentation("stored")).toEqual({
      label: "Mainnet Certified",
      tone: "verified",
    });
  });

  it("should treat 'failed' as a failure", () => {
    expect(getMemoryStatusPresentation("failed")).toEqual({
      label: "Sync failed",
      tone: "failed",
    });
  });

  it("should treat 'pending' and missing status as syncing", () => {
    expect(getMemoryStatusPresentation("pending")).toEqual({
      label: "Syncing to Walrus…",
      tone: "pending",
    });
    expect(getMemoryStatusPresentation()).toEqual({
      label: "Syncing to Walrus…",
      tone: "pending",
    });
  });
});
