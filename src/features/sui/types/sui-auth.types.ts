export type SuiBackendErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_SIWS"
  | "INVALID_NONCE"
  | "PURPOSE_MISMATCH"
  | "NETWORK_MISMATCH"
  | "ADDRESS_MISMATCH"
  | "WALLET_ALREADY_LINKED"
  | "NO_ALTERNATIVE_AUTH_METHOD"
  | "RATE_LIMITED";

export type SuiClientErrorCode =
  | SuiBackendErrorCode
  | "USER_REJECTED"
  | "NO_WALLET_CONNECTED"
  | "WRONG_NETWORK"
  | "GENERIC_ERROR";

export type SuiAuthStatus =
  | "idle"
  | "connecting_wallet"
  | "requesting_nonce"
  | "waiting_signature"
  | "verifying"
  | "linking"
  | "unlinking"
  | "success"
  | "error";

export const SUI_ERROR_MESSAGES: Record<SuiClientErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  INVALID_SIWS: "The wallet signature or authentication challenge was invalid.",
  INVALID_NONCE:
    "Authentication request timed out or was already used. Please try again.",
  PURPOSE_MISMATCH: "Security challenge purpose mismatch. Please try again.",
  NETWORK_MISMATCH:
    "Network mismatch. Please switch your wallet network to Sui Testnet.",
  ADDRESS_MISMATCH:
    "Wallet address mismatch. The signature does not match your active account.",
  WALLET_ALREADY_LINKED:
    "This Sui wallet is already linked to an existing account.",
  NO_ALTERNATIVE_AUTH_METHOD:
    "Can't unlink your wallet — it's your only way to sign in. Add an email and password first.",
  RATE_LIMITED: "Too many requests. Please wait a moment before trying again.",
  USER_REJECTED: "Signature request was rejected in your wallet.",
  NO_WALLET_CONNECTED:
    "No wallet connected. Please connect a Sui wallet to continue.",
  WRONG_NETWORK:
    "Please switch your wallet to Sui Testnet.",
  GENERIC_ERROR: "An unexpected error occurred during wallet authentication.",
};

export function mapSuiAuthError(
  code?: string,
  fallbackMessage: string = SUI_ERROR_MESSAGES.GENERIC_ERROR,
): string {
  if (!code) return fallbackMessage;
  if (code in SUI_ERROR_MESSAGES) {
    return SUI_ERROR_MESSAGES[code as SuiClientErrorCode];
  }
  return fallbackMessage;
}
