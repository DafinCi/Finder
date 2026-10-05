export interface WalrusNetworkConfig {
  network: "mainnet" | "testnet";
  publisherUrl: string;
  aggregatorUrl: string;
  explorerUrl: string;
  relayerUrl: string;
  defaultEpochs: number;
  maxFileSizeBytes: number;
  requestTimeoutMs: number;
}

export const WALRUS_MAINNET_CONFIG: WalrusNetworkConfig = {
  network: "mainnet",
  // There is no public unauthenticated Mainnet publisher. Mainnet writes
  // therefore require an explicit publisher or relay URL from the operator.
  publisherUrl: process.env.WALRUS_PUBLISHER_URL || "",
  aggregatorUrl:
    process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ||
    "https://aggregator.walrus-mainnet.walrus.space",
  explorerUrl: "https://walruscan.com/mainnet/blob",
  relayerUrl:
    process.env.MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz",
  defaultEpochs: 50,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB limit
  requestTimeoutMs: 60000,
};

export const WALRUS_TESTNET_CONFIG: WalrusNetworkConfig = {
  network: "testnet",
  publisherUrl:
    process.env.WALRUS_PUBLISHER_URL ||
    "https://publisher.walrus-testnet.walrus.space",
  aggregatorUrl:
    process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ||
    "https://aggregator.walrus-testnet.walrus.space",
  explorerUrl: "https://walruscan.com/testnet/blob",
  relayerUrl:
    process.env.MEMWAL_SERVER_URL ||
    "https://relayer-staging.memory.walrus.xyz",
  defaultEpochs: 50,
  maxFileSizeBytes: 10 * 1024 * 1024,
  requestTimeoutMs: 60000,
};

const targetNetwork = (process.env.NEXT_PUBLIC_WALRUS_NETWORK || "mainnet").toLowerCase();

export const WALRUS_CONFIG: WalrusNetworkConfig =
  targetNetwork === "testnet" ? WALRUS_TESTNET_CONFIG : WALRUS_MAINNET_CONFIG;

/**
 * True only when a publisher URL is configured for the active network.
 * Mainnet has no default because no public publisher exists.
 */
export function isWalrusWriteConfigured(): boolean {
  return Boolean(WALRUS_CONFIG.publisherUrl);
}
