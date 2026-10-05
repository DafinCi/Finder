"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Wallet,
  Mail,
  Brain,
  Database,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCareerProfile } from "@/features/profile/hooks/useCareerProfile";
import { SuiWalletLinkCard } from "@/features/sui/components/SuiWalletLinkCard";
import { WalrusStorageCard } from "@/features/walrus/components/WalrusStorageCard";
import { MemoryManagementCard } from "@/features/memory/components/MemoryManagementCard";
import { MemoryProofCard } from "@/features/memory/components/MemoryProofCard";
import { isSyntheticSuiEmail } from "@/lib/sui/auth-abstraction";
import UserAvatar from "@/components/ui/UserAvatar";
import AppHeader from "@/components/layouts/AppHeader";
import { toast } from "sonner";

export type SettingsTab = "account" | "wallet" | "memories" | "storage";

export interface TabConfig {
  id: SettingsTab;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SETTINGS_TABS: TabConfig[] = [
  {
    id: "account",
    title: "Account & Identity",
    subtitle: "Email credentials, account ID & sign out",
    icon: User,
  },
  {
    id: "wallet",
    title: "Web3 Wallet",
    subtitle: "Sui address, network & SIWS signature",
    icon: Wallet,
  },
  {
    id: "memories",
    title: "Career Memories",
    subtitle: "Sovereign facts, preferences & overrides",
    icon: Brain,
  },
  {
    id: "storage",
    title: "Walrus Storage",
    subtitle: "Decentralized blob storage & passport certification",
    icon: Database,
  },
];

const TAB_PARAM_EVENT = "finder:settings-tab-changed";

function subscribeToTabParam(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(TAB_PARAM_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(TAB_PARAM_EVENT, onStoreChange);
  };
}

function readTabFromUrl(): SettingsTab {
  const paramTab = new URLSearchParams(window.location.search).get(
    "tab",
  ) as SettingsTab | null;
  return paramTab && SETTINGS_TABS.some((tab) => tab.id === paramTab)
    ? paramTab
    : "account";
}

export default function SettingsPage() {
  const { user, loading: loadingAuth, handleLogout } = useAuth();
  const { profile, primaryRole } = useCareerProfile();

  const [copiedId, setCopiedId] = useState(false);

  // The URL is the source of truth for the active tab, which keeps deep links
  // working without a mount effect and avoids a hydration mismatch.
  const activeTab = useSyncExternalStore(
    subscribeToTabParam,
    readTabFromUrl,
    () => "account",
  );

  const handleSelectTab = (tab: SettingsTab) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
    window.dispatchEvent(new Event(TAB_PARAM_EVENT));
  };

  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Candidate");
  const userEmail = user?.email || "";
  const isSuiOnlyUser = Boolean(userEmail && isSyntheticSuiEmail(userEmail));
  const primaryRoleTitle =
    primaryRole?.role || profile?.careerIntent?.target_roles?.[0]?.role;

  const currentTabConfig =
    SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  const handleCopyAccountId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      toast.success("Account ID copied to clipboard.");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Application Header */}
      <AppHeader title="Settings" />

      {/* Main Single-Column Content Canvas */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Horizontal Segmented Tabs Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-sm border border-border/80 overflow-x-auto no-scrollbar">
            {SETTINGS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3.5 py-2.5 rounded-sm text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer shrink-0
                    ${
                      isActive
                        ? "bg-card text-foreground font-semibold border border-border shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  />
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Account & Identity (Single Canonical Profile & Credentials) */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-6 shadow-xs">
                {/* Canonical Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70">
                  <div className="flex items-center gap-4 min-w-0">
                    <UserAvatar
                      name={userName}
                      seed={user?.email || userName}
                      size="xl"
                      className="ring-2 ring-border/80 shadow-xs shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold font-heading text-foreground truncate">
                        {userName}
                      </h3>
                      {primaryRoleTitle && (
                        <p className="text-xs text-muted-foreground font-medium truncate flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span>{primaryRoleTitle}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-0.5">
                        {profile?.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Profile
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            Draft Profile
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-border bg-secondary/60 hover:bg-secondary text-foreground transition-colors cursor-pointer self-start sm:self-center shrink-0"
                  >
                    <span>View Career Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                </div>

                {/* Account Credentials Grid */}
                {loadingAuth ? (
                  <div className="py-6 text-xs text-muted-foreground animate-pulse">
                    Loading account details...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Email Card */}
                    <div className="p-4 rounded-sm bg-secondary/30 border border-border/70 space-y-1.5">
                      <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        Email / Identifier
                      </span>
                      <p className="font-mono text-foreground font-medium truncate">
                        {isSuiOnlyUser
                          ? "Sui Web3 Account (Synthetic ID)"
                          : user?.email || "No email assigned"}
                      </p>
                      <span className="text-[10px] text-muted-foreground block leading-relaxed">
                        {isSuiOnlyUser
                          ? `Synthetic domain: ${user?.email}`
                          : "Primary authenticated email"}
                      </span>
                    </div>

                    {/* Account ID Card */}
                    <div className="p-4 rounded-sm bg-secondary/30 border border-border/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                          Account ID
                        </span>
                        {user?.id && (
                          <button
                            type="button"
                            onClick={handleCopyAccountId}
                            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            title="Copy Account ID"
                            aria-label="Copy Account ID"
                          >
                            {copiedId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="font-mono text-foreground font-medium truncate text-xs">
                        {user?.id || "N/A"}
                      </p>
                      <span className="text-[10px] text-muted-foreground block leading-relaxed">
                        Unique account UUID for identity &amp; encryption
                      </span>
                    </div>
                  </div>
                )}

                {/* Session Sign Out Action */}
                <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Sign Out of Session
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      End your authenticated session safely on this browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm border border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Web3 Wallet */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              <SuiWalletLinkCard />
            </div>
          )}

          {/* Tab 3: Career Memories */}
          {activeTab === "memories" && (
            <div className="space-y-6">
              <MemoryProofCard />
              <MemoryManagementCard />
            </div>
          )}

          {/* Tab 4: Walrus Storage */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <WalrusStorageCard />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
