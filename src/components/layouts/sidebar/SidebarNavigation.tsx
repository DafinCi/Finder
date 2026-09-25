"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, BriefcaseBusiness, Settings } from "lucide-react";
import { useSessions } from "@/features/chat/hooks/useSessions";
import SessionHistoryList from "./SessionHistoryList";

export default function SidebarNavigation({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const {
    groupedSessions,
    isLoading,
    error,
    deletingId,
    refreshSessions,
    renameSession,
    deleteSession,
  } = useSessions();

  if (collapsed) {
    return (
      <nav className="flex-1 px-2 py-4 space-y-3 flex flex-col items-center">
        <Link
          href="/"
          className={`p-2.5 rounded-xl border transition-all ${
            pathname === "/"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border"
          }`}
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </Link>
        <Link
          href="/jobs"
          className={`p-2.5 rounded-xl border transition-all ${
            pathname === "/jobs"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border"
          }`}
          title="Explore Jobs"
        >
          <BriefcaseBusiness className="w-4 h-4" />
        </Link>
        <Link
          href="/settings"
          className={`p-2.5 rounded-xl border transition-all ${
            pathname === "/settings"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border"
          }`}
          title="Settings & Wallet"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex-1 flex flex-col px-3 py-3 overflow-hidden min-h-0 no-scrollbar">
      {/* Primary Action Button: New Chat */}
      <Link
        href="/"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-95 transition-all active:scale-[0.98] mb-3"
      >
        <Plus className="w-4 h-4" />
        <span>New Chat</span>
      </Link>

      {/* Quick Nav Links */}
      <div className="space-y-1 mb-3">
        <Link
          href="/jobs"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/jobs"
              ? "bg-secondary text-foreground font-semibold"
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          }`}
        >
          <BriefcaseBusiness className="w-3.5 h-3.5 text-primary" />
          <span>Explore Jobs</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-secondary text-foreground font-semibold"
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-primary" />
          <span>Settings & Wallet</span>
        </Link>
      </div>

      <hr className="border-border/60 my-1 mx-2" />

      {/* Dynamic Session History */}
      <div className="flex-1 overflow-hidden flex flex-col mt-2 min-h-0 no-scrollbar">
        <SessionHistoryList
          groupedSessions={groupedSessions}
          isLoading={isLoading}
          error={error}
          deletingId={deletingId}
          onRetry={refreshSessions}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
        />
      </div>
    </nav>
  );
}
