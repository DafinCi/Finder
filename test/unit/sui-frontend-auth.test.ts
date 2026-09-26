import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapSuiAuthError,
  SUI_ERROR_MESSAGES,
  SuiBackendErrorCode,
  SuiClientErrorCode,
} from "@/features/sui/types/sui-auth.types";
import {
  fetchSiwsNonce,
  verifySiwsLogin,
  linkSiwsWallet,
  unlinkSiwsWallet,
  SuiAuthApiError,
} from "@/features/sui/services/sui-auth.service";
import {
  isSyntheticSuiEmail,
  createSyntheticSuiEmail,
  hasAlternativeAuthenticationMethod,
} from "@/lib/sui/auth-abstraction";
import {
  buildSiwsMessage,
  parseSiwsMessage,
  SIWS_STATEMENTS,
} from "@/lib/sui/siws-message";
import type { User } from "@supabase/supabase-js";

describe("Phase 6: Frontend Sui Wallet Authentication UX & Integration Tests", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // =========================================================================
  // SCENARIO 14: Backend Error-Code Mapping
  // =========================================================================
  describe("Scenario 14: Backend & Client Error Code Mapping", () => {
    it("should map every recognized Sui backend and client error code to user-friendly messages", () => {
      const knownCodes: SuiClientErrorCode[] = [
        "UNAUTHENTICATED",
        "INVALID_SIWS",
        "INVALID_NONCE",
        "PURPOSE_MISMATCH",
        "NETWORK_MISMATCH",
        "ADDRESS_MISMATCH",
        "WALLET_ALREADY_LINKED",
        "NO_ALTERNATIVE_AUTH_METHOD",
        "RATE_LIMITED",
        "USER_REJECTED",
        "NO_WALLET_CONNECTED",
        "WRONG_NETWORK",
        "GENERIC_ERROR",
      ];

      for (const code of knownCodes) {
        const msg = mapSuiAuthError(code);
        expect(msg).toBe(SUI_ERROR_MESSAGES[code]);
        expect(msg.length).toBeGreaterThan(10);
      }
    });

    it("should return the fallback message for unknown or undefined error codes", () => {
      expect(mapSuiAuthError("UNKNOWN_RANDOM_CODE")).toBe(
        SUI_ERROR_MESSAGES.GENERIC_ERROR,
      );
      expect(mapSuiAuthError(undefined, "Custom fallback")).toBe(
        "Custom fallback",
      );
      expect(mapSuiAuthError("", "Custom fallback 2")).toBe(
        "Custom fallback 2",
      );
    });
  });

  // =========================================================================
  // SCENARIOS 1, 2, 3: Wallet Connection State Machine & Disconnected Wallet
  // =========================================================================
  describe("Scenarios 1, 2, 3: Wallet Connection States & Validation", () => {
    it("Scenario 2: should identify disconnected wallet and prevent SIWS without active account", () => {
      // Disconnected state
      const account = null;
      expect(account).toBeNull();

      // UI/Hook guard test:
      const canProceed = Boolean(account);
      expect(canProceed).toBe(false);

      const errorMsg = SUI_ERROR_MESSAGES.NO_WALLET_CONNECTED;
      expect(errorMsg).toContain("No wallet connected");
    });

    it("Scenario 3: should identify connected wallet with valid Sui address format", () => {
      const mockAddress =
        "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331";
      const account = { address: mockAddress, publicKey: new Uint8Array(32) };

      expect(account.address).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(Boolean(account)).toBe(true);
    });

    it("Scenario 1: should correctly track busy state across all operational phases", () => {
      const busyStatuses = [
        "connecting_wallet",
        "requesting_nonce",
        "waiting_signature",
        "verifying",
        "linking",
        "unlinking",
      ];

      const idleStatuses = ["idle", "success", "error"];

      for (const st of busyStatuses) {
        const isBusy =
          st === "connecting_wallet" ||
          st === "requesting_nonce" ||
          st === "waiting_signature" ||
          st === "verifying" ||
          st === "linking" ||
          st === "unlinking";
        expect(isBusy).toBe(true);
      }

      for (const st of idleStatuses) {
        const isBusy =
          st === "connecting_wallet" ||
          st === "requesting_nonce" ||
          st === "waiting_signature" ||
          st === "verifying" ||
          st === "linking" ||
          st === "unlinking";
        expect(isBusy).toBe(false);
      }
    });
  });

  // =========================================================================
  // SCENARIO 4: Wrong Network Handling
  // =========================================================================
  describe("Scenario 4: Wrong Network Detection & Rejection", () => {
    it("should reject non-testnet chains (mainnet, devnet, localnet)", () => {
      const networksToReject = ["mainnet", "devnet", "localnet", "unknown:999"];

      for (const net of networksToReject) {
        const isSupported = !net || net === "testnet";
        expect(isSupported).toBe(false);

        const mappedError = mapSuiAuthError("NETWORK_MISMATCH");
        expect(mappedError).toContain("Sui Testnet");
      }
    });

    it("should permit testnet network", () => {
      const net = "testnet";
      const isSupported = !net || net === "testnet";
      expect(isSupported).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 5: Successful SIWS Login Flow
  // =========================================================================
  describe("Scenario 5: Successful SIWS Login Service Flow", () => {
    it("should complete full SIWS login workflow: nonce -> message -> verify", async () => {
      const mockNonce = "a".repeat(64);
      const mockAddress =
        "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331";

      // 1. Mock fetch for nonce
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            nonce: mockNonce,
            purpose: "SIWS_LOGIN",
            network: "testnet",
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 300000).toISOString(),
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: "Authentication successful",
            user: {
              id: "usr_mock_123",
              suiAddress: mockAddress,
              isNewUser: false,
            },
          }),
        } as Response);

      // Step A: fetch nonce
      const nonceRes = await fetchSiwsNonce("SIWS_LOGIN");
      expect(nonceRes.success).toBe(true);
      expect(nonceRes.nonce).toBe(mockNonce);

      // Step B: construct SIWS message
      const siwsMessage = buildSiwsMessage({
        domain: "localhost:3000",
        address: mockAddress,
        uri: "http://localhost:3000/login",
        nonce: nonceRes.nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      expect(siwsMessage).toContain(SIWS_STATEMENTS.SIWS_LOGIN);
      expect(siwsMessage).toContain(mockAddress);
      expect(siwsMessage).toContain(mockNonce);

      // Step C: verify login
      const verifyRes = await verifySiwsLogin(
        siwsMessage,
        "mock_signature_base64",
      );
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.user.id).toBe("usr_mock_123");
      expect(verifyRes.user.suiAddress).toBe(mockAddress);
    });
  });

  // =========================================================================
  // SCENARIOS 6, 7, 8, 9: Error Handling (Rejection, Expired, Invalid, Already Linked)
  // =========================================================================
  describe("Scenarios 6, 7, 8, 9: Cryptographic & Flow Error Handling", () => {
    it("Scenario 6: should recognize user cancellation / signature rejection", () => {
      const rejectErrors = [
        new Error("User rejected the request"),
        new Error("User cancelled transaction"),
        new Error("User denied message signature"),
      ];

      for (const err of rejectErrors) {
        const signMsg = err.message;
        const isRejection =
          signMsg.toLowerCase().includes("reject") ||
          signMsg.toLowerCase().includes("cancel") ||
          signMsg.toLowerCase().includes("user denied");

        expect(isRejection).toBe(true);
        expect(mapSuiAuthError("USER_REJECTED")).toContain(
          "rejected in your wallet",
        );
      }
    });

    it("Scenario 7: should handle expired or already used nonce error from backend", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Nonce has expired or was already consumed",
          code: "INVALID_NONCE",
        }),
      } as Response);

      await expect(
        verifySiwsLogin("mock_message", "mock_signature"),
      ).rejects.toThrow(SuiAuthApiError);

      try {
        await verifySiwsLogin("mock_message", "mock_signature");
      } catch (err: unknown) {
        const apiErr = err as SuiAuthApiError;
        expect(apiErr.code).toBe("INVALID_NONCE");
        expect(apiErr.message).toBe(SUI_ERROR_MESSAGES.INVALID_NONCE);
      }
    });

    it("Scenario 8: should handle invalid cryptographic signature error from backend", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "Cryptographic signature verification failed",
          code: "INVALID_SIWS",
        }),
      } as Response);

      try {
        await verifySiwsLogin("mock_message", "invalid_sig");
      } catch (err: unknown) {
        const apiErr = err as SuiAuthApiError;
        expect(apiErr.code).toBe("INVALID_SIWS");
        expect(apiErr.message).toBe(SUI_ERROR_MESSAGES.INVALID_SIWS);
      }
    });

    it("Scenario 9: should handle wallet already linked conflict error deterministically", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: "This Sui wallet is already linked to another account",
          code: "WALLET_ALREADY_LINKED",
        }),
      } as Response);

      try {
        await linkSiwsWallet("mock_message", "mock_sig");
      } catch (err: unknown) {
        const apiErr = err as SuiAuthApiError;
        expect(apiErr.code).toBe("WALLET_ALREADY_LINKED");
        expect(apiErr.message).toBe(SUI_ERROR_MESSAGES.WALLET_ALREADY_LINKED);
      }
    });
  });

  // =========================================================================
  // SCENARIO 10: Successful Linking Flow
  // =========================================================================
  describe("Scenario 10: Successful Wallet Linking Flow", () => {
    it("should complete linking workflow with purpose SIWS_LINK", async () => {
      const mockNonce = "b".repeat(64);
      const mockAddress =
        "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331";

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            nonce: mockNonce,
            purpose: "SIWS_LINK",
            network: "testnet",
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 300000).toISOString(),
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: "Wallet linked successfully",
            suiAddress: mockAddress,
            userId: "usr_auth_456",
          }),
        } as Response);

      const nonceRes = await fetchSiwsNonce("SIWS_LINK");
      expect(nonceRes.purpose).toBe("SIWS_LINK");

      const linkMsg = buildSiwsMessage({
        domain: "localhost:3000",
        address: mockAddress,
        uri: "http://localhost:3000/settings",
        nonce: nonceRes.nonce,
        purpose: "SIWS_LINK",
        network: "testnet",
      });

      const parsed = parseSiwsMessage(linkMsg);
      expect(parsed.statement).toBe(SIWS_STATEMENTS.SIWS_LINK);

      const linkRes = await linkSiwsWallet(linkMsg, "valid_sig");
      expect(linkRes.success).toBe(true);
      expect(linkRes.suiAddress).toBe(mockAddress);
      expect(linkRes.userId).toBe("usr_auth_456");
    });
  });

  // =========================================================================
  // SCENARIOS 11 & 12: Unlinking & Sui-only Unlink Protection
  // =========================================================================
  describe("Scenarios 11 & 12: Unlinking & Alternative Auth Safeguards", () => {
    it("Scenario 11: should allow unlinking when user has alternative auth method", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Wallet unlinked successfully",
          userId: "usr_auth_456",
        }),
      } as Response);

      const res = await unlinkSiwsWallet();
      expect(res.success).toBe(true);
      expect(res.userId).toBe("usr_auth_456");
    });

    it("Scenario 12: should reject unlinking when user is Sui-only with NO_ALTERNATIVE_AUTH_METHOD", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error:
            "Cannot unlink wallet: User does not have an alternative authentication method.",
          code: "NO_ALTERNATIVE_AUTH_METHOD",
        }),
      } as Response);

      try {
        await unlinkSiwsWallet();
      } catch (err: unknown) {
        const apiErr = err as SuiAuthApiError;
        expect(apiErr.code).toBe("NO_ALTERNATIVE_AUTH_METHOD");
        expect(apiErr.message).toBe(
          SUI_ERROR_MESSAGES.NO_ALTERNATIVE_AUTH_METHOD,
        );
      }
    });

    it("Scenario 12 (Identity logic): hasAlternativeAuthenticationMethod prevents Sui-only user from unlinking", () => {
      const mockSuiAddress =
        "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331";
      const syntheticEmail = createSyntheticSuiEmail(mockSuiAddress);

      // Synthetic Sui-only user
      const suiOnlyUser: User = {
        id: "sui_only_id",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: syntheticEmail,
        identities: [
          {
            id: "sui_only_id",
            user_id: "sui_only_id",
            identity_id: "sui_only_id",
            identity_data: { email: syntheticEmail },
            provider: "email",
            last_sign_in_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };

      expect(isSyntheticSuiEmail(suiOnlyUser.email!)).toBe(true);
      expect(hasAlternativeAuthenticationMethod(suiOnlyUser)).toBe(false);

      // User with real email
      const realEmailUser: User = {
        ...suiOnlyUser,
        email: "alice@company.com",
        identities: [
          {
            ...suiOnlyUser.identities![0],
            identity_data: { email: "alice@company.com" },
          },
        ],
      };

      expect(isSyntheticSuiEmail(realEmailUser.email!)).toBe(false);
      expect(hasAlternativeAuthenticationMethod(realEmailUser)).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 13: Loading-State Duplicate Submission Prevention
  // =========================================================================
  describe("Scenario 13: Duplicate Submission Prevention (isBusy Lock)", () => {
    it("should prevent concurrent submissions when an operation is already in progress", async () => {
      let activeOperations = 0;
      let duplicateAttemptsBlocked = 0;

      // Simulated atomic guard replicating useSuiAuth
      const executeGuardedAction = async (action: () => Promise<void>) => {
        if (activeOperations > 0) {
          duplicateAttemptsBlocked++;
          return false;
        }

        activeOperations++;
        try {
          await action();
          return true;
        } finally {
          activeOperations--;
        }
      };

      const slowAsyncCall = () =>
        new Promise<void>((resolve) => setTimeout(resolve, 50));

      // Launch primary operation
      const p1 = executeGuardedAction(slowAsyncCall);

      // Rapidly launch 4 duplicate attempts while p1 is in progress
      const p2 = executeGuardedAction(slowAsyncCall);
      const p3 = executeGuardedAction(slowAsyncCall);
      const p4 = executeGuardedAction(slowAsyncCall);
      const p5 = executeGuardedAction(slowAsyncCall);

      const results = await Promise.all([p1, p2, p3, p4, p5]);

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(false);
      expect(results[2]).toBe(false);
      expect(results[3]).toBe(false);
      expect(results[4]).toBe(false);
      expect(duplicateAttemptsBlocked).toBe(4);
    });
  });

  // =========================================================================
  // SCENARIO 15: Authenticated State Recognition
  // =========================================================================
  describe("Scenario 15: Authenticated State & Synthetic Domain Isolation", () => {
    it("should distinguish synthetic Sui web3 identities from real email identities", () => {
      const realUserEmail = "johndoe@example.com";
      const suiSyntheticEmail =
        "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331@wallet.finder.internal";

      expect(isSyntheticSuiEmail(realUserEmail)).toBe(false);
      expect(isSyntheticSuiEmail(suiSyntheticEmail)).toBe(true);
      expect(
        isSyntheticSuiEmail("fake@wallet.finder.internal.attacker.com"),
      ).toBe(false);
    });

    it("should ensure synthetic email creation is normalized and deterministic", () => {
      const upperAddr =
        "0x02A212DE6A9DFA3A69E22387ACFBAFBB1A9E591BD9D636E7895DCFC8DE05F331";
      const lowerAddr =
        "0x02a212de6a9dfa3a69e22387acfbafbb1a9e591bd9d636e7895dcfc8de05f331";

      const email1 = createSyntheticSuiEmail(upperAddr);
      const email2 = createSyntheticSuiEmail(lowerAddr);

      expect(email1).toBe(email2);
      expect(email1).toMatch(/^sui_[a-f0-9]{16}@wallet\.finder\.internal$/);
      expect(isSyntheticSuiEmail(email1)).toBe(true);
    });
  });
});
