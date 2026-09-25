import crypto from "crypto";
import { SuiNetwork, getConfiguredSuiNetwork } from "./network";

export type SiwsPurpose = "SIWS_LOGIN" | "SIWS_LINK";

export interface NonceRecord {
  nonce: string;
  purpose: SiwsPurpose;
  network: SuiNetwork;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
}

export type NonceConsumeStatus =
  | "SUCCESS"
  | "INVALID_NONCE"
  | "EXPIRED_NONCE"
  | "NONCE_ALREADY_USED"
  | "PURPOSE_MISMATCH"
  | "NETWORK_MISMATCH";

export interface NonceConsumeResult {
  status: NonceConsumeStatus;
  record?: NonceRecord;
  error?: string;
}

/** Nonce valid lifetime: 5 minutes in milliseconds */
export const NONCE_TTL_MS = 5 * 60 * 1000;

class NonceManager {
  private store = new Map<string, NonceRecord>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000;

  /**
   * Generates a cryptographically secure 256-bit random nonce bound to a specific
   * purpose and target Sui network.
   */
  public generateNonce(
    purpose: SiwsPurpose,
    network: SuiNetwork = getConfiguredSuiNetwork(),
  ): NonceRecord {
    this.cleanupExpired();

    const nonce = crypto.randomBytes(32).toString("hex");
    const now = Date.now();

    const record: NonceRecord = {
      nonce,
      purpose,
      network,
      createdAt: now,
      expiresAt: now + NONCE_TTL_MS,
      consumed: false,
    };

    this.store.set(nonce, record);
    return record;
  }

  /**
   * Atomically consumes a nonce for verification.
   * Enforces:
   * 1. Existence
   * 2. Expiration
   * 3. Single-use (replays rejected)
   * 4. Purpose-match (login vs link)
   * 5. Network-match
   */
  public consumeNonce(
    nonce: string,
    expectedPurpose: SiwsPurpose,
    expectedNetwork: SuiNetwork = getConfiguredSuiNetwork(),
  ): NonceConsumeResult {
    this.cleanupExpired();

    if (!nonce || typeof nonce !== "string") {
      return {
        status: "INVALID_NONCE",
        error: "Missing or invalid nonce identifier.",
      };
    }

    const record = this.store.get(nonce);

    if (!record) {
      return {
        status: "INVALID_NONCE",
        error: "Nonce not found or unrecognized by the server.",
      };
    }

    const now = Date.now();

    if (now > record.expiresAt) {
      this.store.delete(nonce);
      return {
        status: "EXPIRED_NONCE",
        error: "Authentication challenge has expired. Please request a new signature.",
      };
    }

    // Atomic consumption check: if already consumed, reject immediately
    if (record.consumed) {
      return {
        status: "NONCE_ALREADY_USED",
        error: "Authentication nonce has already been consumed. Replay rejected.",
      };
    }

    // Purpose-binding check
    if (record.purpose !== expectedPurpose) {
      return {
        status: "PURPOSE_MISMATCH",
        error: `Nonce purpose mismatch: issued for ${record.purpose}, but verified for ${expectedPurpose}.`,
      };
    }

    // Network-binding check
    if (record.network !== expectedNetwork) {
      return {
        status: "NETWORK_MISMATCH",
        error: `Nonce network mismatch: issued for ${record.network}, but verified for ${expectedNetwork}.`,
      };
    }

    // Mark as consumed atomically
    record.consumed = true;
    this.store.set(nonce, record);

    return {
      status: "SUCCESS",
      record,
    };
  }

  /**
   * Cleans up expired nonce records from in-memory cache to prevent memory bloat.
   */
  private cleanupExpired(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL_MS) return;

    this.lastCleanup = now;
    for (const [nonce, record] of this.store.entries()) {
      if (now > record.expiresAt + 60000 || (record.consumed && now > record.createdAt + 60000)) {
        this.store.delete(nonce);
      }
    }
  }

  /**
   * Reset store (primarily used in test suites).
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Returns current active nonce count in store (for testing/diagnostics).
   */
  public get size(): number {
    return this.store.size;
  }
}

export const nonceManager = new NonceManager();
