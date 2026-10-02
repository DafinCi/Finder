"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Database,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { CareerMemory } from "@/features/memory/types/memory.types";

interface WalrusMetadata {
  network: string;
  explorerUrl: string;
  agentId: string | null;
  namespace: string;
  relayerUrl: string;
}

export default function WalrusMemoryInspector() {
  const [memories, setMemories] = useState<CareerMemory[]>([]);
  const [walrusMeta, setWalrusMeta] = useState<WalrusMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/memory");
      if (!res.ok) {
        throw new Error("Failed to fetch memories");
      }
      const data = await res.json();
      setMemories(data.memories || []);
      if (data.walrus) {
        setWalrusMeta(data.walrus);
      }
    } catch (err) {
      console.error("[WalrusMemoryInspector] Error:", err);
      toast.error("Could not load Walrus memory list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleCopyAgentId = () => {
    if (!walrusMeta?.agentId) return;
    navigator.clipboard.writeText(walrusMeta.agentId);
    setIsCopied(true);
    toast.success("Agent ID copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "career_goal":
        return "Career Goal";
      case "role_transition":
        return "Role Transition";
      case "work_preference":
        return "Work Preference";
      case "tech_focus":
        return "Technology Focus";
      case "constraint_avoid":
        return "Constraint / Avoid";
      case "user_correction":
        return "Correction";
      default:
        return category;
    }
  };

  const activeMemories = memories.filter((m) => m.status === "active");

  return (
    <div className="space-y-4 text-xs">
      {/* Network & Identity Card */}
      <div className="rounded-sm border border-border bg-secondary p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span>Storage Network</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Walrus Mainnet
          </span>
        </div>

        {/* DeepSurge Agent ID */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Registered Agent ID</span>
            {walrusMeta?.agentId && (
              <button
                type="button"
                onClick={handleCopyAgentId}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                title="Copy Agent ID"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="font-mono text-[11px] text-foreground bg-background p-2 rounded-sm border border-border break-all">
            {walrusMeta?.agentId || "0x14feb3ca03e713d91a3a3a0810d650fb25e19189fe50871ced0b1d56b1a87cdc"}
          </div>
        </div>

        {/* Relayer & Security Info */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px]">
          <div>
            <span className="text-muted-foreground block">Encryption</span>
            <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-primary" />
              Seal Onchain TEE
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Memory Space</span>
            <span className="font-medium text-foreground font-mono truncate block mt-0.5" title={walrusMeta?.namespace}>
              {walrusMeta?.namespace ? walrusMeta.namespace.replace("finder:user:", "user:") : "Active Space"}
            </span>
          </div>
        </div>
      </div>

      {/* Header and Refresh Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            Active Memories ({activeMemories.length})
          </span>
        </div>
        <button
          type="button"
          onClick={fetchMemories}
          disabled={isLoading}
          aria-label="Refresh memory list from Walrus"
          className="min-h-[36px] px-2.5 py-1 rounded-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 text-[11px] font-medium"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Memories List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-sm border border-border bg-card animate-pulse space-y-2"
            >
              <div className="h-3 bg-secondary rounded w-1/3" />
              <div className="h-4 bg-secondary rounded w-full" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : activeMemories.length === 0 ? (
        <div className="text-center p-6 border border-dashed border-border rounded-sm bg-card/50 space-y-2">
          <Database className="w-6 h-6 text-muted-foreground mx-auto opacity-50" />
          <p className="font-medium text-foreground">No memories stored yet</p>
          <p className="text-muted-foreground text-[11px] leading-relaxed max-w-[240px] mx-auto">
            Discuss your career goals, salary expectations, or preferences with Finder in the chat to anchor them on Walrus Mainnet.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeMemories.map((mem) => {
            const explorerUrl = mem.walrusBlobId
              ? `https://walruscan.com/mainnet/blob/${mem.walrusBlobId}`
              : null;

            return (
              <div
                key={mem.id}
                className="p-3.5 rounded-sm border border-border bg-card space-y-2.5 shadow-xs"
              >
                {/* Memory Category and Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-sm font-semibold text-[10px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {getCategoryLabel(mem.category)}
                  </span>
                  {mem.walrusBlobId ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      Mainnet Certified
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-500">
                      Syncing to Walrus...
                    </span>
                  )}
                </div>

                {/* Fact Content */}
                <p className="text-foreground text-xs leading-relaxed font-normal">
                  {mem.content}
                </p>

                {/* Walruscan Proof Link */}
                {explorerUrl && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline min-h-[28px]"
                      title="View certified blob on Walruscan Mainnet"
                    >
                      <span>Blob: {mem.walrusBlobId ? `${mem.walrusBlobId.slice(0, 8)}...${mem.walrusBlobId.slice(-6)}` : ""}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {mem.createdAt ? new Date(mem.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
