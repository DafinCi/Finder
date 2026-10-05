import { describe, it, expect, vi, afterEach } from "vitest";
import {
  obfuscateId,
  redactSensitiveValue,
  redactSensitiveFields,
  emitAiEvent,
} from "@/lib/observability/ai-events";

describe("AI observability events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should obfuscate long identifiers", () => {
    expect(obfuscateId("user-1234567890")).toBe("user-123…");
    expect(obfuscateId("short")).toBe("short");
    expect(obfuscateId("")).toBe("");
  });

  it("should redact secret-looking keys", () => {
    expect(redactSensitiveValue("apiKey", "secret-value")).toBe("[REDACTED]");
    expect(redactSensitiveValue("authorization", "Bearer x")).toBe(
      "[REDACTED]",
    );
    expect(redactSensitiveValue("tool", "remember_fact")).toBe("remember_fact");
  });

  it("should redact sensitive fields while preserving safe fields", () => {
    const redacted = redactSensitiveFields({
      tool: "remember_fact",
      groqApiKey: "gsk_secret",
      status: "pending",
    });

    expect(redacted.tool).toBe("remember_fact");
    expect(redacted.status).toBe("pending");
    expect(redacted.groqApiKey).toBe("[REDACTED]");
  });

  it("should emit a JSON event without leaking secret values", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    emitAiEvent("chat.request", {
      userId: obfuscateId("user-abcdef123456"),
      groqApiKey: "gsk_should_not_leak",
    });

    const logged = logSpy.mock.calls[0][0] as string;
    expect(logged).toContain("[AI:Event]");
    expect(logged).toContain('"event":"chat.request"');
    expect(logged).toContain('"groqApiKey":"[REDACTED]"');
    expect(logged).not.toContain("gsk_should_not_leak");
  });
});
