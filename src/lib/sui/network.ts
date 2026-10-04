/**
 * Explicit Sui Network Configuration & Policy
 * 
 * Invariant: Development and production network policies must be explicit.
 * A wallet authenticated on an unintended network (e.g. testnet in production
 * or mainnet in local dev) must be explicitly rejected.
 */

export type SuiNetwork = "mainnet" | "testnet" | "devnet" | "localnet";

export const SUPPORTED_NETWORKS: readonly SuiNetwork[] = [
  "testnet",
  "mainnet",
  "devnet",
  "localnet",
] as const;

/**
 * Resolves the authoritative configured Sui network for the current environment.
 * Reads NEXT_PUBLIC_SUI_NETWORK, then falls back to mainnet in production and
 * testnet otherwise. Unrecognized values fall back to testnet.
 */
export function getConfiguredSuiNetwork(): SuiNetwork {
  const envNet = (
    process.env.NEXT_PUBLIC_SUI_NETWORK ||
    (process.env.NODE_ENV === "production" ? "mainnet" : "testnet")
  ).toLowerCase();

  if (SUPPORTED_NETWORKS.includes(envNet as SuiNetwork)) {
    return envNet as SuiNetwork;
  }

  return "testnet";
}

/**
 * Returns the standardized chain identifier string (e.g. `sui:testnet`, `sui:mainnet`).
 */
export function formatSuiChainId(network: SuiNetwork): string {
  return `sui:${network}`;
}

/**
 * Human-readable network name for UI copy, for example "Mainnet".
 */
export function formatSuiNetworkLabel(
  network: SuiNetwork = getConfiguredSuiNetwork(),
): string {
  return network.charAt(0).toUpperCase() + network.slice(1);
}

/**
 * Validates whether a provided chain ID string matches the expected network.
 */
export function isValidSuiChainId(
  chainId: string,
  expectedNetwork: SuiNetwork = getConfiguredSuiNetwork(),
): boolean {
  return chainId.toLowerCase() === formatSuiChainId(expectedNetwork).toLowerCase();
}
