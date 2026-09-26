"use client";

import React from "react";
import {
  useWallets,
  useDAppKit,
  useCurrentWallet,
} from "@mysten/dapp-kit-react";
import {
  X,
  Wallet,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface SuiWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnected?: () => void;
}

export function SuiWalletModal({
  isOpen,
  onClose,
  onWalletConnected,
}: SuiWalletModalProps) {
  const wallets = useWallets();
  const dAppKit = useDAppKit();
  const currentWallet = useCurrentWallet();

  if (!isOpen) return null;

  async function handleSelectWallet(wallet: (typeof wallets)[0]) {
    try {
      await dAppKit.connectWallet({ wallet });
      onWalletConnected?.();
      onClose();
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-xl space-y-4 text-foreground relative animate-in zoom-in-95 duration-150"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="wallet-modal-title"
                className="text-sm font-semibold font-heading text-foreground"
              >
                Connect Sui Wallet
              </h2>
              <p className="text-[11px] text-muted-foreground font-sans">
                Select your wallet to continue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallets List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar py-1">
          {wallets.length === 0 ? (
            <div className="py-6 px-4 text-center space-y-2 rounded-lg bg-secondary/30 border border-border/50">
              <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto" />
              <p className="text-xs font-medium text-foreground">
                No Sui wallets detected
              </p>
              <p className="text-[11px] text-muted-foreground">
                Please install a Sui-compatible wallet extension (such as Sui
                Wallet or Nightly) in your browser.
              </p>
            </div>
          ) : (
            wallets.map((wallet) => {
              const isConnected = currentWallet?.name === wallet.name;
              return (
                <button
                  key={wallet.name}
                  type="button"
                  onClick={() => handleSelectWallet(wallet)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                    isConnected
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "bg-secondary/40 border-border/80 hover:bg-secondary/80 hover:border-primary/30 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {wallet.icon ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={wallet.icon}
                        alt={`${wallet.name} icon`}
                        className="w-6 h-6 rounded-md object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {wallet.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold">{wallet.name}</span>
                  </div>

                  {isConnected ? (
                    <div className="flex items-center gap-1 text-primary text-[11px] font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Notice */}
        <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/50">
          You&apos;ll sign a message with your wallet to verify ownership. No
          transaction fees.
        </p>
      </div>
    </div>
  );
}
