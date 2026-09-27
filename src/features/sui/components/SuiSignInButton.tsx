"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Loader2,
  Wallet,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useDAppKit, useCurrentWallet } from "@mysten/dapp-kit-react";
import { useSuiAuth } from "../hooks/useSuiAuth";
import { SuiWalletModal } from "./SuiWalletModal";
import { Button } from "@/components/ui/button";

export function SuiSignInButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const dAppKit = useDAppKit();
  const currentWallet = useCurrentWallet();
  const {
    account,
    currentNetwork,
    status,
    error,
    isBusy,
    signInWithSui,
    resetError,
  } = useSuiAuth();

  const isTestnet = !currentNetwork || currentNetwork === "testnet";

  const getStatusLabel = () => {
    switch (status) {
      case "requesting_nonce":
        return "Requesting challenge...";
      case "waiting_signature":
        return "Approve in wallet...";
      case "verifying":
        return "Verifying signature...";
      default:
        return "Sign in with Sui";
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  async function handleAction() {
    resetError();
    if (!account) {
      setModalOpen(true);
      return;
    }
    await signInWithSui();
  }

  return (
    <div className="space-y-3 w-full">
      {/* Wallet Connection Modal */}
      <SuiWalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onWalletConnected={() => {
          // Keep modal closed and let user trigger sign in
        }}
      />

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs font-medium flex items-start justify-between gap-2 animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={resetError}
            className="text-destructive/80 hover:text-destructive text-[11px] underline shrink-0 font-sans"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connected Account Preview (If connected) */}
      {account && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border/80 text-xs">
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Wallet className="w-3 h-3" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-mono text-[11px] text-foreground font-medium truncate">
                {truncateAddress(account.address)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {currentWallet?.name || "Connected"} •{" "}
                <span
                  className={
                    isTestnet
                      ? "text-emerald-400"
                      : "text-amber-400 font-semibold"
                  }
                >
                  {currentNetwork || "testnet"}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => dAppKit.disconnectWallet()}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors px-1.5 py-0.5 disabled:opacity-50"
          >
            Change
          </button>
        </div>
      )}

      {/* Wrong Network Warning */}
      {account && !isTestnet && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Please switch your wallet to Sui Testnet to authenticate.</span>
        </div>
      )}

      {/* Main SIWS Action Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAction}
        disabled={isBusy || (Boolean(account) && !isTestnet)}
        aria-busy={isBusy}
        className={`w-full h-10 text-xs font-semibold border-border hover:bg-secondary/70 transition-all ${
          account
            ? "bg-primary/5 hover:bg-primary/10 border-primary/30 text-foreground"
            : "bg-secondary/40 text-foreground"
        }`}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-primary" />
            <span>{getStatusLabel()}</span>
          </>
        ) : account ? (
          <>
            <Wallet className="w-3.5 h-3.5 mr-2 text-primary" />
            <span>Sign in with connected wallet</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          </>
        ) : (
          <>
            <Wallet className="w-3.5 h-3.5 mr-2 text-primary" />
            <span>Sign in with Sui wallet</span>
          </>
        )}
      </Button>
    </div>
  );
}
