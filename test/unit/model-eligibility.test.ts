import { describe, it, expect } from "vitest";
import { isBeyondBigTwo } from "@/features/chat/utils/model-eligibility";

describe("Beyond the Big Two eligibility", () => {
  it("accepts non-Anthropic and non-OpenAI primary models", () => {
    expect(isBeyondBigTwo("qwen/qwen3.8-27b")).toBe(true);
    expect(isBeyondBigTwo("meta-llama/llama-3.3-70b-versatile")).toBe(true);
    expect(isBeyondBigTwo("minimaxai/minimax-m2.7")).toBe(true);
  });

  it("rejects Anthropic and OpenAI primary models", () => {
    expect(isBeyondBigTwo("openai/gpt-oss-20b")).toBe(false);
    expect(isBeyondBigTwo("anthropic/claude-sonnet")).toBe(false);
  });

  it("returns false when the model is unknown", () => {
    expect(isBeyondBigTwo(null)).toBe(false);
    expect(isBeyondBigTwo(undefined)).toBe(false);
    expect(isBeyondBigTwo("")).toBe(false);
  });
});
