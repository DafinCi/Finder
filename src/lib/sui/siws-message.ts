import { normalizeSuiAddress, isValidSuiAddress } from "@mysten/sui/utils";
import { SiwsPurpose } from "./nonce-manager";
import { SuiNetwork, formatSuiChainId } from "./network";

export interface SiwsMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  network?: SuiNetwork;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
  purpose: SiwsPurpose;
}

export interface ParsedSiwsMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

export const SIWS_STATEMENTS: Record<SiwsPurpose, string> = {
  SIWS_LOGIN:
    "Sign in to Finder Career Portal. This request will not trigger any blockchain transaction or cost any gas fees.",
  SIWS_LINK:
    "Link this Sui wallet to your Finder Career Account. This request will not trigger any blockchain transaction or cost any gas fees.",
};

/**
 * Builds a standardized SIWS (Sign-In with Sui) personal message string.
 */
export function buildSiwsMessage(params: SiwsMessageParams): string {
  const {
    domain,
    address,
    statement = SIWS_STATEMENTS[params.purpose],
    uri,
    version = "1",
    network = "testnet",
    nonce,
    issuedAt = new Date().toISOString(),
    expirationTime,
  } = params;

  const normalizedAddress = normalizeSuiAddress(address);
  const chainId = formatSuiChainId(network);

  const lines = [
    `${domain} wants you to sign in with your Sui account:`,
    normalizedAddress,
    "",
    statement,
    "",
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ];

  if (expirationTime) {
    lines.push(`Expiration Time: ${expirationTime}`);
  }

  return lines.join("\n");
}

/**
 * Parses and strictly validates a formatted SIWS personal message string.
 * Throws a descriptive error if the message is malformed, has missing fields,
 * or contains invalid field values.
 */
export function parseSiwsMessage(messageText: string): ParsedSiwsMessage {
  if (!messageText || typeof messageText !== "string") {
    throw new Error("SIWS message text must be a non-empty string.");
  }

  const lines = messageText.split("\n");
  if (lines.length < 8) {
    throw new Error("SIWS message format is incomplete or malformed.");
  }

  // Line 0: "${domain} wants you to sign in with your Sui account:"
  const headerMatch = lines[0].match(/^(.+?)\s+wants you to sign in with your Sui account:$/);
  if (!headerMatch) {
    throw new Error("SIWS message header is malformed.");
  }
  const domain = headerMatch[1].trim();
  if (!domain) {
    throw new Error("SIWS message is missing a valid domain.");
  }

  // Line 1: Sui Address
  const rawAddress = lines[1].trim();
  if (!isValidSuiAddress(rawAddress)) {
    throw new Error(`SIWS message contains an invalid Sui address: ${rawAddress}`);
  }
  const address = normalizeSuiAddress(rawAddress);

  // Line 2: Empty line separator
  // Find key-value attributes starting from "URI:"
  let uriIndex = -1;
  for (let i = 2; i < lines.length; i++) {
    if (lines[i].startsWith("URI: ")) {
      uriIndex = i;
      break;
    }
  }

  if (uriIndex === -1) {
    throw new Error("SIWS message is missing required 'URI' field.");
  }

  // The lines between line 2 and uriIndex form the statement
  const statementLines = lines.slice(2, uriIndex).filter((l) => l.trim().length > 0);
  const statement = statementLines.join("\n").trim();

  // Extract key-value fields
  const fields = new Map<string, string>();
  for (let i = uriIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    fields.set(key, value);
  }

  const uri = fields.get("URI");
  const version = fields.get("Version");
  const chainId = fields.get("Chain ID");
  const nonce = fields.get("Nonce");
  const issuedAt = fields.get("Issued At");
  const expirationTime = fields.get("Expiration Time");

  if (!uri) throw new Error("SIWS message missing 'URI' attribute.");
  if (!version) throw new Error("SIWS message missing 'Version' attribute.");
  if (version !== "1") throw new Error(`Unsupported SIWS version: ${version}. Expected '1'.`);
  if (!chainId) throw new Error("SIWS message missing 'Chain ID' attribute.");
  if (!nonce) throw new Error("SIWS message missing 'Nonce' attribute.");
  if (!issuedAt) throw new Error("SIWS message missing 'Issued At' attribute.");

  // Validate timestamps
  const issuedAtDate = new Date(issuedAt);
  if (isNaN(issuedAtDate.getTime())) {
    throw new Error("SIWS 'Issued At' timestamp is not a valid ISO-8601 date.");
  }

  // Reject issuedAt too far in future (> 60s clock skew)
  const now = Date.now();
  if (issuedAtDate.getTime() > now + 60 * 1000) {
    throw new Error("SIWS 'Issued At' timestamp is in the future.");
  }

  if (expirationTime) {
    const expDate = new Date(expirationTime);
    if (isNaN(expDate.getTime())) {
      throw new Error("SIWS 'Expiration Time' timestamp is not a valid ISO-8601 date.");
    }
  }

  return {
    domain,
    address,
    statement,
    uri,
    version,
    chainId,
    nonce,
    issuedAt,
    expirationTime,
  };
}
