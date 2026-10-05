import { describe, it, expect } from "vitest";
import {
  extractWorkModeSignals,
  detectMemoryWorkModeConflict,
} from "@/features/memory/utils/memory-conflict";

describe("Memory work-mode conflict detection", () => {
  it("flags a preferred mode that the canonical profile does not include", () => {
    expect(
      detectMemoryWorkModeConflict(
        "Prefers remote jobs based in America",
        ["onsite"],
      ),
    ).toBe(true);
  });

  it("does not flag a memory that matches the canonical profile", () => {
    expect(
      detectMemoryWorkModeConflict("Prefers remote jobs", ["remote"]),
    ).toBe(false);
  });

  it("flags a memory that excludes a mode the profile includes", () => {
    expect(
      detectMemoryWorkModeConflict("No onsite roles, remote only", ["onsite"]),
    ).toBe(true);
  });

  it("does not flag anything when the profile has no work modes", () => {
    expect(detectMemoryWorkModeConflict("Prefers remote jobs", [])).toBe(false);
    expect(
      detectMemoryWorkModeConflict("Prefers remote jobs", null),
    ).toBe(false);
  });

  it("keeps negation scoped to its own clause", () => {
    const signals = extractWorkModeSignals(
      "Open to remote or hybrid, but never onsite",
    );
    expect(signals.preferred).toContain("remote");
    expect(signals.preferred).toContain("hybrid");
    expect(signals.excluded).toContain("onsite");
  });

  it("flags a memory that mentions a mode outside the canonical profile", () => {
    expect(
      detectMemoryWorkModeConflict("Prefers remote or hybrid", ["remote"]),
    ).toBe(true);
  });

  it("does not flag a memory whose modes are all canonical", () => {
    expect(
      detectMemoryWorkModeConflict("Prefers remote or hybrid", [
        "remote",
        "hybrid",
      ]),
    ).toBe(false);
  });
});
