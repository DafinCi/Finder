"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMemoryFeed } from "../hooks/useMemoryFeed";

export function MemoryProofCard() {
  const { data, isLoading, isFetching, error, refetch } = useMemoryFeed();
  const stats = data?.stats ?? null;
  const walrusMeta = data?.walrus ?? null;
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || "Could not load memory proof.");
    }
  }, [error]);

  const handleCopy = () => {
    const lines = [
      "# Walrus Memory Evidence",
      `Network: ${walrusMeta?.network || "unknown"}`,
      `Agent ID: ${walrusMeta?.agentId || "not configured"}`,
      `Memory space: ${walrusMeta?.namespace || "unknown"}`,
      `Memories: ${stats?.total ?? 0}`,
      `Synced to Mainnet: ${stats?.stored ?? 0}`,
      `Pending sync: ${stats?.pending ?? 0}`,
      `Failed sync: ${stats?.failed ?? 0}`,
      `Last sync: ${stats?.lastStoredAt || "not yet"}`,
    ];

    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        setIsCopied(true);
        toast.success("Evidence summary copied.");
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => toast.error("Could not copy the evidence summary."));
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Memory proof
            </h2>
            <p className="text-xs text-muted-foreground">
              What this account has stored on Walrus Memory
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Refresh memory proof"
          title="Refresh memory proof"
          className="p-2 rounded-sm bg-secondary/30 border border-border/60 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
          Loading memory proof
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Network</dt>
              <dd className="font-medium text-foreground">
                {walrusMeta?.network === "mainnet"
                  ? "Walrus Mainnet"
                  : walrusMeta?.network || "Unknown"}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-muted-foreground">Memory space</dt>
              <dd className="font-mono text-foreground break-all">
                {walrusMeta?.namespace?.replace("finder:user:", "user:") ||
                  "Unknown"}
              </dd>
            </div>
            <div className="space-y-0.5 sm:col-span-2">
              <dt className="text-muted-foreground">Agent ID</dt>
              <dd className="font-mono text-foreground break-all">
                {walrusMeta?.agentId || "Not configured"}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Memories" value={stats?.total ?? 0} />
            <Stat label="On Mainnet" value={stats?.stored ?? 0} />
            <Stat label="Pending" value={stats?.pending ?? 0} />
            <Stat label="Failed" value={stats?.failed ?? 0} />
          </div>

          {stats?.stored === 0 && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              No memories are certified on Mainnet yet. Ask Finder to remember
              something in chat, then refresh this card.
            </p>
          )}

          {stats?.lastStoredAt && (
            <p className="text-[11px] text-muted-foreground">
              Last sync: {new Date(stats.lastStoredAt).toLocaleString()}
            </p>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-secondary border border-border hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy evidence summary
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border/70 bg-secondary/30 px-3 py-2 space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
