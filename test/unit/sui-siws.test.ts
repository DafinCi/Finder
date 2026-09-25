import { describe, it, expect, beforeEach, vi } from "vitest";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { nonceManager, NONCE_TTL_MS } from "@/lib/sui/nonce-manager";
import {
  buildSiwsMessage,
  parseSiwsMessage,
  SIWS_STATEMENTS,
} from "@/lib/sui/siws-message";
import {
  verifySiwsMessage,
  SiwsVerificationError,
} from "@/lib/sui/siws-verifier";
import {
  createSyntheticSuiEmail,
  isSyntheticSuiEmail,
  hasAlternativeAuthenticationMethod,
} from "@/lib/sui/auth-abstraction";
import { formatSuiChainId } from "@/lib/sui/network";

describe("Unit: Sui SIWS Cryptographic Verification Layer", () => {
  beforeEach(() => {
    nonceManager.clear();
    vi.useRealTimers();
  });

  describe("Nonce Manager & Concurrency Security", () => {
    it("should generate high-entropy 256-bit cryptographically secure nonces", () => {
      const n1 = nonceManager.generateNonce("SIWS_LOGIN", "testnet");
      const n2 = nonceManager.generateNonce("SIWS_LOGIN", "testnet");

      expect(n1.nonce).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(n2.nonce).toHaveLength(64);
      expect(n1.nonce).not.toBe(n2.nonce);
      expect(n1.purpose).toBe("SIWS_LOGIN");
      expect(n1.network).toBe("testnet");
      expect(n1.expiresAt - n1.createdAt).toBe(NONCE_TTL_MS);
    });

    it("should enforce single-use consumption and reject sequential replays", () => {
      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");

      const firstAttempt = nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet");
      expect(firstAttempt.status).toBe("SUCCESS");

      const replayAttempt = nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet");
      expect(replayAttempt.status).toBe("NONCE_ALREADY_USED");
      expect(replayAttempt.error).toContain("already been consumed");
    });

    it("should reject concurrent replay attempts atomically (Guardrail 5)", async () => {
      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");

      // Simulate 5 concurrent verification requests hitting the server at the exact same moment
      const attempts = await Promise.all([
        Promise.resolve().then(() => nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet")),
        Promise.resolve().then(() => nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet")),
        Promise.resolve().then(() => nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet")),
        Promise.resolve().then(() => nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet")),
        Promise.resolve().then(() => nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet")),
      ]);

      const successCount = attempts.filter((a) => a.status === "SUCCESS").length;
      const alreadyUsedCount = attempts.filter((a) => a.status === "NONCE_ALREADY_USED").length;

      expect(successCount).toBe(1);
      expect(alreadyUsedCount).toBe(4);
    });

    it("should reject nonce consumption when purpose does not match", () => {
      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");

      const attempt = nonceManager.consumeNonce(nonce, "SIWS_LINK", "testnet");
      expect(attempt.status).toBe("PURPOSE_MISMATCH");
    });

    it("should reject nonce consumption when network does not match", () => {
      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");

      const attempt = nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "mainnet");
      expect(attempt.status).toBe("NETWORK_MISMATCH");
    });

    it("should reject expired nonces", () => {
      vi.useFakeTimers();
      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");

      // Advance time beyond TTL (5 minutes + 1 second)
      vi.advanceTimersByTime(NONCE_TTL_MS + 1000);

      const attempt = nonceManager.consumeNonce(nonce, "SIWS_LOGIN", "testnet");
      expect(attempt.status).toBe("EXPIRED_NONCE");
    });
  });

  describe("SIWS Message Builder & Parser", () => {
    it("should build standard SIWS messages adhering to specification", () => {
      const address = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const message = buildSiwsMessage({
        domain: "localhost:3000",
        address,
        uri: "http://localhost:3000/login",
        nonce: "abcdef123456",
        purpose: "SIWS_LOGIN",
        network: "testnet",
        issuedAt: "2026-09-25T12:00:00.000Z",
      });

      expect(message).toContain("localhost:3000 wants you to sign in with your Sui account:");
      expect(message).toContain(address);
      expect(message).toContain(SIWS_STATEMENTS.SIWS_LOGIN);
      expect(message).toContain("URI: http://localhost:3000/login");
      expect(message).toContain("Version: 1");
      expect(message).toContain("Chain ID: sui:testnet");
      expect(message).toContain("Nonce: abcdef123456");
      expect(message).toContain("Issued At: 2026-09-25T12:00:00.000Z");
    });

    it("should parse valid SIWS messages correctly", () => {
      const address = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const raw = buildSiwsMessage({
        domain: "finder.app",
        address,
        uri: "https://finder.app/login",
        nonce: "test_nonce_789",
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      const parsed = parseSiwsMessage(raw);
      expect(parsed.domain).toBe("finder.app");
      expect(parsed.address).toBe(normalizeSuiAddress(address));
      expect(parsed.nonce).toBe("test_nonce_789");
      expect(parsed.chainId).toBe("sui:testnet");
      expect(parsed.version).toBe("1");
    });

    it("should reject malformed or incomplete SIWS messages", () => {
      expect(() => parseSiwsMessage("Invalid random string")).toThrow("format is incomplete or malformed");
      expect(() =>
        parseSiwsMessage(
          "invalid domain wants you to sign in with your Sui account:\n0x123\n\nStatement\nURI: http://localhost\nVersion: 1\nChain ID: sui:testnet\nNonce: 123\nIssued At: now",
        ),
      ).toThrow("contains an invalid Sui address");
    });

    it("should reject unsupported version or future timestamp", () => {
      const validAddress = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const futureMsg = buildSiwsMessage({
        domain: "localhost:3000",
        address: validAddress,
        uri: "http://localhost:3000",
        nonce: "12345",
        purpose: "SIWS_LOGIN",
        issuedAt: futureDate,
      });

      expect(() => parseSiwsMessage(futureMsg)).toThrow("in the future");
    });
  });

  describe("End-to-End Cryptographic SIWS Verification", () => {
    it("should verify valid Ed25519 signature and return verified Sui address", async () => {
      const keypair = new Ed25519Keypair();
      const address = keypair.toSuiAddress();

      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");
      const messageText = buildSiwsMessage({
        domain: "localhost:3000",
        address,
        uri: "http://localhost:3000/login",
        nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      const messageBytes = new TextEncoder().encode(messageText);
      const { signature } = await keypair.signPersonalMessage(messageBytes);

      const result = await verifySiwsMessage({
        message: messageText,
        signature,
        expectedPurpose: "SIWS_LOGIN",
        expectedDomain: "localhost:3000",
        expectedNetwork: "testnet",
      });

      expect(result.success).toBe(true);
      expect(result.suiAddress).toBe(normalizeSuiAddress(address));
      expect(result.message.nonce).toBe(nonce);
    });

    it("should reject tampered message bytes with INVALID_SIGNATURE", async () => {
      const keypair = new Ed25519Keypair();
      const address = keypair.toSuiAddress();

      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");
      const messageText = buildSiwsMessage({
        domain: "localhost:3000",
        address,
        uri: "http://localhost:3000/login",
        nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      const messageBytes = new TextEncoder().encode(messageText);
      const { signature } = await keypair.signPersonalMessage(messageBytes);

      // Attacker tampers with the message content (e.g. changing domain or nonce)
      const tamperedMessageText = messageText.replace("localhost:3000", "attacker.com");

      await expect(
        verifySiwsMessage({
          message: tamperedMessageText,
          signature,
          expectedPurpose: "SIWS_LOGIN",
          expectedDomain: "attacker.com",
          expectedNetwork: "testnet",
        }),
      ).rejects.toThrowError(SiwsVerificationError);
    });

    it("should reject address mismatch when signature does not match claimed address (Guardrail 6)", async () => {
      const actualSigner = new Ed25519Keypair();
      const victimSigner = new Ed25519Keypair();

      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");
      // Message claims to be victimSigner, but signed by actualSigner
      const messageText = buildSiwsMessage({
        domain: "localhost:3000",
        address: victimSigner.toSuiAddress(),
        uri: "http://localhost:3000/login",
        nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      const messageBytes = new TextEncoder().encode(messageText);
      const { signature } = await actualSigner.signPersonalMessage(messageBytes);

      await expect(
        verifySiwsMessage({
          message: messageText,
          signature,
          expectedPurpose: "SIWS_LOGIN",
          expectedDomain: "localhost:3000",
          expectedNetwork: "testnet",
        }),
      ).rejects.toThrow("Verified signer address");
    });

    it("should reject verification when domain does not match", async () => {
      const keypair = new Ed25519Keypair();
      const address = keypair.toSuiAddress();

      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");
      const messageText = buildSiwsMessage({
        domain: "phishing-site.com",
        address,
        uri: "https://phishing-site.com/login",
        nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      const messageBytes = new TextEncoder().encode(messageText);
      const { signature } = await keypair.signPersonalMessage(messageBytes);

      await expect(
        verifySiwsMessage({
          message: messageText,
          signature,
          expectedPurpose: "SIWS_LOGIN",
          expectedDomain: "localhost:3000",
          expectedNetwork: "testnet",
        }),
      ).rejects.toThrow("SIWS domain mismatch");
    });

    it("should reject verification when network does not match (Guardrail 9)", async () => {
      const keypair = new Ed25519Keypair();
      const address = keypair.toSuiAddress();

      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "mainnet");
      const messageText = buildSiwsMessage({
        domain: "localhost:3000",
        address,
        uri: "http://localhost:3000/login",
        nonce,
        purpose: "SIWS_LOGIN",
        network: "mainnet",
      });

      const messageBytes = new TextEncoder().encode(messageText);
      const { signature } = await keypair.signPersonalMessage(messageBytes);

      // Server is configured for testnet
      await expect(
        verifySiwsMessage({
          message: messageText,
          signature,
          expectedPurpose: "SIWS_LOGIN",
          expectedDomain: "localhost:3000",
          expectedNetwork: "testnet",
        }),
      ).rejects.toThrow("SIWS network mismatch");
    });

    it("should reject signature replay when nonce was already consumed", async () => {
      const keypair = new Ed25519Keypair();
      const address = keypair.toSuiAddress();

      const { nonce } = nonceManager.generateNonce("SIWS_LOGIN", "testnet");
      const messageText = buildSiwsMessage({
        domain: "localhost:3000",
        address,
        uri: "http://localhost:3000/login",
        nonce,
        purpose: "SIWS_LOGIN",
        network: "testnet",
      });

      const messageBytes = new TextEncoder().encode(messageText);
      const { signature } = await keypair.signPersonalMessage(messageBytes);

      // First call succeeds
      const first = await verifySiwsMessage({
        message: messageText,
        signature,
        expectedPurpose: "SIWS_LOGIN",
        expectedDomain: "localhost:3000",
        expectedNetwork: "testnet",
      });
      expect(first.success).toBe(true);

      // Second call with same message & signature must fail
      await expect(
        verifySiwsMessage({
          message: messageText,
          signature,
          expectedPurpose: "SIWS_LOGIN",
          expectedDomain: "localhost:3000",
          expectedNetwork: "testnet",
        }),
      ).rejects.toThrow("consumed");
    });
  });

  describe("Synthetic Email & Disconnect Abstraction (Guardrail 4 & 8)", () => {
    it("should generate deterministic unroutable synthetic emails", () => {
      const addr = "0x0000000000000000000000000000000000000000000000000000000000000002";
      const email = createSyntheticSuiEmail(addr);

      expect(email).toMatch(/^sui_[0-9a-f]{16}@wallet\.finder\.internal$/);
      expect(isSyntheticSuiEmail(email)).toBe(true);
      expect(isSyntheticSuiEmail("realuser@gmail.com")).toBe(false);
      expect(isSyntheticSuiEmail(null)).toBe(false);
    });

    it("should permit disconnect only when alternative authentication method exists (Guardrail 8)", () => {
      // 1. User with real email & password -> Can disconnect Sui wallet
      const emailUser = {
        id: "usr_1",
        email: "candidate@gmail.com",
      };
      expect(hasAlternativeAuthenticationMethod(emailUser)).toBe(true);

      // 2. User with synthetic Sui email only -> CANNOT disconnect Sui wallet
      const suiOnlyUser = {
        id: "usr_2",
        email: "sui_0000000000000002@wallet.finder.internal",
      };
      expect(hasAlternativeAuthenticationMethod(suiOnlyUser)).toBe(false);

      // 3. User with synthetic Sui email but also linked Google/OAuth identity -> Can disconnect
      const multiAuthUser = {
        id: "usr_3",
        email: "sui_0000000000000002@wallet.finder.internal",
        identities: [
          { provider: "sui" },
          { provider: "google" },
        ],
      };
      expect(hasAlternativeAuthenticationMethod(multiAuthUser)).toBe(true);
    });
  });
});
