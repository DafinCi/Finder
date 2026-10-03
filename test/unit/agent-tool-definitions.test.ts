import { describe, it, expect } from "vitest";
import { AGENT_TOOL_DEFINITIONS } from "@/features/agent/tools/agent-tool.definitions";

describe("Agent tool definitions", () => {
  it("should describe remember_fact as asynchronous and non-language-scoped", () => {
    const tool = AGENT_TOOL_DEFINITIONS.find(
      (t) => t.function.name === "remember_fact",
    );

    expect(tool).toBeDefined();
    expect(tool!.function.description).toContain("synchronized to Walrus Mainnet asynchronously");
    expect(tool!.function.description).toContain("'pending'");
    expect(tool!.function.description).toContain("'stored'");
    expect(tool!.function.description).toContain(
      "Do NOT use this for language or communication-style preferences",
    );
  });
});
