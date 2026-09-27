import { describe, it, expect, vi } from "vitest";
import {
  normalizeGroqError,
  executeWithResilience,
  DEFAULT_GROQ_MODEL,
  FALLBACK_GROQ_MODEL,
} from "@/lib/groq/client";

describe("Unit: AI Resilience & Error Normalization", () => {
  describe("normalizeGroqError", () => {
    it("should return default message if error is falsy", () => {
      expect(normalizeGroqError(null)).toBe(
        "Terjadi kesalahan pada layanan AI.",
      );
      expect(normalizeGroqError(undefined)).toBe(
        "Terjadi kesalahan pada layanan AI.",
      );
    });

    it("should detect 429 rate limit errors and return user-friendly guidance", () => {
      const errWithStatus = { status: 429, message: "Rate limit reached" };
      expect(normalizeGroqError(errWithStatus)).toContain("Rate Limit");

      const errWithMessage = new Error("429 Too Many Requests");
      expect(normalizeGroqError(errWithMessage)).toContain("Rate Limit");

      const errWithTpm = new Error("TPM quota exceeded");
      expect(normalizeGroqError(errWithTpm)).toContain("Rate Limit");
    });

    it("should detect timeout errors and return timeout guidance", () => {
      const timeoutErr = new Error("Request timed out after 30000ms");
      expect(normalizeGroqError(timeoutErr)).toContain("timeout 30s");

      const etimedoutErr = new Error("ETIMEDOUT connection failed");
      expect(normalizeGroqError(etimedoutErr)).toContain("timeout 30s");
    });

    it("should detect 503 service unavailable or overloaded errors", () => {
      const err503 = { status: 503, message: "Service Unavailable" };
      expect(normalizeGroqError(err503)).toContain("beban tinggi");

      const errOverloaded = new Error("Model is overloaded");
      expect(normalizeGroqError(errOverloaded)).toContain("beban tinggi");
    });

    it("should detect 401 unauthorized / invalid api key errors", () => {
      const err401 = { status: 401, message: "Invalid API Key" };
      expect(normalizeGroqError(err401)).toContain(
        "Kredensial API AI tidak valid",
      );
    });

    it("should pass through unhandled custom error messages", () => {
      const customErr = new Error("Unexpected database state");
      expect(normalizeGroqError(customErr)).toBe("Unexpected database state");
    });
  });

  describe("executeWithResilience", () => {
    it("should return result from primary model on happy path without invoking fallback", async () => {
      const executeFn = vi.fn().mockImplementation(async (model: string) => {
        return `response-from-${model}`;
      });

      const result = await executeWithResilience("TestOperation", executeFn);

      expect(result.data).toBe(`response-from-${DEFAULT_GROQ_MODEL}`);
      expect(result.modelUsed).toBe(DEFAULT_GROQ_MODEL);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(executeFn).toHaveBeenCalledTimes(1);
      expect(executeFn).toHaveBeenCalledWith(DEFAULT_GROQ_MODEL);
    });

    it("should fallback to secondary model when primary model fails with 429 rate limit", async () => {
      const executeFn = vi.fn().mockImplementation(async (model: string) => {
        if (model === DEFAULT_GROQ_MODEL) {
          throw new Error("429 Too Many Requests: Rate limit exceeded");
        }
        return `fallback-response-from-${model}`;
      });

      const result = await executeWithResilience("TestFallback", executeFn);

      expect(result.data).toBe(`fallback-response-from-${FALLBACK_GROQ_MODEL}`);
      expect(result.modelUsed).toBe(FALLBACK_GROQ_MODEL);
      expect(executeFn).toHaveBeenCalledTimes(2);
      expect(executeFn).toHaveBeenNthCalledWith(1, DEFAULT_GROQ_MODEL);
      expect(executeFn).toHaveBeenNthCalledWith(2, FALLBACK_GROQ_MODEL);
    });

    it("should fallback to secondary model when primary model fails with 503 overloaded", async () => {
      const executeFn = vi.fn().mockImplementation(async (model: string) => {
        if (model === DEFAULT_GROQ_MODEL) {
          throw new Error("503 Service Unavailable: overloaded");
        }
        return `fallback-success`;
      });

      const result = await executeWithResilience("Test503Fallback", executeFn);

      expect(result.data).toBe("fallback-success");
      expect(result.modelUsed).toBe(FALLBACK_GROQ_MODEL);
      expect(executeFn).toHaveBeenCalledTimes(2);
    });

    it("should immediately rethrow non-recoverable errors without triggering fallback", async () => {
      const executeFn = vi.fn().mockImplementation(async () => {
        throw new Error("Invalid schema argument supplied");
      });

      await expect(
        executeWithResilience("NonRecoverableOp", executeFn),
      ).rejects.toThrow("Invalid schema argument supplied");

      expect(executeFn).toHaveBeenCalledTimes(1);
    });

    it("should throw fallback error if both primary and fallback models fail", async () => {
      const executeFn = vi.fn().mockImplementation(async (model: string) => {
        if (model === DEFAULT_GROQ_MODEL) {
          throw new Error("429 Rate limit");
        }
        throw new Error("Fallback also failed with 500");
      });

      await expect(
        executeWithResilience("DoubleFailureOp", executeFn),
      ).rejects.toThrow("Fallback also failed with 500");

      expect(executeFn).toHaveBeenCalledTimes(2);
    });
  });
});
