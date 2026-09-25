"use client";

import React from "react";
import { User, Shield, Wallet, Mail } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SuiWalletLinkCard } from "@/features/sui/components/SuiWalletLinkCard";
import { isSyntheticSuiEmail } from "@/lib/sui/auth-abstraction";

export default function SettingsPage() {
  const { user, loading } = useAuth();

  const isSuiOnlyUser = Boolean(user?.email && isSyntheticSuiEmail(user.email));

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your account credentials, security preferences, and linked Sui
          Web3 identities.
        </p>
      </div>

      {/* Account Profile Overview */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Account Overview
            </h2>
            <p className="text-xs text-muted-foreground">
              Your primary application identity and authentication methods
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-4 text-xs text-muted-foreground animate-pulse">
            Loading account details...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-primary" />
                Email / Identifier
              </span>
              <p className="font-mono text-foreground font-medium truncate">
                {isSuiOnlyUser
                  ? "Sui Web3 Account (Synthetic ID)"
                  : user?.email || "No email assigned"}
              </p>
              {isSuiOnlyUser && (
                <span className="text-[10px] text-muted-foreground block">
                  Synthetic domain: {user?.email}
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-primary" />
                Canonical User ID
              </span>
              <p className="font-mono text-foreground font-medium truncate">
                {user?.id || "N/A"}
              </p>
              <span className="text-[10px] text-muted-foreground block">
                Primary Supabase auth.users identifier
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sui Wallet Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold font-heading text-foreground">
            Web3 Authentication & Wallet
          </h2>
        </div>
        <SuiWalletLinkCard />
      </div>
    </div>
  );
}
