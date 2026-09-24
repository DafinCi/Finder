/**
 * Lightweight, zero-dependency in-memory Sliding Window Rate Limiter.
 * Prevents API abuse, protects Groq TPM/RPM ceilings, and mitigates denial-of-service.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup interval to prevent memory leaks from inactive keys (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    const validTimestamps = record.timestamps.filter(
      (ts) => now - ts < windowMs,
    );
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, { timestamps: validTimestamps });
    }
  }
}

export interface RateLimitOptions {
  /** Identifier key (e.g. `chat:${userId}` or `analyze:${ip}`) */
  key: string;
  /** Maximum number of allowed requests in the time window */
  limit: number;
  /** Sliding window duration in milliseconds (default: 60,000ms = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit({
  key,
  limit,
  windowMs = 60 * 1000,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpiredRecords(windowMs);

  const record = rateLimitStore.get(key) || { timestamps: [] };
  // Keep only timestamps within current sliding window
  const activeTimestamps = record.timestamps.filter(
    (ts) => now - ts < windowMs,
  );

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0];
    const resetMs = Math.max(0, oldestTimestamp + windowMs - now);
    const resetInSeconds = Math.ceil(resetMs / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  const remaining = limit - activeTimestamps.length;
  const resetInSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    limit,
    remaining,
    resetInSeconds,
  };
}
