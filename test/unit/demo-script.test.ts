import { describe, it, expect } from "vitest";
import { buildMemoryDemoScript } from "@/features/memory/utils/demo-script";

describe("Memory before/after demo script", () => {
  it("should describe both runs and the evidence to collect", () => {
    const script = buildMemoryDemoScript();

    expect(script).toContain("before/after");
    expect(script).toContain("Amnesia mode");
    expect(script).toContain("Used N memories");
    expect(script).toContain("Copy conversation evidence");
  });

  it("should not contain an em dash", () => {
    expect(buildMemoryDemoScript()).not.toMatch(/\u2014/);
  });
});
