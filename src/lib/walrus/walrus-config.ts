export const WALRUS_CONFIG = {
  network: process.env.NEXT_PUBLIC_WALRUS_NETWORK || "testnet",
  publisherUrl:
    process.env.WALRUS_PUBLISHER_URL ||
    "https://publisher.walrus-testnet.walrus.space",
  aggregatorUrl:
    process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ||
    "https://aggregator.walrus-testnet.walrus.space",
  explorerUrl: "https://walruscan.com/testnet/blob",
  // In testnet, 1 epoch = 1 day. Default to 50 epochs (~50 days) to prevent 5-day expiration.
  defaultEpochs: 50,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB Walrus publisher hard limit
  requestTimeoutMs: 60000, // 60 seconds (erasure coding + sliver distribution)
};
