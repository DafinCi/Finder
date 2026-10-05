import { describe, it, expect } from "vitest";
import { AGENT_TOOL_DEFINITIONS } from "@/features/agent/tools/agent-tool.definitions";

describe("Agent tool definitions", () => {
  it("should describe remember_fact without exposing sync status to the user", () => {
    const tool = AGENT_TOOL_DEFINITIONS.find(
      (t) => t.function.name === "remember_fact",
    );

    expect(tool).toBeDefined();
    expect(tool!.function.description).toContain("into their career memory");
    expect(tool!.function.description).toContain(
      "Do NOT mention Walrus, Mainnet, or sync/verification status",
    );
    expect(tool!.function.description).toContain(
      "Do NOT use this for language or communication-style preferences",
    );
  });
});
