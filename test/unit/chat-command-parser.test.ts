import { describe, it, expect } from "vitest";
import {
  parseChatCommand,
  inferMemoryCategory,
  MEMORY_CONTENT_MAX_LENGTH,
} from "@/features/chat/commands/parse-chat-command";

describe("Chat command parser", () => {
  it("returns null for a normal message", () => {
    expect(parseChatCommand("What jobs fit my profile?")).toBeNull();
  });

  it("returns null for an unknown command so it reaches the agent", () => {
    expect(parseChatCommand("/jobs page is broken")).toBeNull();
    expect(parseChatCommand("/etc/hosts")).toBeNull();
  });

  it("parses /help", () => {
    expect(parseChatCommand("/help")).toEqual({ kind: "help" });
  });

  it("asks for content when /remember has no fact", () => {
    const result = parseChatCommand("/remember");
    expect(result).toMatchObject({ kind: "error", code: "MISSING_CONTENT" });
  });

  it("rejects content that is too short", () => {
    const result = parseChatCommand("/remember ab");
    expect(result).toMatchObject({ kind: "error", code: "CONTENT_TOO_SHORT" });
  });

  it("rejects content that is too long", () => {
    const long = "a".repeat(MEMORY_CONTENT_MAX_LENGTH + 1);
    const result = parseChatCommand(`/remember ${long}`);
    expect(result).toMatchObject({ kind: "error", code: "CONTENT_TOO_LONG" });
  });

  it("infers a category when none is given", () => {
    const result = parseChatCommand("/remember I only want remote roles");
    expect(result).toMatchObject({
      kind: "remember",
      category: "work_preference",
      categorySource: "inferred",
      content: "I only want remote roles",
    });
  });

  it("honours an explicit category and strips it from the content", () => {
    const result = parseChatCommand(
      "/remember tech_focus I am learning Rust and Tokio",
    );
    expect(result).toMatchObject({
      kind: "remember",
      category: "tech_focus",
      categorySource: "explicit",
      content: "I am learning Rust and Tokio",
    });
  });
});

describe("Memory category inference", () => {
  it("maps explicit exclusions to constraint_avoid", () => {
    expect(inferMemoryCategory("I do not want to work on gambling")).toBe(
      "constraint_avoid",
    );
  });

  it("maps salary floors to constraint_avoid", () => {
    expect(inferMemoryCategory("My salary floor is 15 million")).toBe(
      "constraint_avoid",
    );
  });

  it("maps technology mentions to tech_focus", () => {
    expect(inferMemoryCategory("My core stack is React and TypeScript")).toBe(
      "tech_focus",
    );
  });

  it("maps role changes to role_transition", () => {
    expect(inferMemoryCategory("I am switching from support to frontend")).toBe(
      "role_transition",
    );
  });

  it("maps corrections to user_correction", () => {
    expect(
      inferMemoryCategory("Correction: I said I knew Vue well"),
    ).toBe("user_correction");
  });

  it("falls back to career_goal", () => {
    expect(inferMemoryCategory("I want to become a senior engineer")).toBe(
      "career_goal",
    );
  });
});
