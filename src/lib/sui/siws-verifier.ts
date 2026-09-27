import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { SuiNetwork, getConfiguredSuiNetwork, formatSuiChainId } from "./network";
import { SiwsPurpose, nonceManager } from "./nonce-manager";
import {
  parseSiwsMessage,
  ParsedSiwsMessage,
  SIWS_STATEMENTS,
} from "./siws-message";

export interface VerifySiwsParams {
  /** Raw message bytes or string that was signed by the wallet */
  message: Uint8Array | string;
  /** Serialized cryptographic signature returned by wallet signPersonalMessage */
  signature: string;
  /** Required purpose of the authentication operation */
  expectedPurpose: SiwsPurpose;
  /** Expected application domain (defaults to current host / NEXT_PUBLIC_SITE_URL domain) */
  expectedDomain?: string;
  /** Expected Sui network */
  expectedNetwork?: SuiNetwork;
}

export interface VerifySiwsResult {
  success: true;
  /** The cryptographically verified Sui address recovered from the signature */
  suiAddress: string;
  /** Fully parsed and validated SIWS message */
  message: ParsedSiwsMessage;
}

export type SiwsErrorCode =
  | "INVALID_INPUT"
  | "INVALID_SIWS_MESSAGE"
  | "DOMAIN_MISMATCH"
  | "NETWORK_MISMATCH"
  | "PURPOSE_MISMATCH"
  | "EXPIRED_MESSAGE"
  | "INVALID_NONCE"
  | "EXPIRED_NONCE"
  | "NONCE_ALREADY_USED"
  | "INVALID_SIGNATURE"
  | "ADDRESS_MISMATCH";

export class SiwsVerificationError extends Error {
  constructor(
    public readonly code: SiwsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SiwsVerificationError";
  }
}

/**
 * Resolves the expected domain from environment or fallback.
 */
function resolveExpectedDomain(explicitDomain?: string): string {
  if (explicitDomain) return explicitDomain.toLowerCase();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      return url.host.toLowerCase();
    } catch {
      // Fall through to default
    }
  }

  return "localhost:3000";
}

/**
 * Verifies a Sign-In with Sui (SIWS) personal message signature.
 * 
 * Invariants Enforced:
 * 1. Cryptographic Ed25519 signature validity against the message bytes.
 * 2. Message structure, syntax, and presence of all required fields.
 * 3. Domain match (mitigates phishing/cross-origin re-use).
 * 4. Chain ID / Network match (mitigates cross-network replay).
 * 5. Purpose binding (prevents using a login nonce for wallet-linking or vice versa).
 * 6. Nonce single-use, freshness, and server-side origin.
 * 7. Address match: The recovered address from the signature MUST match the address
 *    claimed in the message text.
 * 8. Never trust an address submitted out-of-band; only the cryptographically
 *    verified address is returned.
 */
export async function verifySiwsMessage(
  params: VerifySiwsParams,
): Promise<VerifySiwsResult> {
  const {
    message,
    signature,
    expectedPurpose,
    expectedDomain = resolveExpectedDomain(params.expectedDomain),
    expectedNetwork = getConfiguredSuiNetwork(),
  } = params;

  if (!message || !signature) {
    throw new SiwsVerificationError(
      "INVALID_INPUT",
      "Message and signature are both required for SIWS verification.",
    );
  }

  // 1. Convert input message to bytes and text
  let bytes: Uint8Array;
  let text: string;

  if (typeof message === "string") {
    text = message;
    bytes = new TextEncoder().encode(message);
  } else if (message instanceof Uint8Array) {
    bytes = message;
    text = new TextDecoder().decode(message);
  } else {
    throw new SiwsVerificationError(
      "INVALID_INPUT",
      "Unsupported message format. Expected string or Uint8Array.",
    );
  }

  // 2. Parse and validate message format
  let parsed: ParsedSiwsMessage;
  try {
    parsed = parseSiwsMessage(text);
  } catch (err: unknown) {
    const errorObj = err as Error;
    throw new SiwsVerificationError(
      "INVALID_SIWS_MESSAGE",
      `Malformed SIWS message: ${errorObj.message}`,
    );
  }

  // 3. Domain validation
  if (parsed.domain.toLowerCase() !== expectedDomain.toLowerCase()) {
    throw new SiwsVerificationError(
      "DOMAIN_MISMATCH",
      `SIWS domain mismatch. Expected: ${expectedDomain}, got: ${parsed.domain}`,
    );
  }

  // 4. Network / Chain ID validation
  const expectedChainId = formatSuiChainId(expectedNetwork);
  if (parsed.chainId.toLowerCase() !== expectedChainId.toLowerCase()) {
    throw new SiwsVerificationError(
      "NETWORK_MISMATCH",
      `SIWS network mismatch. Expected: ${expectedChainId}, got: ${parsed.chainId}`,
    );
  }

  // 5. Statement / Purpose validation
  const expectedStatement = SIWS_STATEMENTS[expectedPurpose];
  if (parsed.statement !== expectedStatement) {
    throw new SiwsVerificationError(
      "PURPOSE_MISMATCH",
      `SIWS statement does not match expected purpose (${expectedPurpose}).`,
    );
  }

  // 6. Expiration check
  if (parsed.expirationTime) {
    const expTime = new Date(parsed.expirationTime).getTime();
    if (Date.now() > expTime) {
      throw new SiwsVerificationError(
        "EXPIRED_MESSAGE",
        "SIWS message has expired.",
      );
    }
  }

  // 7. Atomic Nonce Consumption (enforces single-use & freshness)
  const nonceResult = nonceManager.consumeNonce(
    parsed.nonce,
    expectedPurpose,
    expectedNetwork,
  );

  if (nonceResult.status !== "SUCCESS") {
    throw new SiwsVerificationError(
      nonceResult.status as SiwsErrorCode,
      nonceResult.error || "Nonce verification failed.",
    );
  }

  // 8. Cryptographic Signature Verification
  let recoveredAddress: string;
  try {
    const recoveredPublicKey = await verifyPersonalMessageSignature(bytes, signature);
    recoveredAddress = normalizeSuiAddress(recoveredPublicKey.toSuiAddress());
  } catch (err: unknown) {
    const errorObj = err as Error;
    throw new SiwsVerificationError(
      "INVALID_SIGNATURE",
      `Cryptographic signature verification failed: ${errorObj.message}`,
    );
  }

  // 9. Wallet Address Consistency (Guardrail 6)
  const declaredAddress = normalizeSuiAddress(parsed.address);
  if (recoveredAddress !== declaredAddress) {
    throw new SiwsVerificationError(
      "ADDRESS_MISMATCH",
      `Verified signer address (${recoveredAddress}) does not match address in SIWS message (${declaredAddress}).`,
    );
  }

  return {
    success: true,
    suiAddress: recoveredAddress,
    message: parsed,
  };
}
