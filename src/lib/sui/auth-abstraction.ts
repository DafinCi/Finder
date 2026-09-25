import { normalizeSuiAddress } from "@mysten/sui/utils";

/**
 * Domain reserved strictly for internal synthetic Supabase auth accounts.
 * This domain is non-routable (.internal) and must be blocked from direct
 * password login, password reset, and user-facing contact displays.
 */
export const SYNTHETIC_SUI_DOMAIN = "wallet.finder.internal";

/**
 * Generates an internal deterministic synthetic email address for a Sui wallet.
 * Example: `sui_0x123456789abc@wallet.finder.internal`
 */
export function createSyntheticSuiEmail(suiAddress: string): string {
  const normalized = normalizeSuiAddress(suiAddress);
  // Use first 16 characters after 0x for clean identifier
  const prefix = normalized.replace("0x", "").slice(0, 16);
  return `sui_${prefix}@${SYNTHETIC_SUI_DOMAIN}`;
}

/**
 * Checks whether a given email belongs to the synthetic internal Sui domain.
 */
export function isSyntheticSuiEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().endsWith(`@${SYNTHETIC_SUI_DOMAIN}`);
}

/**
 * User Identity Interface for Authentication Method Evaluation
 */
export interface UserAuthContext {
  id: string;
  email?: string | null;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: Record<string, unknown>;
  identities?: Array<{
    provider: string;
    identity_data?: Record<string, unknown>;
  }>;
}

/**
 * Abstract check: Does the user have an alternative authentication method
 * besides their currently linked Sui wallet?
 * 
 * Invariant (Guardrail 8):
 * Do not hardcode future architecture around "has email".
 * An alternative authentication method can be:
 * - A verified, real (non-synthetic) email & password
 * - Future zkLogin / Google OAuth provider
 * - Future Passkey / WebAuthn factor
 * - Future alternative linked wallet
 * 
 * If a user only has their Sui wallet as their login mechanism, disconnecting
 * it would orphan their account and lock them out permanently.
 */
export function hasAlternativeAuthenticationMethod(
  user: UserAuthContext | null | undefined,
): boolean {
  if (!user) return false;

  // 1. Check if user has a verified real email (not our synthetic domain)
  if (user.email && !isSyntheticSuiEmail(user.email)) {
    return true;
  }

  // 2. Check if user has multiple OAuth/Identity providers linked in Supabase
  if (Array.isArray(user.identities) && user.identities.length > 0) {
    const nonSuiIdentities = user.identities.filter(
      (id) => id.provider !== "sui" && id.provider !== "custom_sui",
    );
    if (nonSuiIdentities.length > 0) {
      return true;
    }
  }

  // 3. Check app_metadata.providers array
  if (Array.isArray(user.app_metadata?.providers)) {
    const otherProviders = user.app_metadata.providers.filter(
      (p) => p !== "sui" && p !== "custom_sui",
    );
    if (otherProviders.length > 0) {
      return true;
    }
  }

  return false;
}
