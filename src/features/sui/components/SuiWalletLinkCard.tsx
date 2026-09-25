"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { useSuiAuth } from "../hooks/useSuiAuth";
import { SuiWalletModal } from "./SuiWalletModal";
import { Button } from "@/components/ui/button";

export function SuiWalletLinkCard() {
  const { user } = useAuth();
  const {
    account,
    currentNetwork,
    status,
    error,
    isBusy,
    linkWallet,
    unlinkWallet,
    resetError,
  } = useSuiAuth();

  const [linkedAddress, setLinkedAddress] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  const refreshProfileWallet = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: profileErr } = await supabase
        .from("profiles")
        .select("sui_address")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileErr && data) {
        setLinkedAddress(data.sui_address || null);
      }
    } catch (err) {
      console.error("Error fetching linked wallet:", err);
    }
  }, [user]);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      try {
        const { data, error: profileErr } = await supabase
          .from("profiles")
          .select("sui_address")
          .eq("id", user.id)
          .maybeSingle();

        if (!isCancelled && !profileErr && data) {
          setLinkedAddress(data.sui_address || null);
        }
      } catch (err) {
        console.error("Error fetching linked wallet:", err);
      } finally {
        if (!isCancelled) {
          setLoadingProfile(false);
        }
      }
    }

    void load();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleLink() {
    resetError();
    if (!account) {
      setModalOpen(true);
      return;
    }
    const success = await linkWallet();
    if (success) {
      await refreshProfileWallet();
    }
  }

  async function handleUnlink() {
    resetError();
    setUnlinkConfirmOpen(false);
    const success = await unlinkWallet();
    if (success) {
      await refreshProfileWallet();
    }
  }

  const isTestnet = !currentNetwork || currentNetwork === "testnet";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 text-foreground">
      {/* Wallet Selection Modal */}
      <SuiWalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onWalletConnected={() => {
          // Modal closed, wallet connected
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-heading text-foreground">
              Sui Wallet
            </h3>
            <p className="text-xs text-muted-foreground font-sans">
              Cryptographic identity linking on Sui Testnet
            </p>
          </div>
        </div>

        {linkedAddress ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Linked
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
            Not connected
          </span>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-xs font-medium flex items-start justify-between gap-2"
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

      {/* Loading state for profile */}
      {loadingProfile ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Checking wallet association...</span>
        </div>
      ) : linkedAddress ? (
        /* State A: Wallet IS Linked */
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary/40 border border-border/80 flex items-center justify-between text-xs">
            <div className="flex flex-col gap-0.5 truncate mr-2">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                Linked Sui Address
              </span>
              <span className="font-mono text-xs text-foreground font-medium truncate">
                {truncateAddress(linkedAddress)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(linkedAddress)}
              title="Copy address"
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Unlink Action */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground">
              You can sign in using this wallet anytime.
            </p>

            {unlinkConfirmOpen ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUnlinkConfirmOpen(false)}
                  disabled={isBusy}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleUnlink}
                  disabled={isBusy}
                  className="h-8 text-xs font-semibold"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      <span>Unlinking...</span>
                    </>
                  ) : (
                    <span>Confirm Unlink</span>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUnlinkConfirmOpen(true)}
                disabled={isBusy}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Unlink className="w-3.5 h-3.5 mr-1.5" />
                <span>Unlink Wallet</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* State B: No Wallet Linked */
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Link your Sui wallet to enable Sign-In with Sui (SIWS) for this
            account. You can log in using either your email credentials or your
            linked Sui wallet.
          </p>

          {/* Connected wallet state */}
          {account && (
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/80 flex items-center justify-between text-xs">
              <div className="flex flex-col truncate mr-2">
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Detected Wallet
                </span>
                <span className="font-mono text-xs text-foreground truncate">
                  {truncateAddress(account.address)}
                </span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isTestnet ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {currentNetwork || "testnet"}
              </span>
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center justify-end pt-1">
            {!account ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                disabled={isBusy}
                className="h-9 text-xs font-semibold"
              >
                <Wallet className="w-3.5 h-3.5 mr-1.5 text-primary" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleLink}
                disabled={isBusy || !isTestnet}
                className="h-9 text-xs font-semibold"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                    <span>Linking...</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                    <span>Link Connected Wallet</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
