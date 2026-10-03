import { describe, it, expect } from "vitest";
import { getMemoryStatusPresentation } from "@/features/chat/utils/memory-status";

describe("Memory status presentation", () => {
  it("should treat 'stored' as verified", () => {
    expect(getMemoryStatusPresentation("stored")).toEqual({
      label: "Sovereign Career Memory Updated",
      tone: "verified",
    });
  });

  it("should treat 'failed' as a failure", () => {
    expect(getMemoryStatusPresentation("failed")).toEqual({
      label: "Memory sync failed",
      tone: "failed",
    });
  });

  it("should treat 'pending' and missing status as syncing", () => {
    expect(getMemoryStatusPresentation("pending")).toEqual({
      label: "Saved · Syncing to Walrus…",
      tone: "pending",
    });
    expect(getMemoryStatusPresentation()).toEqual({
      label: "Saved · Syncing to Walrus…",
      tone: "pending",
    });
  });
});
