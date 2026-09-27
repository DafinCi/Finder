import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { getConfiguredSuiNetwork } from "./network";

const GRPC_URLS: Record<string, string> = {
  testnet: "https://fullnode.testnet.sui.io:443",
  mainnet: "https://fullnode.mainnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443",
};

const currentNetwork = getConfiguredSuiNetwork();

export const dAppKit = createDAppKit({
  networks: ["testnet", "mainnet", "devnet"],
  defaultNetwork: currentNetwork === "localnet" ? "testnet" : currentNetwork,
  createClient: (network) =>
    new SuiGrpcClient({
      network,
      baseUrl: GRPC_URLS[network] || GRPC_URLS.testnet,
    }),
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
