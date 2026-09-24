import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Unit: In-Memory Sliding-Window Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should allow requests under the limit", () => {
    const key = `user_test_${Date.now()}`;
    const result1 = checkRateLimit({ key, limit: 3, windowMs: 10000 });
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit({ key, limit: 3, windowMs: 10000 });
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = checkRateLimit({ key, limit: 3, windowMs: 10000 });
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("should reject requests exceeding the limit with accurate resetInSeconds", () => {
    const key = `user_limit_exceeded_${Date.now()}`;
    // Exhaust 2 allowed calls
    checkRateLimit({ key, limit: 2, windowMs: 60000 });
    checkRateLimit({ key, limit: 2, windowMs: 60000 });

    // 3rd call should fail
    const blocked = checkRateLimit({ key, limit: 2, windowMs: 60000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
    expect(blocked.resetInSeconds).toBeLessThanOrEqual(60);
  });

  it("should enforce per-key isolation", () => {
    const keyUser1 = "user_alpha";
    const keyUser2 = "user_beta";

    // User 1 consumes all quota
    checkRateLimit({ key: keyUser1, limit: 1, windowMs: 60000 });
    const blockedUser1 = checkRateLimit({
      key: keyUser1,
      limit: 1,
      windowMs: 60000,
    });
    expect(blockedUser1.success).toBe(false);

    // User 2 should be unaffected
    const allowedUser2 = checkRateLimit({
      key: keyUser2,
      limit: 1,
      windowMs: 60000,
    });
    expect(allowedUser2.success).toBe(true);
  });

  it("should reset allowance after windowMs expires", () => {
    const key = `user_window_expire_${Date.now()}`;
    checkRateLimit({ key, limit: 1, windowMs: 5000 });

    const blocked = checkRateLimit({ key, limit: 1, windowMs: 5000 });
    expect(blocked.success).toBe(false);

    // Advance virtual clock past windowMs
    vi.advanceTimersByTime(5100);

    const allowedAgain = checkRateLimit({ key, limit: 1, windowMs: 5000 });
    expect(allowedAgain.success).toBe(true);
  });

  it("should garbage-collect stale timestamps after 5 minutes", () => {
    const key = `user_gc_${Date.now()}`;
    checkRateLimit({ key, limit: 5, windowMs: 10000 });

    // Advance clock past GC interval (300,000ms + margin)
    vi.advanceTimersByTime(310000);

    // Trigger GC pass with a new check
    const postGc = checkRateLimit({ key, limit: 5, windowMs: 10000 });
    expect(postGc.success).toBe(true);
    expect(postGc.remaining).toBe(4);
  });
});
