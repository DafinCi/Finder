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
  FlaskConical,
  MessageSquarePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CareerMemory } from "@/features/memory/types/memory.types";
import { useAgent } from "@/contexts/AgentContext";

interface WalrusMetadata {
  network: string;
  explorerUrl: string;
  agentId: string | null;
  namespace: string;
  relayerUrl: string;
}

export default function WalrusMemoryInspector() {
  const router = useRouter();
  const {
    isAmnesiaMode,
    toggleAmnesiaMode,
    setIsAmnesiaMode,
    closeDrawer,
  } = useAgent();
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

  const handleStartCleanBenchmark = () => {
    closeDrawer();
    if (isAmnesiaMode) {
      toast.success("Opening clean benchmark session with Amnesia active", {
        description: "Zero conversation history. Walrus Memory recall bypassed.",
      });
      router.push("/c?demo=stateless");
    } else {
      toast.success("Opening clean session with Walrus Memory active", {
        description: "Zero conversation history. Verifies cross-session recall.",
      });
      router.push("/c");
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

      {/* Reviewer Benchmark: Before vs After Simulation */}
      <div className="rounded-sm border border-border bg-secondary/60 p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <FlaskConical className="w-3.5 h-3.5 text-primary" />
            <span>Reviewer Benchmark: Before vs After</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold border ${
              isAmnesiaMode
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAmnesiaMode ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {isAmnesiaMode ? "Amnesia Active" : "Walrus Active"}
          </span>
        </div>

        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Simulate how Finder behaves without decentralized memory context vs with persistent Walrus Mainnet grounding.
        </p>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-2.5 rounded-sm bg-background border border-border">
          <div className="space-y-0.5 pr-2">
            <span className="font-semibold text-foreground block text-xs">
              Simulate Amnesia (Memory OFF)
            </span>
            <span className="text-muted-foreground text-[11px] block">
              Bypasses memory recall on the next chat turn.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAmnesiaMode}
            aria-label="Toggle Amnesia Mode for Reviewer Benchmark"
            onClick={toggleAmnesiaMode}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isAmnesiaMode ? "bg-amber-500" : "bg-muted"
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                isAmnesiaMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Clean Benchmark Session Launcher */}
        <div className="space-y-1.5 pt-0.5">
          <button
            type="button"
            onClick={handleStartCleanBenchmark}
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-sm text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer border shadow-2xs ${
              isAmnesiaMode
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
            }`}
          >
            <MessageSquarePlus className="w-4 h-4 shrink-0" />
            <span>
              {isAmnesiaMode
                ? "Start Clean Amnesia Session (Memory OFF)"
                : "Test Memory in Clean Session (Memory ON)"}
            </span>
          </button>
          <p className="text-[10px] text-muted-foreground leading-normal px-0.5">
            Tip: A fresh session isolates long-term Walrus memory from active in-session chat context.
          </p>
        </div>

        {/* Quick Benchmark Prompts */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-foreground block">
            Suggested Verification Prompts:
          </span>
          <div className="space-y-1.5">
            {[
              "What are my salary expectations and remote work preferences?",
              "Which blockchain ecosystem and tech stack do I specialize in?",
              "What company types or roles did I ask to avoid?",
            ].map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(promptText);
                  toast.success("Benchmark prompt copied to clipboard");
                }}
                className="w-full text-left p-2 rounded-sm bg-card hover:bg-card/80 border border-border/80 text-[11px] text-foreground flex items-center justify-between gap-2 transition-colors cursor-pointer group min-h-[36px]"
                title="Click to copy benchmark prompt"
              >
                <span className="truncate">"{promptText}"</span>
                <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Architectural Contrast */}
        <div className="pt-2 border-t border-border space-y-2">
          <span className="text-[11px] font-semibold text-foreground block">
            Architectural Contrast:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-sm bg-background/80 border border-border space-y-1">
              <span className="font-semibold text-amber-600 dark:text-amber-400 block">
                Without Memory (Amnesia)
              </span>
              <ul className="text-muted-foreground space-y-1 list-disc pl-3">
                <li>Cold start every session</li>
                <li>Repetitive qualification questions</li>
                <li>Forgets user constraints</li>
              </ul>
            </div>
            <div className="p-2 rounded-sm bg-background/80 border border-border space-y-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                With Walrus Memory
              </span>
              <ul className="text-muted-foreground space-y-1 list-disc pl-3">
                <li>Instant cross-session recall</li>
                <li>Seal TEE onchain encryption</li>
                <li>Sovereign forget lifecycle</li>
              </ul>
            </div>
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
